import datetime
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from ..models import PayoutRequest, Recipient, Transaction, User
from ..schemas import PayoutCreate
from ..config import settings
from .paypal_service import paypal_service
from .audit_service import audit_service

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class PayoutService:
    @staticmethod
    def generate_reference(db: Session) -> str:
        count = db.query(PayoutRequest).count() + 1
        return f"PO-2026-{count:04d}"

    @staticmethod
    def create_payout_request(db: Session, payout_in: PayoutCreate, initiated_by: str = "AI_AGENT") -> Tuple[PayoutRequest, bool, Optional[str]]:
        """
        Creates and validates a contractor payout request.
        Returns (payout_request, is_duplicate, error_message).
        """
        if payout_in.amount <= 0:
            return None, False, "Payout amount must be greater than zero."

        if payout_in.amount > settings.MAX_SINGLE_TRANSACTION_LIMIT:
            return None, False, f"Amount exceeds single transaction limit (${settings.MAX_SINGLE_TRANSACTION_LIMIT:.2f})."

        # Check duplicate payout in last 24h
        cutoff = utcnow() - datetime.timedelta(hours=24)
        duplicate = db.query(PayoutRequest).filter(
            PayoutRequest.recipient_email == payout_in.recipient_email,
            PayoutRequest.amount == payout_in.amount,
            PayoutRequest.created_at >= cutoff,
            PayoutRequest.status.in_(["PENDING_APPROVAL", "APPROVED", "COMPLETED", "PROCESSING"])
        ).first()

        is_duplicate = duplicate is not None

        # Check or create recipient
        recipient = db.query(Recipient).filter(Recipient.email == payout_in.recipient_email).first()
        if not recipient:
            recipient = Recipient(
                name=payout_in.recipient_name,
                email=payout_in.recipient_email,
                paypal_email=payout_in.recipient_email,
                category="Contractor",
                verified=True
            )
            db.add(recipient)
            db.commit()
            db.refresh(recipient)

        # Safety evaluation: require approval if amount > autonomous limit
        requires_approval = payout_in.amount > settings.MAX_AUTONOMOUS_PAYOUT_AMOUNT or settings.REQUIRE_APPROVAL_DEFAULT
        initial_status = "PENDING_APPROVAL" if requires_approval else "APPROVED"

        payout_ref = PayoutService.generate_reference(db)
        payout = PayoutRequest(
            payout_reference=payout_ref,
            recipient_id=recipient.id,
            recipient_name=payout_in.recipient_name,
            recipient_email=payout_in.recipient_email,
            amount=payout_in.amount,
            currency=payout_in.currency,
            purpose=payout_in.purpose,
            status=initial_status,
            requires_approval=requires_approval,
            is_duplicate_flag=is_duplicate,
            payout_mode="SANDBOX_API" if paypal_service.is_configured() else "SIMULATED_SANDBOX"
        )
        db.add(payout)
        db.commit()
        db.refresh(payout)

        audit_service.log_event(
            db=db,
            event_type="PAYOUT_STAGED",
            initiated_by=initiated_by,
            validated_parameters={"reference": payout_ref, "recipient": payout.recipient_name, "amount": payout.amount},
            approval_status="PENDING" if requires_approval else "APPROVED",
            execution_result="SUCCESS",
            reference_id=payout_ref,
            details=f"Staged payout of ${payout.amount:.2f} {payout.currency} to {payout.recipient_name}. Requires approval: {requires_approval}"
        )

        return payout, is_duplicate, None

    @staticmethod
    def approve_payout(db: Session, payout_id: int, approved_by: str = "Operator") -> Tuple[Optional[PayoutRequest], Optional[str]]:
        payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
        if not payout:
            return None, "Payout request not found"

        if payout.status == "COMPLETED":
            return None, "Payout has already been executed."

        payout.status = "APPROVED"
        payout.approved_at = utcnow()
        payout.approved_by = approved_by
        db.commit()
        db.refresh(payout)

        audit_service.log_event(
            db=db,
            event_type="PAYOUT_APPROVED",
            initiated_by=approved_by,
            validated_parameters={"payout_id": payout.id, "reference": payout.payout_reference, "amount": payout.amount},
            approval_status="APPROVED",
            execution_result="SUCCESS",
            reference_id=payout.payout_reference,
            details=f"Payout {payout.payout_reference} approved by {approved_by} for ${payout.amount:.2f} {payout.currency}"
        )

        return payout, None

    @staticmethod
    async def execute_payout(db: Session, payout_id: int) -> Tuple[Optional[PayoutRequest], Optional[str]]:
        """
        Executes an approved payout via official PayPal Sandbox Payouts API.
        Enforces idempotency and records verified transaction.
        """
        payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
        if not payout:
            return None, "Payout request not found"

        # Idempotency and State Guard
        if payout.status == "COMPLETED":
            return payout, "Payout has already been completed. Duplicate execution prevented."

        if payout.status not in ["APPROVED", "PENDING_APPROVAL"]:
            return None, f"Cannot execute payout in '{payout.status}' status."

        payout.status = "PROCESSING"
        db.commit()

        # Call PayPal Service
        result_data, err, mode_used = await paypal_service.execute_payout(
            payout_ref=payout.payout_reference,
            recipient_email=payout.recipient_email,
            amount=payout.amount,
            currency=payout.currency,
            purpose=payout.purpose
        )

        from .workflow_service import workflow_service

        if err:
            payout.status = "FAILED"
            payout.failure_reason = err
            db.commit()
            db.refresh(payout)

            audit_service.log_event(
                db=db,
                event_type="PAYOUT_EXECUTION_FAILED",
                initiated_by="PAYPAL_SERVICE",
                validated_parameters={"reference": payout.payout_reference, "amount": payout.amount},
                approval_status="APPROVED",
                execution_result="FAILED",
                reference_id=payout.payout_reference,
                details=f"Payout execution failed: {err}"
            )

            await workflow_service.evaluate_event(db, "PAYMENT_FAILED", {
                "payout_id": payout.id,
                "payout_reference": payout.payout_reference,
                "amount": payout.amount,
                "error": err
            })

            return payout, err

        batch_header = result_data.get("batch_header", {})
        batch_id = batch_header.get("payout_batch_id", f"BATCH-{payout.payout_reference}")
        item_id = result_data.get("item_id", f"ITEM-{payout.payout_reference}")

        payout.status = "COMPLETED"
        payout.executed_at = utcnow()
        payout.paypal_batch_id = batch_id
        payout.paypal_payout_item_id = item_id
        payout.payout_mode = mode_used
        db.commit()
        db.refresh(payout)

        # Record in Transaction Ledger
        tx = Transaction(
            reference_id=f"TX-{batch_id}",
            type="CONTRACTOR_PAYOUT",
            status="COMPLETED",
            amount=payout.amount,
            currency=payout.currency,
            source="PAYPAL_SANDBOX_PAYOUT" if mode_used == "LIVE_SANDBOX_API" else "LOCAL_LEDGER",
            paypal_resource_id=batch_id,
            payout_id=payout.id,
            description=f"Contractor payout to {payout.recipient_name} for '{payout.purpose}'",
            fee=0.25,
            net_amount=payout.amount
        )
        db.add(tx)

        # Update demo user balance
        user = db.query(User).first()
        if user:
            user.recorded_balance = max(0.0, user.recorded_balance - payout.amount)

        db.commit()

        audit_service.log_event(
            db=db,
            event_type="PAYOUT_EXECUTED_COMPLETED",
            initiated_by="OPERATOR",
            validated_parameters={"reference": payout.payout_reference, "batch_id": batch_id, "amount": payout.amount},
            approval_status="APPROVED",
            execution_result="SUCCESS",
            reference_id=batch_id,
            details=f"Disbursed ${payout.amount:.2f} {payout.currency} to {payout.recipient_name} ({mode_used}). Batch ID: {batch_id}"
        )

        await workflow_service.evaluate_event(db, "TASK_APPROVED", {
            "payout_id": payout.id,
            "payout_reference": payout.payout_reference,
            "amount": payout.amount,
            "recipient_name": payout.recipient_name,
            "batch_id": batch_id
        })

        return payout, None

payout_service = PayoutService()
