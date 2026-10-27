from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..config import settings
from ..services.paypal_service import paypal_service

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
