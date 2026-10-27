import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models import User
from .services.workflow_service import workflow_service
from .routers import (
    ai,
    invoices,
    payouts,
    workflows,
    transactions,
    paypal,
    recipients,
    audit,
    seed
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("paypilot_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default workflow rules & user
    logger.info("Initializing PayPilot AI database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            demo_user = User(
                name="Alex Mercer",
                business_name="Mercer Tech Labs",
                email="alex@mercertech.io",
                currency="USD",
                recorded_balance=14500.00,
                sandbox_mode=True
            )
            db.add(demo_user)
            db.commit()

        workflow_service.initialize_default_rules(db)
        logger.info("Default database entities and workflow rules ready.")
    finally:
        db.close()

    yield
    logger.info("Shutting down PayPilot AI backend.")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="PayPilot AI — AI-Powered Autonomous Payment Platform with Official PayPal Sandbox Integration",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(ai.router)
app.include_router(invoices.router)
app.include_router(payouts.router)
app.include_router(workflows.router)
app.include_router(transactions.router)
app.include_router(paypal.router)
app.include_router(recipients.router)
app.include_router(audit.router)
app.include_router(seed.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
        "paypal_configured": bool(settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_SECRET),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }
