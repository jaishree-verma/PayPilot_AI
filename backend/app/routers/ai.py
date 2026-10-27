import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AIActionPlan, Invoice, PayoutRequest
from ..schemas import AIChatRequest, AIChatResponse, ExecutePlanRequest, AIActionPlanModel, InvoiceCreate, PayoutCreate
from ..services.ai_service import ai_service
from ..services.invoice_service import invoice_service
from ..services.payout_service import payout_service
from ..services.audit_service import audit_service

router = APIRouter(prefix="/api/ai", tags=["AI Agent"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_agent(req: AIChatRequest, db: Session = Depends(get_db)):
    """
    Primary conversational endpoint for the AI Payment Operations Agent.
    Interprets intent, checks rules, builds action plan, queries live DB facts.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    result = await ai_service.process_user_message(req.message.strip(), db)
    return result

@router.post("/execute-plan")
async def execute_action_plan(req: ExecutePlanRequest, db: Session = Depends(get_db)):
    """
    Executes or rejects an AI-proposed Action Plan after operator confirmation.
    NEVER allows the LLM to directly bypass authorization or financial controls.
    """
    plan = db.query(AIActionPlan).filter(AIActionPlan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Action Plan not found")

    if plan.status != "PROPOSED":
        raise HTTPException(status_code=400, detail=f"Action Plan is already {plan.status}")

    if req.decision == "REJECT":
        plan.status = "REJECTED"
        db.commit()
        audit_service.log_event(
            db=db,
            event_type="AI_PLAN_REJECTED",
            initiated_by="OPERATOR",
            validated_parameters=plan.extracted_parameters,
            approval_status="REJECTED",
            execution_result="BLOCKED",
            reference_id=f"PLAN-{plan.id}",
            details=f"Operator rejected action plan {plan.id} ({plan.proposed_action})"
        )
        return {"status": "REJECTED", "message": "Action plan was rejected by the operator."}

    # Execute authorized plan
    plan.status = "CONFIRMED"
    entities = plan.extracted_parameters or {}
    exec_result = {}

    try:
        if plan.intent == "CREATE_INVOICE":
            inv_in = InvoiceCreate(
                recipient_name=entities.get("recipient_name") or "Client",
                recipient_email=entities.get("recipient_email") or "client@example.com",
                amount=float(entities.get("amount", 100)),
                currency=entities.get("currency", "USD"),
                description=entities.get("purpose") or "Consulting and digital services"
            )
            inv, is_dup = invoice_service.create_invoice(db, inv_in, initiated_by="AI_AGENT_AUTHORIZED")
            exec_result = {
                "created_type": "INVOICE",
                "invoice_number": inv.invoice_number,
                "amount": inv.amount,
                "currency": inv.currency,
                "recipient": inv.recipient_name,
                "status": inv.status,
                "is_duplicate_flag": is_dup
            }

        elif plan.intent == "PREPARE_PAYOUT":
            payout_in = PayoutCreate(
                recipient_name=entities.get("recipient_name") or "Contractor",
                recipient_email=entities.get("recipient_email") or "contractor@example.com",
                amount=float(entities.get("amount", 50)),
                currency=entities.get("currency", "USD"),
                purpose=entities.get("purpose") or "Task completion payout"
            )
            payout, is_dup, err = payout_service.create_payout_request(db, payout_in, initiated_by="AI_AGENT_AUTHORIZED")
            if err:
                raise Exception(err)

            exec_result = {
                "created_type": "PAYOUT_REQUEST",
                "payout_reference": payout.payout_reference,
                "amount": payout.amount,
                "currency": payout.currency,
                "recipient": payout.recipient_name,
                "status": payout.status,
                "requires_human_approval": payout.requires_approval
            }

        plan.status = "EXECUTED"
        plan.execution_result = exec_result
        db.commit()

        audit_service.log_event(
            db=db,
            event_type="AI_PLAN_EXECUTED",
            initiated_by="OPERATOR",
            validated_parameters=entities,
            approval_status="APPROVED",
            execution_result="SUCCESS",
            reference_id=f"PLAN-{plan.id}",
            details=f"Successfully executed authorized plan {plan.id}: {plan.proposed_action}"
        )

        return {"status": "EXECUTED", "result": exec_result, "message": "Action successfully executed."}

    except Exception as e:
        plan.status = "FAILED"
        plan.error_message = str(e)
        db.commit()
        audit_service.log_event(
            db=db,
            event_type="AI_PLAN_EXECUTION_FAILED",
            initiated_by="OPERATOR",
            validated_parameters=entities,
            approval_status="APPROVED",
            execution_result="FAILED",
            reference_id=f"PLAN-{plan.id}",
            details=f"Failed executing plan {plan.id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    return db.query(AIActionPlan).order_by(AIActionPlan.created_at.desc()).limit(20).all()
