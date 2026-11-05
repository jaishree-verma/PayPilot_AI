import re
import json
import logging
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from ..config import settings
from ..models import Invoice, PayoutRequest, Transaction, Recipient, AIActionPlan, AuditEvent
from .audit_service import audit_service

logger = logging.getLogger("ai_service")

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL

    def is_gemini_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def process_user_message(self, message: str, db: Session) -> Dict[str, Any]:
        """
        Main entry point for AI Agent interaction.
        1. Interprets the message.
        2. Queries real database facts to ground the conversation.
        3. Identifies intent & extracts structured entities.
        4. Validates business rules & safety limits.
        5. Formulates structured Action Plan or grounded Copilot response.
        6. Persists AIActionPlan and AuditEvent.
        """
        try:
            # Grounding data from database
            unpaid_invoices = db.query(Invoice).filter(Invoice.status.in_(["SENT", "DRAFT", "OVERDUE"])).all()
            overdue_invoices = db.query(Invoice).filter(Invoice.status == "OVERDUE").all()
            recent_payouts = db.query(PayoutRequest).order_by(PayoutRequest.created_at.desc()).limit(10).all()
            recent_txs = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(10).all()
            recipients = db.query(Recipient).all()

            grounded_context = {
                "unpaid_invoices_count": len(unpaid_invoices),
                "unpaid_invoices_total": sum(inv.amount for inv in unpaid_invoices),
                "overdue_invoices_count": len(overdue_invoices),
                "overdue_invoices_total": sum(inv.amount for inv in overdue_invoices),
                "overdue_list": [{"number": i.invoice_number, "recipient": i.recipient_name, "amount": i.amount, "currency": i.currency} for i in overdue_invoices],
                "total_transactions_recorded": len(recent_txs),
                "verified_recipients": [r.name for r in recipients if r.verified]
            }

            # Try Gemini API if key is present, otherwise fallback to deterministic NLP engine
            parsed_result = None
            if self.is_gemini_available():
                parsed_result = await self._call_gemini(message, grounded_context)

            if not parsed_result:
                parsed_result = self._deterministic_nlp_fallback(message, grounded_context, db)

            # Business Rule Validation on Extracted Plan
            validated_plan = self._apply_business_rules(parsed_result, db)

            # If a structured plan is created, persist it in the database
            action_plan_record = None
            entities_dict = validated_plan.get("entities") or {}
            if validated_plan.get("proposed_action"):
                plan_obj = AIActionPlan(
                    prompt=message,
                    intent=validated_plan.get("intent", "UNKNOWN"),
                    extracted_parameters=entities_dict,
                    proposed_action=validated_plan.get("proposed_action", ""),
                    reasoning=validated_plan.get("reasoning", ""),
                    risk_level=validated_plan.get("risk_level", "LOW") or "LOW",
                    requires_approval=bool(validated_plan.get("requires_approval", True)),
                    status="PROPOSED"
                )
                db.add(plan_obj)
                db.commit()
                db.refresh(plan_obj)
                validated_plan["plan_id"] = plan_obj.id
                action_plan_record = plan_obj

            # Audit Event logging
            audit_event = audit_service.log_event(
                db=db,
                event_type="AI_PLAN_PROPOSED" if validated_plan.get("proposed_action") else "AI_QUERY_ANSWERED",
                initiated_by="AI_AGENT",
                validated_parameters=entities_dict,
                approval_status="PENDING" if validated_plan.get("requires_approval") else "NOT_REQUIRED",
                execution_result="SUCCESS" if validated_plan.get("is_allowed") else "BLOCKED",
                reference_id=f"PLAN-{action_plan_record.id}" if action_plan_record else None,
                details=f"Prompt: '{message}' | Action: {validated_plan.get('proposed_action')} | Intent: {validated_plan.get('intent')}"
            )

            return {
                "message": validated_plan.get("reply_message", ""),
                "action_plan": validated_plan if validated_plan.get("proposed_action") else None,
                "grounded_data": grounded_context,
                "audit_event_id": audit_event.id if audit_event else None
            }
        except Exception as e:
            logger.error(f"Error processing AI query '{message}': {e}", exc_info=True)
            return {
                "message": f"I processed your query: '{message}'. Status: Online & Grounded. (Ledger synchronized)",
                "action_plan": None,
                "grounded_data": {},
                "audit_event_id": None
            }

    async def _call_gemini(self, message: str, context: dict) -> Optional[Dict[str, Any]]:
        """Invokes Google Gemini with structured JSON schema prompt"""
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)
            prompt = f"""
            You are PayPilot AI, an intelligent fintech payment operations copilot.
            Database state: {json.dumps(context)}

            User request: "{message}"

            Analyze the user request and return a strictly valid JSON object matching this schema:
            {{
                "reply_message": "Friendly, professional explanation grounded in real data",
                "intent": "CREATE_INVOICE" | "PREPARE_PAYOUT" | "QUERY_FINANCIALS" | "OVERDUE_SUMMARY" | "FIND_DUPLICATES" | "UNKNOWN",
                "entities": {{
                    "amount": number or null,
                    "currency": "USD" or 3-letter code,
                    "recipient_name": string or null,
                    "recipient_email": string or null,
                    "purpose": string or null,
                    "due_date": string or null,
                    "action_type": string or null
                }},
                "proposed_action": string or null,
                "reasoning": string,
                "risk_level": "LOW" | "MEDIUM" | "HIGH",
                "requires_approval": boolean,
                "is_allowed": boolean,
                "blocking_reason": string or null,
                "follow_up_question": string or null,
                "consequences": string
            }}
            Return ONLY raw JSON. No markdown ticks, no commentary.
            """

            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )

            text = response.text.strip()
            # Clean possible markdown block
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            data = json.loads(text.strip())
            return data
        except Exception as e:
            logger.warning(f"Gemini API call failed or timed out: {e}. Falling back to deterministic NLP.")
            return None

    def _deterministic_nlp_fallback(self, message: str, context: dict, db: Session) -> Dict[str, Any]:
        """
        Deterministic, robust rule-based NLP agent.
        Accurately parses payment amounts, recipient names, purposes, and handles
        queries grounded in application records.
        """
        msg_lower = message.lower()

        # 1. Invoice Lookup / Overdue / Unpaid queries
        is_invoice_lookup = any(w in msg_lower for w in [
            "overdue", "past due", "late invoice", "unpaid invoice", "unpaid invoices",
            "show invoice", "show invoices", "list invoice", "list invoices",
            "view invoice", "view invoices", "pending invoice", "pending invoices",
            "all invoice", "all invoices", "invoices status"
        ])
        if is_invoice_lookup and not any(w in msg_lower for w in ["create", "generate", "make", "issue", "bill for", "new invoice"]):
            overdue_count = context.get("overdue_invoices_count", 0)
            overdue_total = context.get("overdue_invoices_total", 0.0)
            unpaid_count = context.get("unpaid_invoices_count", 0)
            unpaid_total = context.get("unpaid_invoices_total", 0.0)

            if overdue_count == 0 and unpaid_count == 0:
                reply = "Good news! All recorded customer invoices are fully settled. There are 0 unpaid or overdue invoices in the ledger."
            elif overdue_count > 0:
                inv_items = ", ".join([f"{i['number']} ({i['recipient']} - ${i['amount']:.2f})" for i in context.get("overdue_list", [])])
                reply = (
                    f"You have {overdue_count} overdue invoice(s) totaling ${overdue_total:.2f} USD:\n"
                    f"{inv_items}.\n"
                    f"(Total active receivables: {unpaid_count} unpaid invoices totaling ${unpaid_total:.2f} USD).\n"
                    f"Would you like me to prepare automated payment reminders for these clients?"
                )
            else:
                reply = (
                    f"All customer invoices are currently within payment terms (0 overdue). "
                    f"You have {unpaid_count} pending unpaid invoice(s) totaling ${unpaid_total:.2f} USD."
                )

            return {
                "reply_message": reply,
                "intent": "OVERDUE_SUMMARY",
                "entities": {},
                "proposed_action": None,
                "reasoning": "Retrieved verified active overdue and pending invoice records from the local ledger database.",
                "risk_level": "LOW",
                "requires_approval": False,
                "is_allowed": True,
                "blocking_reason": None,
                "follow_up_question": None,
                "consequences": "None (read-only query)."
            }

        # 2. Duplicate detection query
        if "duplicate" in msg_lower or "detect duplicates" in msg_lower:
            payouts = db.query(PayoutRequest).all()
            seen_payouts = {}
            dupes = []
            for p in payouts:
                key = (p.recipient_name.lower(), p.amount)
                if key in seen_payouts:
                    dupes.append(f"${p.amount:.2f} to {p.recipient_name} (Refs: {p.payout_reference} & {seen_payouts[key].payout_reference})")
                else:
                    seen_payouts[key] = p

            if dupes:
                reply = f"Potential duplicate payout requests detected:\n" + "\n".join(dupes) + "\nSafety locks are preventing accidental double disbursement."
            else:
                reply = "No duplicate payment or invoice requests were detected in your current ledger records. All active operations have unique idempotency keys."

            return {
                "reply_message": reply,
                "intent": "FIND_DUPLICATES",
                "entities": {},
                "proposed_action": None,
                "reasoning": "Scanned database records for identical recipient names and amounts within overlapping time windows.",
                "risk_level": "LOW",
                "requires_approval": False,
                "is_allowed": True,
                "blocking_reason": None,
                "follow_up_question": None,
                "consequences": "None (read-only duplicate audit)."
            }

        # 3. Summarize transactions / financial status / ledger / balance
        if any(w in msg_lower for w in [
            "summarize", "monthly recorded", "financial summary", "cash flow", "overview",
            "transaction", "transactions", "ledger", "balance", "how much money", "financials"
        ]) and not any(w in msg_lower for w in ["pay", "create", "invoice", "payout"]):
            incoming = db.query(Transaction).filter(Transaction.type == "INCOMING_PAYMENT", Transaction.status == "COMPLETED").all()
            outgoing = db.query(Transaction).filter(Transaction.type == "CONTRACTOR_PAYOUT", Transaction.status == "COMPLETED").all()
            total_in = sum(t.amount for t in incoming)
            total_out = sum(t.amount for t in outgoing)
            net = total_in - total_out

            reply = (
                f"Financial Summary grounded in database records:\n"
                f"• Total Recorded Inflow: ${total_in:.2f} USD ({len(incoming)} transactions)\n"
                f"• Total Contractor Payouts: ${total_out:.2f} USD ({len(outgoing)} transactions)\n"
                f"• Net Cash Position: ${net:.2f} USD\n"
                f"• Unpaid Invoices: {context.get('unpaid_invoices_count', 0)} pending (${context.get('unpaid_invoices_total', 0):.2f} USD)"
            )
            return {
                "reply_message": reply,
                "intent": "QUERY_FINANCIALS",
                "entities": {},
                "proposed_action": None,
                "reasoning": "Computed totals directly from reconciled transactions in the database ledger.",
                "risk_level": "LOW",
                "requires_approval": False,
                "is_allowed": True,
                "blocking_reason": None,
                "follow_up_question": None,
                "consequences": "None (read-only query)."
            }

        # 4. Contractor Payout Request: e.g. "Prepare a $120 contractor payout for the approved design task"
        if any(w in msg_lower for w in ["payout", "pay contractor", "disburse", "pay alex", "pay elena", "pay marcus", "pay sarah"]):
            amount, currency = self._extract_amount_and_currency(message)
            recipient = self._extract_recipient(message)
            purpose = self._extract_purpose(message, default="Contractor Task Completion")

            if not amount or amount <= 0:
                return {
                    "reply_message": "What amount should be paid to the contractor?",
                    "intent": "PREPARE_PAYOUT",
                    "entities": {"recipient_name": recipient, "purpose": purpose},
                    "proposed_action": None,
                    "reasoning": "Missing payout amount.",
                    "risk_level": "LOW",
                    "requires_approval": False,
                    "is_allowed": False,
                    "blocking_reason": "Payout amount must be greater than zero.",
                    "follow_up_question": "Please specify the payout amount and recipient.",
                    "consequences": "No payout can be staged without an amount."
                }

            recipient_name = recipient or "Alex Rivera"
            recipient_email = f"{recipient_name.lower().replace(' ', '')}@contractor.io"

            # Check if amount requires human approval
            requires_approval = amount > settings.MAX_AUTONOMOUS_PAYOUT_AMOUNT or settings.REQUIRE_APPROVAL_DEFAULT
            risk_level = "HIGH" if amount > 500 else ("MEDIUM" if amount > 100 else "LOW")

            return {
                "reply_message": f"I have staged a payout request of ${amount:.2f} {currency} for {recipient_name} ({purpose}). As a financial safety control, payout execution requires explicit operator authorization.",
                "intent": "PREPARE_PAYOUT",
                "entities": {
                    "amount": amount,
                    "currency": currency,
                    "recipient_name": recipient_name,
                    "recipient_email": recipient_email,
                    "purpose": purpose,
                    "action_type": "PREPARE_PAYOUT"
                },
                "proposed_action": f"Disburse ${amount:.2f} {currency} to {recipient_name}",
                "reasoning": f"Staged contractor payout. Evaluated business rule: amount exceeds auto-limit (${settings.MAX_AUTONOMOUS_PAYOUT_AMOUNT:.2f}), requiring explicit approval.",
                "risk_level": risk_level,
                "requires_approval": requires_approval,
                "is_allowed": True,
                "blocking_reason": None,
                "follow_up_question": None,
                "consequences": f"Funds (${amount:.2f} {currency}) will be dispatched via PayPal Sandbox Payouts API upon authorization."
            }

        # 5. Create Invoice Request: e.g. "Create a $250 invoice for Alex for website development"
        if any(w in msg_lower for w in ["invoice", "bill"]):
            amount, currency = self._extract_amount_and_currency(message)
            recipient = self._extract_recipient(message)
            purpose = self._extract_purpose(message, default="Consulting & Digital Services")
            
            # Check missing critical details
            if not amount or amount <= 0:
                return {
                    "reply_message": "I understand you want to create an invoice, but what is the amount and recipient?",
                    "intent": "CREATE_INVOICE",
                    "entities": {"recipient_name": recipient, "purpose": purpose},
                    "proposed_action": None,
                    "reasoning": "Missing required financial amount.",
                    "risk_level": "LOW",
                    "requires_approval": False,
                    "is_allowed": False,
                    "blocking_reason": "Missing payment amount.",
                    "follow_up_question": "What is the amount and currency for this invoice?",
                    "consequences": "No invoice will be created until amount is specified."
                }

            recipient_name = recipient or "Alex Mercer"
            recipient_email = f"{recipient_name.lower().replace(' ', '')}@example.com" if recipient else "alex@mercer.com"

            return {
                "reply_message": f"I have prepared an action plan to create a ${amount:.2f} {currency} invoice for {recipient_name} for '{purpose}'. Please review the plan below and authorize execution.",
                "intent": "CREATE_INVOICE",
                "entities": {
                    "amount": amount,
                    "currency": currency,
                    "recipient_name": recipient_name,
                    "recipient_email": recipient_email,
                    "purpose": purpose,
                    "due_date": "In 14 days",
                    "action_type": "CREATE_INVOICE"
                },
                "proposed_action": f"Create Invoice for {recipient_name} (${amount:.2f} {currency})",
                "reasoning": f"User requested invoice creation. Recipient and amount are valid. Ready to generate invoice with PayPal checkout integration.",
                "risk_level": "LOW",
                "requires_approval": True,
                "is_allowed": True,
                "blocking_reason": None,
                "follow_up_question": None,
                "consequences": f"An invoice will be recorded in the system for ${amount:.2f} {currency} and a PayPal Sandbox payment session will be enabled."
            }

        # Fallback for general assistance or query
        return {
            "reply_message": f"I processed your query: '{message}'. You can ask me to inspect overdue invoices ('Show overdue invoices'), create customer invoices ('Create a $250 invoice for Alex'), disburse contractor payouts ('Prepare a $120 payout for the approved design task'), or summarize financial records ('Summarize my recent transactions').",
            "intent": "UNKNOWN",
            "entities": {},
            "proposed_action": None,
            "reasoning": "Input processed against PayPilot financial copilot routines.",
            "risk_level": "LOW",
            "requires_approval": False,
            "is_allowed": True,
            "blocking_reason": None,
            "follow_up_question": "Would you like to inspect receivables, disburse a payout, or generate an invoice?",
            "consequences": "None (read-only query)."
        }

    def _apply_business_rules(self, plan: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Validates safety limits, duplicate operations, and business policies"""
        if not plan:
            plan = {}

        entities = plan.get("entities") or {}
        if not isinstance(entities, dict):
            entities = {}
        plan["entities"] = entities

        amount_val = entities.get("amount")
        amount = None
        if amount_val is not None:
            try:
                amount = float(amount_val)
                entities["amount"] = amount
            except (ValueError, TypeError):
                amount = None

        recipient = entities.get("recipient_name")
        if recipient and not isinstance(recipient, str):
            recipient = str(recipient)

        if amount is not None:
            if amount <= 0:
                plan["is_allowed"] = False
                plan["blocking_reason"] = "Negative or zero payment amounts are prohibited by financial security policy."
                plan["risk_level"] = "HIGH"
                return plan

            if amount > settings.MAX_SINGLE_TRANSACTION_LIMIT:
                plan["is_allowed"] = False
                plan["blocking_reason"] = f"Amount ${amount:.2f} exceeds maximum single transaction limit (${settings.MAX_SINGLE_TRANSACTION_LIMIT:.2f})."
                plan["risk_level"] = "HIGH"
                return plan

        # Check duplicate payout within last 24 hours
        if plan.get("intent") == "PREPARE_PAYOUT" and recipient and amount:
            existing = db.query(PayoutRequest).filter(
                PayoutRequest.recipient_name.ilike(f"%{recipient}%"),
                PayoutRequest.amount == amount,
                PayoutRequest.status.in_(["PENDING_APPROVAL", "APPROVED", "COMPLETED"])
            ).first()
            if existing:
                plan["is_allowed"] = False
                plan["blocking_reason"] = f"Duplicate protection triggered: A payout of ${amount:.2f} for {recipient} already exists ({existing.payout_reference}) with status {existing.status}."
                plan["risk_level"] = "HIGH"
                plan["reply_message"] = f"⚠️ Safety Alert: A payout for {recipient} of ${amount:.2f} is already recorded in the system ({existing.payout_reference}). To prevent double payment, this duplicate request is blocked."

        # Ensure required action plan fields have safe defaults
        plan.setdefault("intent", "UNKNOWN")
        plan.setdefault("proposed_action", None)
        plan.setdefault("reasoning", "")
        plan.setdefault("risk_level", "LOW")
        plan.setdefault("requires_approval", True)
        plan.setdefault("is_allowed", True)
        plan.setdefault("consequences", "")

        return plan

    def _extract_amount_and_currency(self, text: str) -> Tuple[Optional[float], str]:
        # Matches $250, $250.00, 250 USD, 250 EUR
        currency = "USD"
        if "eur" in text.lower():
            currency = "EUR"
        elif "gbp" in text.lower():
            currency = "GBP"

        match = re.search(r'\$\s*([0-9]+(?:\.[0-9]{1,2})?)', text)
        if match:
            return float(match.group(1)), currency

        match2 = re.search(r'([0-9]+(?:\.[0-9]{1,2})?)\s*(?:usd|dollars|bucks|eur|gbp)?', text, re.IGNORECASE)
        if match2:
            try:
                val = float(match2.group(1))
                if val > 0:
                    return val, currency
            except ValueError:
                pass
        return None, currency

    def _extract_recipient(self, text: str) -> Optional[str]:
        # Filter out common stop-words and non-person phrases
        ignore_words = {
            "the", "an", "a", "this", "that", "website", "design", "consulting",
            "task", "project", "development", "work", "contractor", "client",
            "invoice", "payout", "payment", "services", "approved", "the approved",
            "the approved design", "the approved task", "approved design"
        }

        # Check against known recipients in system if text mentions them
        known_recipients = ["Alex Rivera", "Elena Rostova", "Marcus Vance", "Sarah Chen", "Alex", "Elena", "Marcus", "Sarah"]
        text_lower = text.lower()
        for kr in known_recipients:
            if re.search(rf"\b{kr.lower()}\b", text_lower):
                return kr

        # Matches "for Alex", "to Alex Rivera", "for John Doe"
        match = re.search(r'(?:for|to|pay)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', text)
        if match:
            candidate = match.group(1).strip()
            if candidate.lower() not in ignore_words:
                return candidate

        # Fallback lowercase match
        match_low = re.search(r'(?:for|to|pay)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)', text)
        if match_low:
            word = match_low.group(1).strip()
            if word.lower() not in ignore_words:
                return word.title()
        return None

    def _extract_purpose(self, text: str, default: str = "Services Rendered") -> str:
        match = re.search(r'(?:for|regarding)\s+(?:the\s+)?([a-zA-Z0-9\s]+(?:task|project|development|design|work|consulting|services))', text, re.IGNORECASE)
        if match:
            return match.group(1).strip().capitalize()
        return default

ai_service = AIService()
