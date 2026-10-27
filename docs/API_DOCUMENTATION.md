# PayPilot AI — API Documentation Reference

All API endpoints are hosted at `http://127.0.0.1:8000/api` and documented interactively via OpenAPI Swagger at `http://127.0.0.1:8000/docs`.

---

## 1. System & Health

### `GET /api/health`
Checks the operating status and active provider configurations.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "app": "PayPilot AI",
  "env": "development",
  "paypal_configured": false,
  "gemini_configured": false
}
```

---

## 2. AI Operations Agent

### `POST /api/ai/chat`
Submits a natural-language prompt to the AI Payment Operations Agent.

**Request Body:**
```json
{
  "message": "Create a $250 invoice for Alex for website development",
  "session_id": "default"
}
```

**Response (200 OK):**
```json
{
  "message": "I have prepared an action plan to create a $250.00 USD invoice for Alex for 'Website development'. Please review the plan below and authorize execution.",
  "action_plan": {
    "plan_id": 1,
    "intent": "CREATE_INVOICE",
    "entities": {
      "amount": 250.0,
      "currency": "USD",
      "recipient_name": "Alex",
      "recipient_email": "alex@example.com",
      "purpose": "Website development",
      "due_date": "In 14 days",
      "action_type": "CREATE_INVOICE"
    },
    "proposed_action": "Create Invoice for Alex ($250.00 USD)",
    "reasoning": "User requested invoice creation. Recipient and amount are valid. Ready to generate invoice with PayPal checkout integration.",
    "risk_level": "LOW",
    "requires_approval": true,
    "is_allowed": true,
    "blocking_reason": null,
    "follow_up_question": null,
    "consequences": "An invoice will be recorded in the system for $250.00 USD and a PayPal Sandbox payment session will be enabled."
  },
  "grounded_data": {
    "unpaid_invoices_count": 2,
    "unpaid_invoices_total": 2050.0,
    "overdue_invoices_count": 1,
    "overdue_invoices_total": 1200.0,
    "total_transactions_recorded": 2,
    "verified_recipients": ["Alex Rivera", "Elena Rostova", "Marcus Vance", "Sarah Chen"]
  },
  "audit_event_id": 4
}
```

### `POST /api/ai/execute-plan`
Executes or rejects a previously staged AI Action Plan.

**Request Body:**
```json
{
  "plan_id": 1,
  "decision": "CONFIRM"
}
```

**Response (200 OK):**
```json
{
  "status": "EXECUTED",
  "result": {
    "created_type": "INVOICE",
    "invoice_number": "INV-2026-0004",
    "amount": 250.0,
    "currency": "USD",
    "recipient": "Alex",
    "status": "SENT",
    "is_duplicate_flag": false
  },
  "message": "Action successfully executed."
}
```

---

## 3. Invoices & PayPal Checkout

### `GET /api/invoices`
Returns all invoices with optional status filtering.

**Query Parameters:**
- `status` (optional): `SENT`, `PAID`, `OVERDUE`, `DRAFT`, `CANCELLED`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "invoice_number": "INV-2026-0001",
    "recipient_id": 3,
    "recipient_name": "Marcus Vance",
    "recipient_email": "marcus@vancecapital.org",
    "amount": 2400.0,
    "currency": "USD",
    "description": "Enterprise Architecture Consulting",
    "status": "PAID",
    "due_date": "2026-10-17T06:35:46",
    "paypal_order_id": "SANDBOX-ORD-98214",
    "paypal_capture_id": "CAP-98214-REC",
    "paypal_invoice_id": null,
    "is_paypal_synced": true,
    "paid_at": "2026-10-20T06:35:46",
    "created_at": "2026-10-15T06:35:46"
  }
]
```

### `POST /api/invoices/{id}/checkout`
Initializes a PayPal Sandbox Order resource via `/v2/checkout/orders`.

**Response (200 OK):**
```json
{
  "id": "SIM-PAYPAL-ORD-1793081240",
  "status": "CREATED",
  "simulated": true,
  "links": [
    {
      "rel": "approve",
      "href": "http://localhost:5173/checkout-simulated?order_id=SIM-PAYPAL-ORD-1793081240&amount=250.0&currency=USD"
    }
  ]
}
```

### `POST /api/invoices/{id}/capture`
Captures an approved PayPal order and marks the invoice as `PAID`.

