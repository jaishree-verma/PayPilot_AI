from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserProfileResponse, UserProfileUpdate
from ..services.audit_service import audit_service

router = APIRouter(prefix="/api/user", tags=["User Profile"])

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(
            name="Alex Mercer",
            business_name="Mercer Tech Labs",
            email="alex@mercertech.io",
            currency="USD",
            recorded_balance=14500.00,
            sandbox_mode=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(profile_in: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(user, field, val)

    db.commit()
    db.refresh(user)

    audit_service.log_event(
        db=db,
        event_type="USER_PROFILE_UPDATED",
        initiated_by="OPERATOR",
        validated_parameters=update_data,
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=f"USER-{user.id}",
        details=f"User updated profile details for business '{user.business_name}'"
    )

    return user

