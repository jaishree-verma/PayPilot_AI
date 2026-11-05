import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
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
    seed,
    user
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
    description="PayPilot AI - AI-Powered Autonomous Payment Platform with Official PayPal Sandbox Integration",
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

# Request ID & Performance Timing Middleware
@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Request-ID"] = request_id
    return response

# Global Exception Handlers (Standard Error Envelope)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail
            },
            "detail": exc.detail
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg") if errors else "Validation failed"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
                "details": errors
            },
            "detail": errors
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Uncaught error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.APP_ENV == "development" else "Internal server error"
            },
            "detail": str(exc)
        }
    )

# Include API Routers
app.include_router(user.router)
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
