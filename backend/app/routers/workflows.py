from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import WorkflowRule, WorkflowExecution
from ..schemas import WorkflowRuleCreate, WorkflowRuleResponse, WorkflowExecutionResponse
from ..services.workflow_service import workflow_service

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

@router.get("", response_model=List[WorkflowRuleResponse])
def get_workflow_rules(db: Session = Depends(get_db)):
    return db.query(WorkflowRule).order_by(WorkflowRule.id.asc()).all()

@router.post("", response_model=WorkflowRuleResponse)
def create_workflow_rule(rule_in: WorkflowRuleCreate, db: Session = Depends(get_db)):
    rule = WorkflowRule(
        name=rule_in.name,
        description=rule_in.description,
        trigger_type=rule_in.trigger_type,
        condition_expression=rule_in.condition_expression,
        action_type=rule_in.action_type,
        requires_approval=rule_in.requires_approval,
        is_active=rule_in.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.patch("/{rule_id}/toggle", response_model=WorkflowRuleResponse)
def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(WorkflowRule).filter(WorkflowRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Workflow rule not found")
    rule.is_active = not rule.is_active
    db.commit()
    db.refresh(rule)
    return rule

@router.post("/{rule_id}/run", response_model=WorkflowExecutionResponse)
async def test_run_rule(rule_id: int, db: Session = Depends(get_db)):
    execution = await workflow_service.run_rule_manually(db, rule_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Workflow rule not found")
    return execution

@router.get("/executions", response_model=List[WorkflowExecutionResponse])
def get_executions(db: Session = Depends(get_db)):
    return db.query(WorkflowExecution).order_by(WorkflowExecution.executed_at.desc()).limit(50).all()
