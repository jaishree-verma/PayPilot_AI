import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any

# Recipient Schemas
class RecipientBase(BaseModel):
    name: str
    email: EmailStr
    paypal_email: EmailStr
    category: Optional[str] = "Contractor"
    verified: Optional[bool] = True
    notes: Optional[str] = None

class RecipientCreate(RecipientBase):
    pass

class RecipientResponse(RecipientBase):
    id: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# Invoice Schemas
class InvoiceCreate(BaseModel):
    recipient_name: str
    recipient_email: EmailStr
    amount: float = Field(..., gt=0, description="Amount must be strictly positive")
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    description: str
    due_date: Optional[datetime.datetime] = None

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    recipient_id: Optional[int] = None
    recipient_name: str
    recipient_email: str
    amount: float
    currency: str
    description: str
    status: str
    due_date: datetime.datetime
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    paypal_invoice_id: Optional[str] = None
    is_paypal_synced: bool
    paid_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# Payout Schemas
class PayoutCreate(BaseModel):
    recipient_name: str
    recipient_email: EmailStr
    amount: float = Field(..., gt=0, description="Payout amount must be greater than zero")
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    purpose: str
    task_id: Optional[str] = None

class PayoutApprove(BaseModel):
    approved_by: Optional[str] = "Operator"

class PayoutResponse(BaseModel):
    id: int
    payout_reference: str
    recipient_id: Optional[int] = None
    recipient_name: str
    recipient_email: str
    amount: float
    currency: str
    purpose: str
    status: str
    requires_approval: bool
    is_duplicate_flag: bool
    paypal_batch_id: Optional[str] = None
    paypal_payout_item_id: Optional[str] = None
    payout_mode: str
    failure_reason: Optional[str] = None
    approved_at: Optional[datetime.datetime] = None
    approved_by: Optional[str] = None
    executed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# Transaction Schemas
class TransactionResponse(BaseModel):
    id: int
    reference_id: str
    type: str
    status: str
    amount: float
    currency: str
    source: str
    paypal_resource_id: Optional[str] = None
    invoice_id: Optional[int] = None
    payout_id: Optional[int] = None
    description: str
    fee: float
    net_amount: float
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class CashFlowPoint(BaseModel):
    date: str
    incoming: float
    outgoing: float
    net: float

class FinancialStats(BaseModel):
    total_incoming: float
    total_outgoing: float
    net_balance: float
    pending_invoices_count: int
    pending_invoices_amount: float
    overdue_invoices_count: int
    overdue_invoices_amount: float
    pending_payouts_count: int
    pending_payouts_amount: float
    recent_transactions: List[TransactionResponse]
    cash_flow_trends: List[CashFlowPoint]
    ai_summary: str

# Workflow Schemas
class WorkflowRuleCreate(BaseModel):
    name: str
    description: str
    trigger_type: str
    condition_expression: Optional[str] = None
    action_type: str
    requires_approval: bool = True
    is_active: bool = True

class WorkflowRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    trigger_type: str
    condition_expression: Optional[str] = None
    action_type: str
    requires_approval: bool
    is_active: bool
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class WorkflowExecutionResponse(BaseModel):
    id: int
    workflow_id: Optional[int] = None
    workflow_name: str
    trigger_event: str
    status: str
    input_payload: Optional[Dict[str, Any]] = None
    execution_result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    executed_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# AI Agent Schemas
class AIChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class ExtractedEntities(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    purpose: Optional[str] = None
    due_date: Optional[str] = None
    action_type: Optional[str] = None

class AIActionPlanModel(BaseModel):
    plan_id: Optional[int] = None
    intent: str
    entities: ExtractedEntities
    proposed_action: str
    reasoning: str
    risk_level: str  # LOW, MEDIUM, HIGH
    requires_approval: bool
    is_allowed: bool
    blocking_reason: Optional[str] = None
    follow_up_question: Optional[str] = None
    consequences: str

class AIChatResponse(BaseModel):
    message: str
    action_plan: Optional[AIActionPlanModel] = None
    grounded_data: Optional[Dict[str, Any]] = None
    audit_event_id: Optional[int] = None

class ExecutePlanRequest(BaseModel):
    plan_id: int
    decision: str = "CONFIRM"  # CONFIRM or REJECT

# PayPal Schemas
class PayPalConfigResponse(BaseModel):
    client_id_configured: bool
    client_id_preview: Optional[str] = None
    mode: str
    api_base: str
    is_connected: bool
    status_message: str

class PayPalOrderCreateRequest(BaseModel):
    invoice_id: int

class PayPalOrderCreateResponse(BaseModel):
    order_id: str
    status: str
    approve_url: Optional[str] = None

class PayPalOrderCaptureRequest(BaseModel):
    order_id: str
    invoice_id: int

class PayPalOrderCaptureResponse(BaseModel):
    capture_id: str
    order_id: str
    status: str
    amount: float
    currency: str
    transaction_id: int

# Audit Schema
class AuditEventResponse(BaseModel):
    id: int
    event_type: str
    initiated_by: str
    validated_parameters: Optional[Dict[str, Any]] = None
    approval_status: str
    execution_result: str
    reference_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
