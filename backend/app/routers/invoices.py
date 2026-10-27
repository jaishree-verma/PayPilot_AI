from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice
from ..schemas import InvoiceCreate, InvoiceResponse, InvoiceUpdate
from ..services.invoice_service import invoice_service

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
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
