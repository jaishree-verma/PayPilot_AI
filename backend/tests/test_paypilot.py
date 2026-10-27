import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, Invoice, PayoutRequest, Transaction, WorkflowRule, AuditEvent
from app.schemas import InvoiceCreate, PayoutCreate
from app.services.ai_service import ai_service
from app.services.invoice_service import invoice_service
from app.services.payout_service import payout_service
from app.services.workflow_service import workflow_service

# Test Database setup in-memory
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    workflow_service.initialize_default_rules(db)
    yield db
    db.close()
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_negative_invoice_amount_blocked():
    """Negative and zero invoice amounts must be rejected by Pydantic schema validation"""
    payload = {
        "recipient_name": "Test Client",
        "recipient_email": "client@test.com",
        "amount": -50.0,
        "currency": "USD",
        "description": "Invalid negative invoice"
    }
    response = client.post("/api/invoices", json=payload)
    assert response.status_code == 422

def test_invalid_currency_code_blocked():
    """Currency codes must strictly follow 3-letter uppercase pattern"""
    payload = {
        "recipient_name": "Test Client",
        "recipient_email": "client@test.com",
        "amount": 100.0,
        "currency": "INVALID_CURRENCY",
        "description": "Bad currency"
    }
    response = client.post("/api/invoices", json=payload)
    assert response.status_code == 422

def test_invoice_creation_and_audit():
    """Verify invoice creation persists record and creates audit event"""
    payload = {
        "recipient_name": "Alex Mercer",
        "recipient_email": "alex@mercer.com",
        "amount": 250.00,
        "currency": "USD",
        "description": "Website development milestone"
    }
    res = client.post("/api/invoices", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["amount"] == 250.00
    assert data["status"] == "SENT"
    assert "INV-2026-" in data["invoice_number"]

    # Verify audit log
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert any(log["event_type"] == "INVOICE_CREATED" for log in logs)

def test_duplicate_payout_detection():
    """Duplicate payout requests for same recipient and amount should be flagged or blocked"""
    db = TestingSessionLocal()
    payout_in = PayoutCreate(
        recipient_name="Elena Rostova",
        recipient_email="elena@quantum.io",
        amount=120.00,
        currency="USD",
        purpose="Backend task"
    )
    p1, is_dup1, err1 = payout_service.create_payout_request(db, payout_in)
    assert err1 is None
    assert is_dup1 is False

    # Second identical payout request
    p2, is_dup2, err2 = payout_service.create_payout_request(db, payout_in)
    assert is_dup2 is True
    assert p2.is_duplicate_flag is True
    db.close()

def test_payout_approval_threshold_gate():
    """Payouts exceeding $100 require human authorization"""
    db = TestingSessionLocal()
    # Below autonomous limit: $50
    small_payout = PayoutCreate(
        recipient_name="Contractor A",
        recipient_email="contractorA@test.com",
        amount=50.00,
        currency="USD",
        purpose="Small task"
    )
    # Above autonomous limit: $250
    large_payout = PayoutCreate(
        recipient_name="Contractor B",
        recipient_email="contractorB@test.com",
        amount=250.00,
        currency="USD",
        purpose="Major milestone"
    )

    p_large, _, _ = payout_service.create_payout_request(db, large_payout)
    assert p_large.requires_approval is True
    assert p_large.status == "PENDING_APPROVAL"
    db.close()

@pytest.mark.asyncio
async def test_ai_agent_deterministic_fallback():
    """AI agent accurately parses intent and extracts entities even when Gemini key is absent"""
    db = TestingSessionLocal()
    prompt = "Create a $250 invoice for Alex for website development"
    res = await ai_service.process_user_message(prompt, db)
    
    assert res["action_plan"] is not None
    plan = res["action_plan"]
    assert plan["intent"] == "CREATE_INVOICE"
    assert plan["entities"]["amount"] == 250.00
    assert plan["entities"]["recipient_name"] == "Alex"
    assert plan["is_allowed"] is True
    db.close()

@pytest.mark.asyncio
async def test_ai_copilot_grounded_overdue_query():
    """Copilot answers overdue query using real database facts, not hallucinations"""
    db = TestingSessionLocal()
    # Seed 1 overdue invoice
    import datetime
    inv = Invoice(
        invoice_number="INV-2026-TEST",
        recipient_name="Late Client",
        recipient_email="late@client.com",
        amount=450.00,
        currency="USD",
        description="Overdue invoice test",
        status="OVERDUE",
        due_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=5)
    )
    db.add(inv)
    db.commit()

    res = await ai_service.process_user_message("Show overdue invoices", db)
    assert res["action_plan"] is None  # Read-only query
    assert "450.00" in res["message"]
    assert "INV-2026-TEST" in res["message"]
    db.close()

@pytest.mark.asyncio
async def test_workflow_execution_and_logging():
    """Workflow rule should execute and log success when triggered"""
    db = TestingSessionLocal()
    execs = await workflow_service.evaluate_event(db, "INVOICE_PAID", {
        "invoice_number": "INV-2026-TEST",
        "amount": 250.00,
        "recipient_name": "Test Client",
        "capture_id": "CAP-TEST-123"
    })
    assert len(execs) > 0
    assert execs[0].status == "SUCCESS"
    assert execs[0].execution_result["capture_id"] == "CAP-TEST-123"
    db.close()
