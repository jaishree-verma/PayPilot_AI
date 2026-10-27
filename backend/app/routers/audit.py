from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditEvent
from ..schemas import AuditEventResponse

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_logs(
    event_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if event_type:
        query = query.filter(AuditEvent.event_type == event_type)
    return query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
