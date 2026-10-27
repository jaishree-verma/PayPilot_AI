from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Recipient
from ..schemas import RecipientCreate, RecipientResponse

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
    return recipient
