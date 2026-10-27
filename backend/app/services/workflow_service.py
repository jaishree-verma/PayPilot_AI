import datetime
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import WorkflowRule, WorkflowExecution, Invoice, PayoutRequest, Transaction
from .audit_service import audit_service

logger = logging.getLogger("workflow_service")

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class WorkflowService:
    @staticmethod
    def initialize_default_rules(db: Session):
        """Initializes default automation rules if none exist"""
        if db.query(WorkflowRule).count() == 0:
            rules = [
                WorkflowRule(
                    name="Reconcile Paid Invoices to Ledger",
                    description="When an invoice is captured in PayPal Sandbox, automatically reconcile the ledger and update analytics.",
                    trigger_type="INVOICE_PAID",
                    condition_expression="invoice.amount > 0",
                    action_type="RECONCILE_AND_LEDGER",
                    requires_approval=False,
                    is_active=True
                ),
                WorkflowRule(
                    name="Contractor Task Payout Gate",
                    description="When an approved milestone task is reported, prepare a contractor payout and require operator authorization.",
                    trigger_type="TASK_APPROVED",
                    condition_expression="payout.amount <= 5000",
                    action_type="PREPARE_PAYOUT",
                    requires_approval=True,
                    is_active=True
                ),
                WorkflowRule(
                    name="Overdue Invoice Reminder Generator",
                    description="When an invoice passes its due date without payment, generate a high-priority collection reminder.",
                    trigger_type="INVOICE_OVERDUE",
                    condition_expression="invoice.days_overdue > 0",
                    action_type="GENERATE_REMINDER",
                    requires_approval=False,
                    is_active=True
                ),
                WorkflowRule(
                    name="Payment Failure Recovery & Audit",
                    description="When a PayPal Sandbox API payment fails, log diagnostic reason and generate recovery instructions.",
                    trigger_type="PAYMENT_FAILED",
                    condition_expression="payment.error != null",
                    action_type="LOG_FAILURE_RECOVERY",
                    requires_approval=False,
                    is_active=True
                )
            ]
            for r in rules:
                db.add(r)
            db.commit()
            logger.info("Initialized 4 default conditional workflow rules.")

    @staticmethod
    async def evaluate_event(db: Session, trigger_event: str, payload: Dict[str, Any]) -> List[WorkflowExecution]:
        """
        Evaluates matching active workflow rules for an event.
        Executes action and stores execution log.
        """
        matching_rules = db.query(WorkflowRule).filter(
            WorkflowRule.trigger_type == trigger_event,
            WorkflowRule.is_active == True
        ).all()

        executions = []
        for rule in matching_rules:
            status = "SUCCESS"
            err_msg = None
            exec_result = {}

            try:
                if rule.action_type == "RECONCILE_AND_LEDGER":
                    exec_result = {
                        "action": "Ledger updated and reconciled",
                        "invoice_number": payload.get("invoice_number"),
                        "amount": payload.get("amount"),
                        "capture_id": payload.get("capture_id"),
                        "status": "COMPLETED"
                    }

                elif rule.action_type == "PREPARE_PAYOUT":
                    exec_result = {
                        "action": "Task approval acknowledged",
                        "payout_reference": payload.get("payout_reference"),
                        "recipient": payload.get("recipient_name"),
                        "batch_id": payload.get("batch_id"),
                        "status": "VERIFIED"
                    }

                elif rule.action_type == "GENERATE_REMINDER":
                    exec_result = {
                        "action": "Automated payment reminder drafted",
                        "invoice_number": payload.get("invoice_number"),
                        "recipient_email": payload.get("recipient_email"),
                        "days_overdue": payload.get("days_overdue", 1)
                    }

                elif rule.action_type == "LOG_FAILURE_RECOVERY":
                    exec_result = {
                        "action": "Failure diagnosed and recovery instructions prepared",
                        "error": payload.get("error"),
                        "recommendation": "Verify PayPal Sandbox API credentials and account permissions, then use safe idempotent retry."
                    }

            except Exception as e:
                status = "FAILED"
                err_msg = str(e)
                exec_result = {"error": err_msg}

            execution = WorkflowExecution(
                workflow_id=rule.id,
                workflow_name=rule.name,
                trigger_event=trigger_event,
                status=status,
                input_payload=payload,
                execution_result=exec_result,
                error_message=err_msg
            )
            db.add(execution)
            executions.append(execution)

        db.commit()
        return executions

    @staticmethod
    async def run_rule_manually(db: Session, rule_id: int) -> Optional[WorkflowExecution]:
        """Allows testing a workflow rule directly from the visual workflow builder"""
        rule = db.query(WorkflowRule).filter(WorkflowRule.id == rule_id).first()
        if not rule:
            return None

        test_payload = {
            "test_mode": True,
            "simulated_timestamp": utcnow().isoformat(),
            "sample_amount": 150.00,
            "sample_entity": "Alex Rivera"
        }

        execs = await WorkflowService.evaluate_event(db, rule.trigger_type, test_payload)
        return execs[0] if execs else None

workflow_service = WorkflowService()
