import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "PayPilot AI"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./paypilot.db"
    
    # PayPal Sandbox Settings
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"  # sandbox or live
    PAYPAL_API_BASE: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_WEBHOOK_ID: Optional[str] = None
    
    # AI Provider Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Business Rules & Safety Limits
    MAX_AUTONOMOUS_PAYOUT_AMOUNT: float = 100.00  # Payouts over this amount strictly require human confirmation
    MAX_SINGLE_TRANSACTION_LIMIT: float = 5000.00
    REQUIRE_APPROVAL_DEFAULT: bool = True
    
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