**Query Parameters:**
- `order_id` (required): The PayPal order identifier.

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "invoice": {
    "id": 4,
    "invoice_number": "INV-2026-0004",
    "status": "PAID",
    "amount": 250.0,
    "currency": "USD",
    "paid_at": "2026-10-27T06:47:20.123456"
  }
}
```

---

## 4. Contractor Payouts

### `POST /api/payouts`
Stages a new contractor payout request.

**Request Body:**
```json
{
  "recipient_name": "Elena Rostova",
  "recipient_email": "elena@quantumdev.tech",
  "amount": 120.0,
  "currency": "USD",
  "purpose": "Milestone delivery - Backend API Layer"
}
```

**Response (200 OK):**
```json
{
  "id": 3,
  "payout_reference": "PO-2026-0003",
  "recipient_name": "Elena Rostova",
  "recipient_email": "elena@quantumdev.tech",
  "amount": 120.0,
  "currency": "USD",
  "purpose": "Milestone delivery - Backend API Layer",
  "status": "PENDING_APPROVAL",
  "requires_approval": true,
  "is_duplicate_flag": false,
  "payout_mode": "SANDBOX_API",
  "created_at": "2026-10-27T06:50:00"
}
```

### `POST /api/payouts/{id}/approve`
Human operator approves a staged payout request.

**Response (200 OK):**
```json
{
  "id": 3,
  "status": "APPROVED",
  "approved_by": "Operator",
  "approved_at": "2026-10-27T06:51:12"
}
```

### `POST /api/payouts/{id}/execute`
Executes an approved payout request using the PayPal Payouts API.

**Response (200 OK):**
```json
{
  "id": 3,
  "status": "COMPLETED",
  "paypal_batch_id": "BATCH-SANDBOX-8821",
  "payout_mode": "SANDBOX_API",
  "executed_at": "2026-10-27T06:52:00"
}
```

---

## 5. Workflow Automation Engine

### `GET /api/workflows`
Returns all active conditional automation rules.

### `PATCH /api/workflows/{id}/toggle`
Toggles a workflow rule between active and inactive.

### `POST /api/workflows/{id}/run`
Manually test triggers a workflow rule to verify execution logging.

**Response (200 OK):**
```json
{
  "id": 1,
  "workflow_name": "Reconcile Paid Invoices to Ledger",
  "trigger_event": "INVOICE_PAID",
  "status": "SUCCESS",
  "execution_result": {
    "action": "Ledger updated and reconciled",
    "status": "COMPLETED"
  },
  "executed_at": "2026-10-27T06:55:00"
}
```

---

## 6. Financial Ledger & Analytics

### `GET /api/transactions`
Returns ledger records with optional search query and type filter (`INCOMING_PAYMENT` or `CONTRACTOR_PAYOUT`).

### `GET /api/transactions/stats`
Computes financial KPIs, 7-day cash flow trend coordinates, and grounded copilot summaries.

**Response (200 OK):**
```json
{
  "total_incoming": 2650.0,
  "total_outgoing": 350.0,
  "net_balance": 2300.0,
  "pending_invoices_count": 1,
  "pending_invoices_amount": 850.0,
  "overdue_invoices_count": 1,
  "overdue_invoices_amount": 1200.0,
  "pending_payouts_count": 1,
  "pending_payouts_amount": 120.0,
  "cash_flow_trends": [
    {"date": "Oct 21", "incoming": 2400.0, "outgoing": 0.0, "net": 2400.0},
    {"date": "Oct 27", "incoming": 250.0, "outgoing": 0.0, "net": 250.0}
  ],
  "ai_summary": "Business health is operating with a recorded net cash flow of $2,300.00 USD. 1 customer invoice(s) pending collection ($850.00 USD). ⚠️ Action Required: 1 invoice(s) overdue totaling $1,200.00 USD."
}
```

---

## 7. Sandbox Configuration & Seed

### `POST /api/paypal/test-connection`
Validates configured PayPal Sandbox client credentials against OAuth 2.0.

### `POST /api/paypal/update-config`
Updates runtime credentials live without restarting the server.

### `POST /api/seed`
Seeds realistic demonstration records (overdue invoices, verified contractors, and ledger records).

### `POST /api/seed/reset`
Resets the database to a clean, empty state.
