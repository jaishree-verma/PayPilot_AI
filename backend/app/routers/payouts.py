from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PayoutRequest
from ..schemas import PayoutCreate, PayoutResponse, PayoutApprove
from ..services.payout_service import payout_service

router = APIRouter(prefix="/api/payouts", tags=["Payouts"])

@router.get("", response_model=List[PayoutResponse])
def get_payouts(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(PayoutRequest)
    if status:
        query = query.filter(PayoutRequest.status == status)
    return query.order_by(PayoutRequest.created_at.desc()).all()

@router.post("", response_model=PayoutResponse)
def create_payout(payout_in: PayoutCreate, db: Session = Depends(get_db)):
    payout, is_dup, err = payout_service.create_payout_request(db, payout_in, initiated_by="USER_DASHBOARD")
    if err:
        raise HTTPException(status_code=400, detail=err)
    return payout

@router.get("/{payout_id}", response_model=PayoutResponse)
def get_payout(payout_id: int, db: Session = Depends(get_db)):
    payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    return payout

@router.post("/{payout_id}/approve", response_model=PayoutResponse)
def approve_payout(payout_id: int, approve_in: PayoutApprove = None, db: Session = Depends(get_db)):
    approver = approve_in.approved_by if approve_in else "Operator"
    payout, err = payout_service.approve_payout(db, payout_id, approved_by=approver)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return payout

@router.post("/{payout_id}/execute", response_model=PayoutResponse)
async def execute_payout(payout_id: int, db: Session = Depends(get_db)):
    payout, err = await payout_service.execute_payout(db, payout_id)
    if err and not payout:
        raise HTTPException(status_code=400, detail=err)
    return payout
