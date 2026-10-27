import datetime
import random
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Invoice, Recipient, Transaction
from ..schemas import InvoiceCreate
from .paypal_service import paypal_service
from .audit_service import audit_service

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class InvoiceService:
    @staticmethod
    def generate_invoice_number(db: Session) -> str:
        count = db.query(Invoice).count() + 1
        return f"INV-2026-{count:04d}"

    @staticmethod
    def create_invoice(db: Session, invoice_in: InvoiceCreate, initiated_by: str = "USER") -> Tuple[Invoice, bool]:
        """
        Creates an invoice.
        Returns (invoice, is_duplicate).
        """
        # Duplicate detection check: same recipient email, amount, within 24h
        cutoff = utcnow() - datetime.timedelta(hours=24)
        duplicate = db.query(Invoice).filter(
            Invoice.recipient_email == invoice_in.recipient_email,
            Invoice.amount == invoice_in.amount,
            Invoice.created_at >= cutoff
        ).first()

        is_duplicate = duplicate is not None

        # Check if recipient exists, or create contact
        recipient = db.query(Recipient).filter(Recipient.email == invoice_in.recipient_email).first()
        if not recipient:
            recipient = Recipient(
                name=invoice_in.recipient_name,
                email=invoice_in.recipient_email,
                paypal_email=invoice_in.recipient_email,
                category="Client",
                verified=True
            )
            db.add(recipient)
            db.commit()
            db.refresh(recipient)

        inv_num = InvoiceService.generate_invoice_number(db)
        due = invoice_in.due_date or (utcnow() + datetime.timedelta(days=14))

        invoice = Invoice(
            invoice_number=inv_num,
            recipient_id=recipient.id,
            recipient_name=invoice_in.recipient_name,
            recipient_email=invoice_in.recipient_email,
            amount=invoice_in.amount,
            currency=invoice_in.currency,
            description=invoice_in.description,
            status="SENT",
            due_date=due
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        audit_service.log_event(
            db=db,
            event_type="INVOICE_CREATED",
            initiated_by=initiated_by,
            validated_parameters={"invoice_number": inv_num, "amount": invoice.amount, "recipient": invoice.recipient_name},
            approval_status="APPROVED",
            execution_result="SUCCESS",
            reference_id=inv_num,
            details=f"Created invoice for {invoice.recipient_name} (${invoice.amount:.2f} {invoice.currency}). Duplicate flag: {is_duplicate}"
        )

        return invoice, is_duplicate

    @staticmethod
    async def create_paypal_checkout(db: Session, invoice_id: int) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return None, "Invoice not found"

        order_data, err = await paypal_service.create_order(
            invoice_number=invoice.invoice_number,
            amount=invoice.amount,
            currency=invoice.currency,
            description=invoice.description
        )
        if err:
            return None, err

        invoice.paypal_order_id = order_data.get("id")
        invoice.is_paypal_synced = True
        db.commit()
        db.refresh(invoice)

        audit_service.log_event(
            db=db,
            event_type="PAYPAL_ORDER_CREATED",
            initiated_by="SYSTEM",
            validated_parameters={"invoice_number": invoice.invoice_number, "order_id": invoice.paypal_order_id},
            approval_status="APPROVED",
            execution_result="SUCCESS",
            reference_id=invoice.paypal_order_id,
            details=f"Created PayPal Sandbox Order {invoice.paypal_order_id} for invoice {invoice.invoice_number}"
        )

        return order_data, None

    @staticmethod
    async def reconcile_paypal_capture(db: Session, invoice_id: int, order_id: str) -> Tuple[Optional[Invoice], Optional[str]]:
        """
        Captures the PayPal order, marks invoice as PAID, records transaction, and notifies workflows.
        """
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return None, "Invoice not found"

        capture_data, err = await paypal_service.capture_order(order_id)
        if err:
            audit_service.log_event(
                db=db,
                event_type="PAYPAL_CAPTURE_FAILED",
                initiated_by="USER_CHECKOUT",
                validated_parameters={"invoice_id": invoice_id, "order_id": order_id},
                execution_result="FAILED",
                reference_id=order_id,
                details=f"PayPal order capture failed: {err}"
            )
            return None, err

        # Extract capture details
        purchase_unit = capture_data.get("purchase_units", [{}])[0]
        capture_list = purchase_unit.get("payments", {}).get("captures", [{}])
        first_capture = capture_list[0] if capture_list else {}
        capture_id = first_capture.get("id", f"CAP-{order_id}")
        
        # Breakdown fees if provided by PayPal
        seller_breakdown = first_capture.get("seller_receivable_breakdown", {})
        fee_val = float(seller_breakdown.get("paypal_fee", {}).get("value", "0.0"))
        net_val = float(seller_breakdown.get("net_amount", {}).get("value", str(invoice.amount - fee_val)))

        invoice.status = "PAID"
        invoice.paid_at = utcnow()
        invoice.paypal_capture_id = capture_id
        db.commit()
        db.refresh(invoice)

        # Record verified transaction
        tx = Transaction(
            reference_id=f"TX-{capture_id}",
            type="INCOMING_PAYMENT",
            status="COMPLETED",
            amount=invoice.amount,
            currency=invoice.currency,
            source="PAYPAL_SANDBOX_ORDER",
            paypal_resource_id=capture_id,
            invoice_id=invoice.id,
            description=f"Payment for invoice {invoice.invoice_number} ({invoice.description})",
            fee=fee_val,
            net_amount=net_val
        )
        db.add(tx)
        db.commit()

        audit_service.log_event(
            db=db,
            event_type="PAYMENT_CAPTURED_RECONCILED",
            initiated_by="PAYPAL_SANDBOX",
            validated_parameters={"invoice_number": invoice.invoice_number, "capture_id": capture_id, "amount": invoice.amount},
            approval_status="APPROVED",
            execution_result="SUCCESS",
            reference_id=capture_id,
            details=f"Reconciled payment of ${invoice.amount:.2f} {invoice.currency} via PayPal Sandbox Order {order_id}"
        )

        # Trigger workflow evaluation
        from .workflow_service import workflow_service
        await workflow_service.evaluate_event(db, "INVOICE_PAID", {
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "amount": invoice.amount,
            "recipient_name": invoice.recipient_name,
            "capture_id": capture_id
        })

        return invoice, None

invoice_service = InvoiceService()
