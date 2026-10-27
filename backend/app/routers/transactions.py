from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction
from ..schemas import TransactionResponse, FinancialStats
from ..services.transaction_service import transaction_service

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if type:
        query = query.filter(Transaction.type == type)
    if status:
        query = query.filter(Transaction.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Transaction.description.ilike(search_pattern)) |
            (Transaction.reference_id.ilike(search_pattern)) |
            (Transaction.paypal_resource_id.ilike(search_pattern))
        )
    return query.order_by(Transaction.created_at.desc()).all()

@router.get("/stats", response_model=FinancialStats)
def get_stats(db: Session = Depends(get_db)):
    return transaction_service.get_financial_stats(db)

@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
