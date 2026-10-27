import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Demo Operator")
    business_name = Column(String(150), default="Acme Digital Studio")
    email = Column(String(150), default="operator@acmestudio.io")
    currency = Column(String(10), default="USD")
    recorded_balance = Column(Float, default=14500.00)
    sandbox_mode = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    paypal_email = Column(String(150), nullable=False)
    category = Column(String(50), default="Contractor")  # Contractor, Client, Vendor
    verified = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    invoices = relationship("Invoice", back_populates="recipient")
    payouts = relationship("PayoutRequest", back_populates="recipient")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    recipient_id = Column(Integer, ForeignKey("recipients.id"), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    recipient_email = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    description = Column(Text, nullable=False)
    status = Column(String(30), default="SENT")  # DRAFT, SENT, PAID, OVERDUE, CANCELLED
    due_date = Column(DateTime, nullable=False)
    
    # PayPal Integration details
    paypal_order_id = Column(String(100), nullable=True, index=True)
    paypal_capture_id = Column(String(100), nullable=True)
    paypal_invoice_id = Column(String(100), nullable=True)
    is_paypal_synced = Column(Boolean, default=False)
    
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    recipient = relationship("Recipient", back_populates="invoices")
    transactions = relationship("Transaction", back_populates="invoice")

class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(Integer, primary_key=True, index=True)
    payout_reference = Column(String(50), unique=True, index=True, nullable=False)
    recipient_id = Column(Integer, ForeignKey("recipients.id"), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    recipient_email = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    purpose = Column(Text, nullable=False)
    
    status = Column(String(30), default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, REJECTED, PROCESSING, COMPLETED, FAILED
    requires_approval = Column(Boolean, default=True)
    is_duplicate_flag = Column(Boolean, default=False)
    
    # PayPal Payouts API tracking
    paypal_batch_id = Column(String(100), nullable=True)
    paypal_payout_item_id = Column(String(100), nullable=True)
    payout_mode = Column(String(30), default="SANDBOX_API")  # SANDBOX_API or SIMULATED_SANDBOX
    failure_reason = Column(Text, nullable=True)
    
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String(100), nullable=True)
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    recipient = relationship("Recipient", back_populates="payouts")
    transactions = relationship("Transaction", back_populates="payout")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(100), unique=True, index=True, nullable=False)
    type = Column(String(50), nullable=False)  # INCOMING_PAYMENT, CONTRACTOR_PAYOUT, REFUND
    status = Column(String(30), default="COMPLETED")  # COMPLETED, PENDING, FAILED
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    source = Column(String(50), default="PAYPAL_SANDBOX_ORDER")  # PAYPAL_SANDBOX_ORDER, PAYPAL_SANDBOX_PAYOUT, LOCAL_LEDGER
    
    paypal_resource_id = Column(String(100), nullable=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    payout_id = Column(Integer, ForeignKey("payout_requests.id"), nullable=True)
    
    description = Column(Text, nullable=False)
    fee = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utcnow)

    invoice = relationship("Invoice", back_populates="transactions")
    payout = relationship("PayoutRequest", back_populates="transactions")

class WorkflowRule(Base):
    __tablename__ = "workflow_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    trigger_type = Column(String(50), nullable=False)  # INVOICE_PAID, TASK_APPROVED, INVOICE_OVERDUE, PAYMENT_FAILED
    condition_expression = Column(String(255), nullable=True)
    action_type = Column(String(50), nullable=False)  # RECONCILE_AND_LEDGER, PREPARE_PAYOUT, GENERATE_REMINDER, LOG_FAILURE_RECOVERY
    requires_approval = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    executions = relationship("WorkflowExecution", back_populates="rule")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflow_rules.id"), nullable=True)
    workflow_name = Column(String(150), nullable=False)
    trigger_event = Column(String(100), nullable=False)
    status = Column(String(30), default="SUCCESS")  # SUCCESS, FAILED, PENDING_APPROVAL
    input_payload = Column(JSON, nullable=True)
    execution_result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=utcnow)

    rule = relationship("WorkflowRule", back_populates="executions")

class AIActionPlan(Base):
    __tablename__ = "ai_action_plans"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    intent = Column(String(50), nullable=False)
    extracted_parameters = Column(JSON, nullable=False)
    proposed_action = Column(String(100), nullable=False)
    reasoning = Column(Text, nullable=False)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    requires_approval = Column(Boolean, default=True)
    status = Column(String(30), default="PROPOSED")  # PROPOSED, CONFIRMED, EXECUTED, REJECTED
    execution_result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    initiated_by = Column(String(100), default="AI_AGENT")  # AI_AGENT, USER, AUTOMATION_WORKFLOW, SYSTEM
    validated_parameters = Column(JSON, nullable=True)
    approval_status = Column(String(50), default="NOT_REQUIRED")  # NOT_REQUIRED, PENDING, APPROVED, REJECTED
    execution_result = Column(String(50), default="SUCCESS")  # SUCCESS, FAILED, BLOCKED
    reference_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utcnow)
