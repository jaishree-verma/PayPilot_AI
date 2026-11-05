from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Recipient
from ..schemas import RecipientCreate, RecipientUpdate, RecipientResponse, StandardSuccessResponse
from ..services.audit_service import audit_service

router = APIRouter(prefix="/api/recipients", tags=["Recipients"])

@router.get("", response_model=List[RecipientResponse])
def get_recipients(db: Session = Depends(get_db)):
    return db.query(Recipient).order_by(Recipient.name.asc()).all()

@router.post("", response_model=RecipientResponse)
def create_recipient(rec_in: RecipientCreate, db: Session = Depends(get_db)):
    existing = db.query(Recipient).filter(Recipient.email == rec_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Recipient with this email already exists")

    recipient = Recipient(
        name=rec_in.name,
        email=rec_in.email,
        paypal_email=rec_in.paypal_email,
        category=rec_in.category or "Contractor",
        verified=rec_in.verified if rec_in.verified is not None else True,
        notes=rec_in.notes
    )
    db.add(recipient)
    db.commit()
    db.refresh(recipient)

    audit_service.log_event(
        db=db,
        event_type="RECIPIENT_CREATED",
        initiated_by="USER",
        validated_parameters={"name": recipient.name, "email": recipient.email, "category": recipient.category},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=f"REC-{recipient.id}",
        details=f"Added verified recipient {recipient.name} ({recipient.category})"
    )

    return recipient

@router.get("/{recipient_id}", response_model=RecipientResponse)
def get_recipient(recipient_id: int, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient

@router.put("/{recipient_id}", response_model=RecipientResponse)
def update_recipient(recipient_id: int, rec_update: RecipientUpdate, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    update_dict = rec_update.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        if val is not None:
            setattr(recipient, key, val)

    db.commit()
    db.refresh(recipient)

    audit_service.log_event(
        db=db,
        event_type="RECIPIENT_UPDATED",
        initiated_by="USER",
        validated_parameters=update_dict,
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=f"REC-{recipient.id}",
        details=f"Updated details for recipient {recipient.name}"
    )

    return recipient

@router.delete("/{recipient_id}", response_model=StandardSuccessResponse)
def delete_recipient(recipient_id: int, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Check if recipient has linked active records
    if recipient.invoices and any(i.status in ["SENT", "PAID"] for i in recipient.invoices):
        raise HTTPException(status_code=400, detail="Cannot delete recipient with existing invoices.")
    if recipient.payouts and any(p.status in ["COMPLETED", "APPROVED"] for p in recipient.payouts):
        raise HTTPException(status_code=400, detail="Cannot delete recipient with active or completed payouts.")

    name = recipient.name
    db.delete(recipient)
    db.commit()

    return StandardSuccessResponse(
        success=True,
        message=f"Recipient {name} has been removed."
    )
