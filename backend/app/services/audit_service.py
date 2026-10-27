import logging
from sqlalchemy.orm import Session
from ..models import AuditEvent

logger = logging.getLogger("audit_service")

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        event_type: str,
        initiated_by: str = "AI_AGENT",
        validated_parameters: dict = None,
        approval_status: str = "NOT_REQUIRED",
        execution_result: str = "SUCCESS",
        reference_id: str = None,
        details: str = None
    ) -> AuditEvent:
        event = AuditEvent(
            event_type=event_type,
            initiated_by=initiated_by,
            validated_parameters=validated_parameters or {},
            approval_status=approval_status,
            execution_result=execution_result,
            reference_id=reference_id,
            details=details
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        logger.info(f"AUDIT LOG: [{event_type}] by {initiated_by} => {execution_result} (ref: {reference_id})")
        return event

    @staticmethod
    def get_recent_logs(db: Session, limit: int = 50):
        return db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()

audit_service = AuditService()
