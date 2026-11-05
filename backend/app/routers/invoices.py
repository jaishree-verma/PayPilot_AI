from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice, User, Transaction
from ..schemas import InvoiceCreate, InvoiceResponse, InvoiceUpdate, StandardSuccessResponse
from ..services.invoice_service import invoice_service
from ..services.audit_service import audit_service

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Invoice)
    if status and status.upper() != "ALL":
        query = query.filter(Invoice.status == status.upper())
    return query.order_by(Invoice.created_at.desc()).all()

@router.post("", response_model=InvoiceResponse)
def create_invoice(invoice_in: InvoiceCreate, db: Session = Depends(get_db)):
    invoice, is_dup = invoice_service.create_invoice(db, invoice_in, initiated_by="USER_DASHBOARD")
    return invoice

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, inv_update: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "PAID" and inv_update.status and inv_update.status != "PAID":
        raise HTTPException(status_code=400, detail="Cannot change status of an already paid invoice")

    if inv_update.description is not None:
        invoice.description = inv_update.description
    if inv_update.due_date is not None:
        invoice.due_date = inv_update.due_date
    if inv_update.status is not None:
        invoice.status = inv_update.status.upper()

    db.commit()
    db.refresh(invoice)

    audit_service.log_event(
        db=db,
        event_type="INVOICE_UPDATED",
        initiated_by="USER",
        validated_parameters={"invoice_id": invoice.id, "status": invoice.status},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=invoice.invoice_number,
        details=f"Updated invoice {invoice.invoice_number} details"
    )
    return invoice

@router.delete("/{invoice_id}", response_model=StandardSuccessResponse)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Cannot delete an invoice with status PAID. Reconciled records cannot be destroyed.")

    inv_num = invoice.invoice_number
    db.delete(invoice)
    db.commit()

    audit_service.log_event(
        db=db,
        event_type="INVOICE_DELETED",
        initiated_by="USER",
        validated_parameters={"invoice_number": inv_num},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=inv_num,
        details=f"Deleted unpaid invoice {inv_num}"
    )

    return StandardSuccessResponse(
        success=True,
        message=f"Invoice {inv_num} was successfully removed."
    )

@router.get("/{invoice_id}/receipt")
def get_invoice_receipt(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    user = db.query(User).first()
    tx = db.query(Transaction).filter(Transaction.invoice_id == invoice.id).first()

    return {
        "invoice_number": invoice.invoice_number,
        "status": invoice.status,
        "amount": invoice.amount,
        "currency": invoice.currency,
        "description": invoice.description,
        "created_at": invoice.created_at,
        "due_date": invoice.due_date,
        "paid_at": invoice.paid_at,
        "merchant": {
            "name": user.name if user else "PayPilot Merchant",
            "business_name": user.business_name if user else "Acme Studio",
            "email": user.email if user else "billing@paypilot.io"
        },
        "customer": {
            "name": invoice.recipient_name,
            "email": invoice.recipient_email
        },
        "payment_details": {
            "paypal_order_id": invoice.paypal_order_id,
            "paypal_capture_id": invoice.paypal_capture_id,
            "transaction_reference": tx.reference_id if tx else None,
            "fee": tx.fee if tx else 0.0,
            "net_amount": tx.net_amount if tx else invoice.amount,
            "source": tx.source if tx else "PENDING_CHECKOUT"
        }
    }

@router.post("/{invoice_id}/checkout")
async def create_checkout_order(invoice_id: int, db: Session = Depends(get_db)):
    """Creates a PayPal Sandbox Order for the invoice"""
    order_data, err = await invoice_service.create_paypal_checkout(db, invoice_id)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return order_data

@router.post("/{invoice_id}/capture")
async def capture_invoice_payment(invoice_id: int, order_id: str = Query(...), db: Session = Depends(get_db)):
    """Captures PayPal Sandbox Order and reconciles the invoice"""
    invoice, err = await invoice_service.reconcile_paypal_capture(db, invoice_id, order_id)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return {"status": "SUCCESS", "invoice": InvoiceResponse.model_validate(invoice)}
