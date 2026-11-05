import datetime
import html
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional, List, Dict, Any

def sanitize_string(val: Optional[str]) -> Optional[str]:
    if val is None:
        return None
    # Strip dangerous HTML/script injection tags while preserving clean text
    cleaned = html.escape(val.strip())
    return cleaned

# User Profile Schemas
class UserProfileBase(BaseModel):
    name: str
    business_name: str
    email: EmailStr
    currency: str = "USD"
    sandbox_mode: bool = True

    @field_validator("name", "business_name", mode="before")
    @classmethod
    def sanitize_names(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    email: Optional[EmailStr] = None
    currency: Optional[str] = None
    recorded_balance: Optional[float] = None
    sandbox_mode: Optional[bool] = None

    @field_validator("name", "business_name", mode="before")
    @classmethod
    def sanitize_names(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

class UserProfileResponse(UserProfileBase):
    id: int
    recorded_balance: float
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

# Recipient Schemas
class RecipientBase(BaseModel):
    name: str
    email: EmailStr
    paypal_email: EmailStr
    category: Optional[str] = "Contractor"
    verified: Optional[bool] = True
    notes: Optional[str] = None

    @field_validator("name", "notes", mode="before")
    @classmethod
    def sanitize_text(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

class RecipientCreate(RecipientBase):
    pass

class RecipientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    paypal_email: Optional[EmailStr] = None
    category: Optional[str] = None
    verified: Optional[bool] = None
    notes: Optional[str] = None

    @field_validator("name", "notes", mode="before")
    @classmethod
    def sanitize_text(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

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

    @field_validator("recipient_name", "description", mode="before")
    @classmethod
    def sanitize_text(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

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

    @field_validator("recipient_name", "purpose", mode="before")
    @classmethod
    def sanitize_payout(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

class PayoutUpdate(BaseModel):
    purpose: Optional[str] = None
    status: Optional[str] = None

    @field_validator("purpose", mode="before")
    @classmethod
    def sanitize_purpose(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

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

    @field_validator("name", "description", mode="before")
    @classmethod
    def sanitize_wf(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

class WorkflowRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    condition_expression: Optional[str] = None
    action_type: Optional[str] = None
    requires_approval: Optional[bool] = None
    is_active: Optional[bool] = None

    @field_validator("name", "description", mode="before")
    @classmethod
    def sanitize_wf(cls, v):
        return sanitize_string(v) if isinstance(v, str) else v

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
    intent: str = "UNKNOWN"
    entities: Optional[ExtractedEntities] = Field(default_factory=ExtractedEntities)
    proposed_action: Optional[str] = None
    reasoning: Optional[str] = ""
    risk_level: Optional[str] = "LOW"  # LOW, MEDIUM, HIGH
    requires_approval: bool = True
    is_allowed: bool = True
    blocking_reason: Optional[str] = None
    follow_up_question: Optional[str] = None
    consequences: Optional[str] = ""

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

# General Standard Responses
class StandardSuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

class PayPalWebhookEvent(BaseModel):
    id: Optional[str] = None
    event_type: str
    resource_type: Optional[str] = None
    summary: Optional[str] = None
    resource: Dict[str, Any] = Field(default_factory=dict)

