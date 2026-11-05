from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PayoutRequest
from ..schemas import PayoutCreate, PayoutResponse, PayoutApprove, PayoutUpdate, StandardSuccessResponse
from ..services.payout_service import payout_service
from ..services.audit_service import audit_service

router = APIRouter(prefix="/api/payouts", tags=["Payouts"])

@router.get("", response_model=List[PayoutResponse])
def get_payouts(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(PayoutRequest)
    if status and status.upper() != "ALL":
        query = query.filter(PayoutRequest.status == status.upper())
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

@router.patch("/{payout_id}", response_model=PayoutResponse)
def update_payout(payout_id: int, payout_update: PayoutUpdate, db: Session = Depends(get_db)):
    payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")

    if payout.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot edit an already completed payout.")

    if payout_update.purpose is not None:
        payout.purpose = payout_update.purpose

    db.commit()
    db.refresh(payout)
    return payout

@router.post("/{payout_id}/approve", response_model=PayoutResponse)
def approve_payout(payout_id: int, approve_in: PayoutApprove = None, db: Session = Depends(get_db)):
    approver = approve_in.approved_by if approve_in and approve_in.approved_by else "Operator"
    payout, err = payout_service.approve_payout(db, payout_id, approved_by=approver)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return payout

@router.post("/{payout_id}/reject", response_model=PayoutResponse)
def reject_payout(payout_id: int, db: Session = Depends(get_db)):
    payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")

    if payout.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot reject an already completed payout.")

    payout.status = "REJECTED"
    db.commit()
    db.refresh(payout)

    audit_service.log_event(
        db=db,
        event_type="PAYOUT_REJECTED",
        initiated_by="OPERATOR",
        validated_parameters={"payout_id": payout.id, "reference": payout.payout_reference},
        approval_status="REJECTED",
        execution_result="BLOCKED",
        reference_id=payout.payout_reference,
        details=f"Operator rejected payout request {payout.payout_reference} (${payout.amount:.2f})"
    )

    return payout

@router.delete("/{payout_id}", response_model=StandardSuccessResponse)
def delete_payout(payout_id: int, db: Session = Depends(get_db)):
    payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")

    if payout.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot delete a completed payout record.")

    ref = payout.payout_reference
    db.delete(payout)
    db.commit()

    audit_service.log_event(
        db=db,
        event_type="PAYOUT_DELETED",
        initiated_by="OPERATOR",
        validated_parameters={"reference": ref},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=ref,
        details=f"Removed payout request {ref}"
    )

    return StandardSuccessResponse(
        success=True,
        message=f"Payout request {ref} has been removed."
    )

@router.post("/{payout_id}/execute", response_model=PayoutResponse)
async def execute_payout(payout_id: int, db: Session = Depends(get_db)):
    payout, err = await payout_service.execute_payout(db, payout_id)
    if err and not payout:
        raise HTTPException(status_code=400, detail=err)
    return payout
