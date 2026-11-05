from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import WorkflowRule, WorkflowExecution
from ..schemas import WorkflowRuleCreate, WorkflowRuleUpdate, WorkflowRuleResponse, WorkflowExecutionResponse, StandardSuccessResponse
from ..services.workflow_service import workflow_service
from ..services.audit_service import audit_service

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

    audit_service.log_event(
        db=db,
        event_type="WORKFLOW_RULE_CREATED",
        initiated_by="OPERATOR",
        validated_parameters={"rule_id": rule.id, "trigger": rule.trigger_type, "action": rule.action_type},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=f"RULE-{rule.id}",
        details=f"Created custom workflow rule: '{rule.name}'"
    )

    return rule

@router.get("/{rule_id}", response_model=WorkflowRuleResponse)
def get_workflow_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(WorkflowRule).filter(WorkflowRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Workflow rule not found")
    return rule

@router.put("/{rule_id}", response_model=WorkflowRuleResponse)
def update_workflow_rule(rule_id: int, rule_update: WorkflowRuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(WorkflowRule).filter(WorkflowRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Workflow rule not found")

    update_dict = rule_update.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            setattr(rule, field, val)

    db.commit()
    db.refresh(rule)

    audit_service.log_event(
        db=db,
        event_type="WORKFLOW_RULE_UPDATED",
        initiated_by="OPERATOR",
        validated_parameters=update_dict,
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=f"RULE-{rule.id}",
        details=f"Updated rule '{rule.name}'"
    )

    return rule

@router.patch("/{rule_id}/toggle", response_model=WorkflowRuleResponse)
def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(WorkflowRule).filter(WorkflowRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Workflow rule not found")
    rule.is_active = not rule.is_active
    db.commit()
    db.refresh(rule)

    audit_service.log_event(
        db=db,
        event_type="WORKFLOW_RULE_TOGGLED",
        initiated_by="OPERATOR",
        validated_parameters={"rule_id": rule.id, "is_active": rule.is_active},
        approval_status="APPROVED",
        execution_result="SUCCESS",
        reference_id=f"RULE-{rule.id}",
        details=f"Workflow rule '{rule.name}' toggled to {'ACTIVE' if rule.is_active else 'INACTIVE'}"
    )

    return rule

@router.delete("/{rule_id}", response_model=StandardSuccessResponse)
def delete_workflow_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(WorkflowRule).filter(WorkflowRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Workflow rule not found")

    name = rule.name
    db.delete(rule)
    db.commit()

    return StandardSuccessResponse(
        success=True,
        message=f"Workflow rule '{name}' has been deleted."
    )

@router.post("/{rule_id}/run", response_model=WorkflowExecutionResponse)
async def test_run_rule(rule_id: int, db: Session = Depends(get_db)):
    execution = await workflow_service.run_rule_manually(db, rule_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Workflow rule not found")
    return execution

@router.get("/executions", response_model=List[WorkflowExecutionResponse])
def get_executions(db: Session = Depends(get_db)):
    return db.query(WorkflowExecution).order_by(WorkflowExecution.executed_at.desc()).limit(100).all()
