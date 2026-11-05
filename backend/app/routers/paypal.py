from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import Invoice, PayoutRequest
from ..services.paypal_service import paypal_service
from ..services.audit_service import audit_service
from ..services.workflow_service import workflow_service
from ..schemas import PayPalWebhookEvent, StandardSuccessResponse

router = APIRouter(prefix="/api/paypal", tags=["PayPal"])

class ConfigUpdate(BaseModel):
    client_id: str
    client_secret: str
    gemini_api_key: Optional[str] = None

@router.get("/config")
async def get_paypal_config():
    is_conf = paypal_service.is_configured()
    client_preview = f"{settings.PAYPAL_CLIENT_ID[:6]}...{settings.PAYPAL_CLIENT_ID[-4:]}" if is_conf else None
    
    # Check connection
    conn_info = await paypal_service.test_connection()
    return {
        "client_id_configured": is_conf,
        "client_id_preview": client_preview,
        "mode": settings.PAYPAL_MODE,
        "api_base": settings.PAYPAL_API_BASE,
        "is_connected": conn_info.get("connected", False),
        "status_message": conn_info.get("message", ""),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

@router.post("/test-connection")
async def test_connection():
    return await paypal_service.test_connection()

@router.post("/update-config")
async def update_paypal_config(config: ConfigUpdate):
    """Allows updating sandbox credentials live from the settings modal"""
    settings.PAYPAL_CLIENT_ID = config.client_id.strip()
    settings.PAYPAL_CLIENT_SECRET = config.client_secret.strip()
    paypal_service.client_id = settings.PAYPAL_CLIENT_ID
    paypal_service.client_secret = settings.PAYPAL_CLIENT_SECRET
    paypal_service._access_token = None
    paypal_service._token_expires_at = 0

    if config.gemini_api_key is not None:
        settings.GEMINI_API_KEY = config.gemini_api_key.strip()
        from ..services.ai_service import ai_service
        ai_service.api_key = settings.GEMINI_API_KEY

    conn = await paypal_service.test_connection()
    return {
        "success": conn.get("connected", False),
        "message": conn.get("message", ""),
        "client_id_configured": paypal_service.is_configured()
    }

@router.post("/webhook", response_model=StandardSuccessResponse)
async def handle_paypal_webhook(event: PayPalWebhookEvent, db: Session = Depends(get_db)):
    """
    Receives and processes official PayPal Sandbox webhook notifications or simulated events.
    """
    event_type = event.event_type
    resource = event.resource

    audit_service.log_event(
        db=db,
        event_type=f"PAYPAL_WEBHOOK_{event_type.replace('.', '_')}",
        initiated_by="PAYPAL_WEBHOOK",
        validated_parameters={"event_id": event.id, "summary": event.summary},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=event.id or "WH-EVENT",
        details=f"Received PayPal Webhook event: {event_type} - {event.summary or 'Event processed'}"
    )

    if event_type == "CHECKOUT.ORDER.APPROVED":
        order_id = resource.get("id")
        inv = db.query(Invoice).filter(Invoice.paypal_order_id == order_id).first()
        if inv and inv.status != "PAID":
            from ..services.invoice_service import invoice_service
            await invoice_service.reconcile_paypal_capture(db, inv.id, order_id)

    elif event_type == "PAYMENT.PAYOUTSBATCH.SUCCESS":
        batch_id = resource.get("batch_header", {}).get("payout_batch_id")
        if batch_id:
            payout = db.query(PayoutRequest).filter(PayoutRequest.paypal_batch_id == batch_id).first()
            if payout and payout.status != "COMPLETED":
                payout.status = "COMPLETED"
                db.commit()

    return StandardSuccessResponse(
        success=True,
        message=f"Webhook event {event_type} handled successfully."
    )
