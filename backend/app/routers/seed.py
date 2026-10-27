import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Recipient, Invoice, PayoutRequest, Transaction, WorkflowRule, WorkflowExecution, AuditEvent, AIActionPlan
from ..services.workflow_service import workflow_service
from ..services.audit_service import audit_service

router = APIRouter(prefix="/api/seed", tags=["Seed & Demo"])

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

@router.post("")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seeds realistic demonstration data for hackathon judges"""
    # 1. User Profile
    user = db.query(User).first()
    if not user:
        user = User(
            name="Alex Mercer",
            business_name="Mercer Tech Labs",
            email="alex@mercertech.io",
            currency="USD",
            recorded_balance=12450.00,
            sandbox_mode=True
        )
        db.add(user)

    # 2. Workflow Rules
    workflow_service.initialize_default_rules(db)

    # 3. Recipients
    recipients_data = [
        {"name": "Alex Rivera", "email": "alex.rivera@designflow.co", "paypal_email": "alex.rivera-contractor@gmail.com", "category": "Contractor", "verified": True, "notes": "Senior UI/UX Designer"},
        {"name": "Elena Rostova", "email": "elena@quantumdev.tech", "paypal_email": "elena.rostova-vendor@gmail.com", "category": "Contractor", "verified": True, "notes": "Fullstack Cloud Engineer"},
        {"name": "Marcus Vance", "email": "marcus@vancecapital.org", "paypal_email": "marcus.vance-buyer@gmail.com", "category": "Client", "verified": True, "notes": "Corporate Retainer Client"},
        {"name": "Sarah Chen", "email": "sarah@apexstudios.com", "paypal_email": "sarah.chen-buyer@gmail.com", "category": "Client", "verified": True, "notes": "E-Commerce Re-platforming"},
    ]

    recipient_objs = {}
    for r_data in recipients_data:
        r = db.query(Recipient).filter(Recipient.email == r_data["email"]).first()
        if not r:
            r = Recipient(**r_data)
            db.add(r)
            db.commit()
            db.refresh(r)
        recipient_objs[r.name] = r

    # 4. Invoices
    today = utcnow()
    if db.query(Invoice).count() == 0:
        invoices = [
            Invoice(
                invoice_number="INV-2026-0001",
                recipient_id=recipient_objs["Marcus Vance"].id,
                recipient_name="Marcus Vance",
                recipient_email="marcus@vancecapital.org",
                amount=2400.00,
                currency="USD",
                description="Enterprise Architecture Consulting & Payment Engine Milestone",
                status="PAID",
                due_date=today - datetime.timedelta(days=10),
                paypal_order_id="SANDBOX-ORD-98214",
                paypal_capture_id="CAP-98214-REC",
                is_paypal_synced=True,
                paid_at=today - datetime.timedelta(days=7),
                created_at=today - datetime.timedelta(days=12)
            ),
            Invoice(
                invoice_number="INV-2026-0002",
                recipient_id=recipient_objs["Sarah Chen"].id,
                recipient_name="Sarah Chen",
                recipient_email="sarah@apexstudios.com",
                amount=850.00,
                currency="USD",
                description="E-Commerce Payment Gateway Integration & Sandbox Verification",
                status="SENT",
                due_date=today + datetime.timedelta(days=5),
                paypal_order_id=None,
                is_paypal_synced=False,
                created_at=today - datetime.timedelta(days=3)
            ),
            Invoice(
                invoice_number="INV-2026-0003",
                recipient_id=recipient_objs["Marcus Vance"].id,
                recipient_name="Marcus Vance",
                recipient_email="marcus@vancecapital.org",
                amount=1200.00,
                currency="USD",
                description="Security Compliance Audit & Webhook Configuration",
                status="OVERDUE",
                due_date=today - datetime.timedelta(days=4),
                paypal_order_id=None,
                is_paypal_synced=False,
                created_at=today - datetime.timedelta(days=18)
            )
        ]
        for inv in invoices:
            db.add(inv)
        db.commit()

    # 5. Payout Requests
    if db.query(PayoutRequest).count() == 0:
        payouts = [
            PayoutRequest(
                payout_reference="PO-2026-0001",
                recipient_id=recipient_objs["Alex Rivera"].id,
                recipient_name="Alex Rivera",
                recipient_email="alex.rivera@designflow.co",
                amount=120.00,
                currency="USD",
                purpose="Approved design task - FinTech Dashboard Wireframes",
                status="PENDING_APPROVAL",
                requires_approval=True,
                is_duplicate_flag=False,
                payout_mode="SANDBOX_API",
                created_at=today - datetime.timedelta(hours=6)
            ),
            PayoutRequest(
                payout_reference="PO-2026-0002",
                recipient_id=recipient_objs["Elena Rostova"].id,
                recipient_name="Elena Rostova",
                recipient_email="elena@quantumdev.tech",
                amount=350.00,
                currency="USD",
                purpose="Backend FastAPI Microservice & Idempotency Layer",
                status="COMPLETED",
                requires_approval=True,
                is_duplicate_flag=False,
                paypal_batch_id="BATCH-SANDBOX-7731",
                paypal_payout_item_id="ITEM-SANDBOX-101",
                payout_mode="SANDBOX_API",
                approved_at=today - datetime.timedelta(days=2),
                approved_by="Alex Mercer",
                executed_at=today - datetime.timedelta(days=2),
                created_at=today - datetime.timedelta(days=3)
            )
        ]
        for po in payouts:
            db.add(po)
        db.commit()

    # 6. Transactions
    if db.query(Transaction).count() == 0:
        txs = [
            Transaction(
                reference_id="TX-CAP-98214-REC",
                type="INCOMING_PAYMENT",
                status="COMPLETED",
                amount=2400.00,
                currency="USD",
                source="PAYPAL_SANDBOX_ORDER",
                paypal_resource_id="CAP-98214-REC",
                description="Payment for invoice INV-2026-0001 (Marcus Vance)",
                fee=69.90,
                net_amount=2330.10,
                created_at=today - datetime.timedelta(days=7)
            ),
            Transaction(
                reference_id="TX-BATCH-SANDBOX-7731",
                type="CONTRACTOR_PAYOUT",
                status="COMPLETED",
                amount=350.00,
                currency="USD",
                source="PAYPAL_SANDBOX_PAYOUT",
                paypal_resource_id="BATCH-SANDBOX-7731",
                description="Contractor payout to Elena Rostova for 'Backend FastAPI Microservice'",
                fee=0.25,
                net_amount=350.00,
                created_at=today - datetime.timedelta(days=2)
            )
        ]
        for tx in txs:
            db.add(tx)
        db.commit()

    audit_service.log_event(
        db=db,
        event_type="DEMO_SEED_INITIALIZED",
        initiated_by="SYSTEM",
        validated_parameters={"invoices": 3, "payouts": 2, "transactions": 2},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id="SEED-INIT",
        details="Seeded realistic demo data including overdue invoices, verified contractors, and PayPal sandbox transactions."
    )

    return {"status": "SUCCESS", "message": "Demo data initialized successfully!"}

@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    """Cleans all demo records and resets to pristine state"""
    db.query(AuditEvent).delete()
    db.query(AIActionPlan).delete()
    db.query(WorkflowExecution).delete()
    db.query(Transaction).delete()
    db.query(PayoutRequest).delete()
    db.query(Invoice).delete()
    db.commit()
    return {"status": "SUCCESS", "message": "Database successfully reset to clean state."}
