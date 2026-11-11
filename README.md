# PayPilot AI - Autonomous Payment Operations Platform

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-REST%20APIs-0070BA.svg)](https://developer.paypal.com)
[![Tests Passing](https://img.shields.io/badge/tests-13%20passed-success.svg)](./backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

PayPilot AI is an autonomous financial operations copilot built for small businesses, agencies, and operators. It transforms natural language instructions into structured, policy-validated payment workflows executed over official PayPal Sandbox REST APIs. Every action is recorded in an audit log and synchronized with a double-entry ledger.

<div align="center">

### Watch Demo Video

[![PayPilot AI Demo Video](https://img.youtube.com/vi/qQSeYp4fPis/hqdefault.jpg)](https://youtu.be/qQSeYp4fPis)

[![Watch on YouTube](https://img.shields.io/badge/Watch%20Demo%20on%20YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/qQSeYp4fPis)

[https://youtu.be/qQSeYp4fPis](https://youtu.be/qQSeYp4fPis)

</div>

---

## 1. Problem Statement

Small businesses and digital agencies spend hours each week coordinating payment operations across fragmented interfaces:
- Manually drafting client invoices, tracking payment links, and chasing overdue accounts.
- Switching between banking dashboards and payout lists to disburse contractor compensation.
- Bearing the financial and administrative costs of accidental duplicate payouts submitted by multiple operators.
- Performing end-of-month reconciliation where bank statements, invoice statuses, and accounting ledgers diverge.
- Addressing the AI safety dilemma: pure autonomous execution of financial actions by LLMs is unsafe without deterministic validation, policy thresholds, and human-in-the-loop authorization.

---

## 2. Proposed Solution

PayPilot AI bridges natural-language instruction and financial settlement through a 4-tier model:
1. **Conversational Intent to Structured Action:** Users interact via natural language. The system extracts entities and returns a typed `AIActionPlan` detailing proposed operations, rationale, risk tier, and parameters.
2. **Deterministic Business Policy Layer:** Before reaching payment gateways, requests pass through hardcoded validation rules and 24-hour idempotency checks.
3. **Human-in-the-Loop Safeguards:** Consequential financial operations (disbursements exceeding $100 or high-risk mutations) cannot be executed by the model alone; they require operator confirmation.
4. **Direct PayPal Sandbox Rails:** Approved workflows execute against official PayPal REST APIs (Orders API for receivables, Payouts API for disbursements) and settle into a persistent local ledger.

---

## 3. System Architecture

The following diagram illustrates the component architecture, control flow, and data boundaries implemented across the codebase:

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + TypeScript + Vite)"]
        UI_Chat["AI Chat Workspace (/agent)"]
        UI_Invoices["Invoices & Checkout (/invoices)"]
        UI_Payouts["Payout Approvals (/payouts)"]
        UI_Workflows["Workflow Engine (/workflows)"]
        UI_Ledger["Ledger & Analytics (/transactions)"]
        UI_Insights["Audit Trail (/insights)"]
    end

    subgraph Gateway ["API Gateway (FastAPI + Pydantic v2)"]
        Middleware["Global Error & Request-ID Middleware"]
        Sanitization["HTML/XSS Sanitization & Input Coercion"]
        Routers["Routers: /api/ai, /api/invoices, /api/payouts, /api/paypal, /api/transactions, /api/workflows, /api/recipients, /api/user"]
    end

    subgraph ServiceLayer ["Service Layer (Python 3.12)"]
        AI_Svc["ai_service.py\n(Intent Parser, Plan Generator, Heuristic Fallback)"]
        Inv_Svc["invoice_service.py\n(Invoice Lifecycle & Receipt Generation)"]
        Pay_Svc["payout_service.py\n(Idempotency Locks & Threshold Gates)"]
        PP_Svc["paypal_service.py\n(OAuth 2.0, Orders API, Payouts API)"]
        Wf_Svc["workflow_service.py\n(Trigger-Condition-Action Engine)"]
        Tx_Svc["transaction_service.py\n(Ledger Journal & CSV Exporter)"]
        Audit_Svc["audit_service.py\n(Append-Only Event Logger)"]
    end

    subgraph Integrations ["External APIs"]
        Gemini["Google Gemini API\n(gemini-2.5-flash via google-genai)"]
        PayPalSandbox["PayPal Sandbox REST API\n(api-m.sandbox.paypal.com)"]
    end

    subgraph Persistence ["Persistence Layer (SQLAlchemy 2.0 + SQLite)"]
        DB[("SQLite Database: paypilot.db\n(users, recipients, invoices, payout_requests,\ntransactions, workflow_rules, workflow_executions,\nai_action_plans, audit_events)")]
    end

    Client -->|HTTP / JSON requests via /api| Middleware
    Middleware --> Sanitization
    Sanitization --> Routers
    Routers --> ServiceLayer

    AI_Svc <-->|NLP prompt & JSON response| Gemini
    AI_Svc -->|Grounding queries| DB
    AI_Svc -->|Persist plans| DB
    
    Inv_Svc --> DB
    Pay_Svc --> DB
    Wf_Svc --> DB
    Tx_Svc --> DB
    Audit_Svc --> DB

    Inv_Svc -->|Create order & capture| PP_Svc
    Pay_Svc -->|Disburse batch payout| PP_Svc
    PP_Svc <-->|Bearer Token Auth & REST Operations| PayPalSandbox
```

---

## 4. How the AI Agent Works

The AI agent architecture separates language understanding from database mutation:

```mermaid
sequenceDiagram
    autonumber
    actor User as Operator
    participant UI as Chat Workspace (/agent)
    participant API as /api/ai/chat Router
    participant AISvc as ai_service.py
    participant LLM as Google Gemini 2.5 Flash
    participant DB as SQLite Database
    
    User->>UI: Enter request (e.g. "Create a $250 invoice for Alex")
    UI->>API: POST /api/ai/chat { message: "..." }
    API->>AISvc: send_chat_message(message, db)
    
    alt Gemini API Key Available
        AISvc->>LLM: Generate structured plan (Strict System Prompt + JSON Schema)
        LLM-->>AISvc: { intent, entities: { name, amount, email, purpose }, confidence }
    else Gemini Offline or Rate-Limited
        AISvc->>AISvc: _extract_entities_heuristically() fallback
    end

    AISvc->>AISvc: _apply_business_rules(plan, db)
    Note over AISvc: Check duplicate payouts within 24h & evaluate >$100 threshold
    AISvc->>DB: Persist AIActionPlan (status = PENDING)
    AISvc->>DB: Log AuditEvent (AI_PLAN_PROPOSED)
    AISvc-->>UI: Return AIChatResponse with action_plan object
    
    UI->>User: Render Action Card with explicit "Authorize & Execute" button
    User->>UI: Clicks "Authorize & Execute"
    UI->>API: POST /api/ai/execute-plan { plan_id, decision: "CONFIRM" }
    API->>AISvc: execute_action_plan(plan_id, decision, db)
    AISvc->>DB: Execute real DB mutation (Create Invoice / Stage Payout)
    AISvc->>DB: Update AIActionPlan status to EXECUTED
    AISvc->>DB: Log AuditEvent (AI_PLAN_EXECUTED)
    AISvc-->>UI: Return execution receipt & summary
```

### Heuristic Fallback Engine
If the external Gemini API is unreachable, unconfigured, or rate-limited, `ai_service.py` falls back to an offline rule-based parser. Regular expressions and domain dictionaries extract amounts, ISO currencies, client names, and recipient emails. This guarantees zero downtime for core commands during testing or evaluation.

---

## 5. Gemini and PayPal Integration Flow

The integration separates conversational reasoning from monetary execution:
- **Gemini is not given direct API keys to PayPal.** The LLM cannot autonomously initiate network requests to PayPal endpoints.
- **Structured Contracts:** Gemini outputs an explicit operational plan (`CREATE_INVOICE`, `STAGE_PAYOUT`, `QUERY_OVERDUE`, `RECONCILE_LEDGER`).
- **Backend Validation:** The FastAPI backend inspects the generated plan, validates parameters against Pydantic schemas, and executes the designated service (`invoice_service.py` or `payout_service.py`).
- **PayPal Execution:** The dedicated PayPal service (`paypal_service.py`) handles OAuth 2.0 token acquisition and sends structured requests to `api-m.sandbox.paypal.com`.

---

## 6. Payment Processing: Invoices and Payouts

### Invoicing Flow (Receivables / Money-In)
1. **Creation:** Invoices are created via the AI Chat or the `/invoices` modal with invoice number, client details, amount, currency, and line items.
2. **Status Tracking:** Invoices are marked `SENT` with an assigned due date.
3. **PayPal Checkout:** Clicking "Pay via PayPal" initializes a checkout session via `/api/paypal/create-order`, creating an order record in the PayPal Sandbox Orders API.
4. **Capture & Settlement:** Upon customer payment, `/api/paypal/capture-order` captures funds.
5. **Reconciliation:** The invoice status updates to `PAID`, a transaction record of type `INCOMING_PAYMENT` is written to the ledger, and an audit entry is recorded.

### Contractor Payout Flow (Disbursements / Money-Out)
1. **Staging:** Payouts are staged via natural language or the `/payouts` interface with contractor name, PayPal email, amount, and purpose.
2. **Duplicate Check:** `payout_service.py` evaluates active payouts for identical recipient email and amount values submitted within the last 24 hours. Matches are flagged with `is_duplicate_flag = True`.
3. **Approval Gate:** Payouts exceeding $100 are assigned `PENDING_APPROVAL` status. They cannot be disbursed until a human operator clicks "Approve".
4. **Disbursement:** Once approved, clicking "Disburse Funds" invokes `/api/payouts/{id}/execute`. The service sends a single batch payout request via the PayPal Payouts API (`/v1/payments/payouts`) with an idempotency key (`TX-PAYOUT-{id}-{timestamp}`).
5. **Ledger Record:** The payout status updates to `COMPLETED`, logging a `CONTRACTOR_PAYOUT` record in the ledger.

---

## 7. Human-in-the-Loop and Financial Safeguards

| Safeguard | Implementation Mechanism | Code Reference |
| :--- | :--- | :--- |
| **$100 Approval Threshold** | Payout requests exceeding $100 require human authorization (`requires_approval = True`). Payouts remain in `PENDING_APPROVAL` until approved via `/api/payouts/{id}/approve`. | `backend/app/services/payout_service.py` |
| **Idempotency & Duplicate Locking** | Evaluates recipient email, currency, and amount across a 24-hour window. Flags duplicates to prevent multiple disbursements for the same task. | `backend/app/services/payout_service.py` |
| **Input Sanitization (XSS & Injection)** | String fields in Pydantic schemas pass through `html.escape` field validators. Invalid currencies, negative values, and malformed emails trigger 422 errors. | `backend/app/schemas.py` |
| **Append-Only Audit Logging** | Every AI proposal, execution, approval, rejection, and webhook receipt is logged with timestamp, actor, reference ID, and outcome. | `backend/app/services/audit_service.py` |
| **Zero-Hallucination Copilot** | Financial summaries and overdue invoice lists query active SQLite records directly rather than relying on generative model memory. | `backend/app/services/ai_service.py` |

---

## 8. Database Architecture and Backend Services

The application uses SQLAlchemy 2.0 with a SQLite persistence engine (`backend/paypilot.db`). Path resolution is anchored to the backend module directory to ensure stable database access regardless of execution working directory.

### Relational Schema

```mermaid
erDiagram
    User ||--o{ Invoice : manages
    User ||--o{ PayoutRequest : authorizes
    Recipient ||--o{ PayoutRequest : receives
    Invoice ||--o{ Transaction : generates
    PayoutRequest ||--o{ Transaction : generates
    WorkflowRule ||--o{ WorkflowExecution : logs

    User {
        int id PK
        string name
        string email
        string business_name
        string currency
        float recorded_balance
        boolean sandbox_mode
        datetime created_at
    }

    Recipient {
        int id PK
        string name
        string email
        string paypal_email
        string category
        boolean verified
        string notes
        datetime created_at
    }

    Invoice {
        int id PK
        string invoice_number UK
        string recipient_name
        string recipient_email
        float amount
        string currency
        string status
        string description
        datetime due_date
        datetime created_at
        datetime updated_at
    }

    PayoutRequest {
        int id PK
        string payout_reference UK
        string recipient_name
        string recipient_email
        float amount
        string currency
        string purpose
        string status
        boolean requires_approval
        string approved_by
        boolean is_duplicate_flag
        string paypal_batch_id
        string payout_mode
        datetime created_at
    }

    Transaction {
        int id PK
        string reference_id UK
        string type
        string status
        float amount
        string currency
        string source
        string paypal_resource_id
        int invoice_id FK
        int payout_id FK
        string description
        float fee
        float net_amount
        datetime created_at
    }

    WorkflowRule {
        int id PK
        string name
        string description
        string trigger_type
        string condition_expression
        string action_type
        boolean is_active
        boolean requires_approval
        datetime created_at
    }

    WorkflowExecution {
        int id PK
        int workflow_id FK
        string workflow_name
        string trigger_event
        string execution_result
        string status
        datetime executed_at
    }

    AIActionPlan {
        int id PK
        string original_prompt
        string intent
        string entities
        string proposed_action
        string reasoning
        string safety_level
        boolean requires_approval
        string status
        string execution_result
        datetime created_at
    }

    AuditEvent {
        int id PK
        string event_type
        string initiated_by
        string approval_status
        string execution_result
        string reference_id
        string details
        datetime timestamp
    }
```

---

## 9. Technology Stack

- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, SQLite, Uvicorn, HTTPX, Pytest.
- **Frontend:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS, Recharts, Lucide Icons, React Router v7.
- **Payment Gateway:** PayPal Sandbox REST APIs (OAuth 2.0, Orders v2, Payouts v1, Webhook receiver).
- **AI Runtime:** Google Gemini 2.5 Flash / Gemini Pro via `google-genai` SDK + deterministic heuristic fallback.

---

## 10. Installation and Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher with npm

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/paypal_ai.git
cd paypal_ai
```

### 2. Configure Environment Variables
```bash
cp .env.example backend/.env
```
*(Optional: set your `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `GEMINI_API_KEY` in `backend/.env`. If omitted, the application runs with simulated sandbox responses and the heuristic fallback parser).*

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start on **`http://127.0.0.1:8000`**.  
Interactive Swagger documentation is available at **`http://127.0.0.1:8000/docs`**.

### 4. Frontend Setup
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 11. Automated Verification Suite

The backend includes 13 automated unit and integration tests covering data validation, idempotency, audit logging, and route operations:

```bash
cd backend
python -m pytest -o pythonpath=. tests/test_paypilot.py -v
```

### Test Suite Coverage
1. `test_health_check`: Verifies API gateway status endpoint.
2. `test_negative_invoice_amount_blocked`: Asserts zero and negative invoice amounts trigger 422 validation errors.
3. `test_invalid_currency_code_blocked`: Asserts non-ISO currency codes are rejected.
4. `test_invoice_creation_and_audit`: Verifies invoice persistence and corresponding audit trail entry.
5. `test_invoice_receipt_and_deletion`: Tests receipt generation and deletion cascade.
6. `test_duplicate_payout_detection`: Validates 24-hour idempotency duplicate flagging.
7. `test_payout_approval_threshold_gate`: Verifies payouts exceeding $100 enter approval-required states.
8. `test_ai_agent_deterministic_fallback`: Verifies entity extraction without external API keys.
9. `test_ai_copilot_grounded_overdue_query`: Validates database grounding for overdue account queries.
10. `test_workflow_execution_and_logging`: Validates conditional rule triggering and execution history.
11. `test_user_profile_crud`: Tests user profile retrieval and update endpoints.
12. `test_transactions_export_csv`: Validates CSV export generation and header formatting.
13. `test_paypal_webhook_handler`: Tests incoming webhook event processing and status reconciliation.

---

## 12. Verification and Demo Guide

Follow this 3-minute sequence to evaluate core platform workflows:

1. **Seed Evaluation Data:** Click **"Seed Demo Data"** in the top navigation bar. This populates overdue invoices, verified contractors, and ledger history.
2. **Test Natural Language Invoicing:** Navigate to **AI Agent** (`/agent`) and submit:  
   `Create a $250 invoice for Alex for website development`  
   Review the structured action plan card and click **"Authorize & Execute Action"**.
3. **Execute PayPal Checkout:** Navigate to **Invoices** (`/invoices`), select the created invoice, and click **"Pay via PayPal"**. Complete the sandbox payment capture to observe automatic ledger reconciliation.
4. **Test Payout Safety Gate:** In the **AI Agent**, submit:  
   `Prepare a $120 contractor payout for approved tasks`  
   Because the amount exceeds $100, the action is marked for approval. Navigate to **Contractor Payouts** (`/payouts`), review the staged item, click **"Approve"**, and then click **"Disburse Funds"**.
5. **Inspect Ledger and Export:** Open **Transactions** (`/transactions`) to review the reconciled double-entry journal. Click **"Export CSV"** to verify spreadsheet output.

---

## 13. Project Status: Implemented vs Future Scope

### Implemented Functionality
- Full natural-language parsing with Google Gemini 2.5 Flash and heuristic fallback parser.
- Structured AI action planning with risk classification and operator approval gating.
- Human-in-the-loop controls enforcing approval on payouts exceeding $100.
- 24-hour idempotency and duplicate payout detection.
- Complete invoice lifecycle management with printable receipt viewing.
- Official PayPal Sandbox integration: OAuth 2.0 authentication, Orders API (v2), Payouts API (v1), and Webhook receiver.
- Conditional workflow automation engine with pause/resume toggling and manual test execution.
- Double-entry transaction ledger with multi-column sorting, debounced filtering, and CSV export.
- System-wide append-only audit trail logging all actions, actors, and references.
- Complete test suite with 13 automated unit and integration tests.

### Future Scope (Planned)
- Multi-currency conversion service using live FX rates during settlement.
- Recurring subscription and billing schedules via the PayPal Subscriptions API.
- Native mobile companion application (React Native) for push notifications and on-the-go approvals.
- Bi-directional accounting integration for external ledger synchronization (QuickBooks, Xero).

---

## 14. License

This project is licensed under the [MIT License](./LICENSE).
