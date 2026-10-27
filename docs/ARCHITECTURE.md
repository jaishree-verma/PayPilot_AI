# PayPilot AI — Architectural Specification

## 1. High-Level Architecture Overview

PayPilot AI is built as a modular, decoupled full-stack architecture dividing responsibilities cleanly across:
1. **Frontend Presentation & Interaction Layer** (React 19, TypeScript, Tailwind CSS, Recharts)
2. **Backend API & Orchestration Layer** (FastAPI, Pydantic v2, HTTPX)
3. **AI Reasoning & Extraction Layer** (Google Gemini API with Deterministic Offline Fallback)
4. **PayPal Developer Sandbox Settlement Layer** (OAuth 2.0, Orders API, Payouts API)
5. **Relational Data & Audit Persistence Layer** (SQLAlchemy ORM, SQLite / PostgreSQL)

```mermaid
graph TB
    subgraph Presentation ["Presentation Layer (Client)"]
        Browser["React 19 + TypeScript SPA"]
        Sidebar["Sidebar & Navigation"]
        Workspace["AI Chat & Action Plan Workspace"]
        Checkout["PayPal Sandbox Checkout Flow"]
        Analytics["Recharts Cash Flow Visualization"]
    end

    subgraph Gateway ["API & Safety Gateway"]
        CORS["CORS Middleware"]
        Router["FastAPI APIRouter"]
        Validation["Pydantic v2 Request Sanitization"]
        Gate["Human Confirmation Approval Gate"]
    end

    subgraph Services ["Application Services Layer"]
        S_AI["ai_service.py (NLP & Fact Grounding)"]
        S_PP["paypal_service.py (OAuth & Sandbox REST)"]
        S_Inv["invoice_service.py (Invoices & Duplicate Locks)"]
        S_Pay["payout_service.py (Contractor Disbursements)"]
        S_Wf["workflow_service.py (Conditional Automation)"]
        S_Tx["transaction_service.py (Ledger & Analytics)"]
        S_Audit["audit_service.py (Append-Only Event Log)"]
    end

    subgraph Data ["Persistence Layer"]
        DB[(SQLAlchemy SQLite Database)]
        AuditLog[(Audit Events Table)]
    end

    subgraph External ["External Providers"]
        PayPalAPI["PayPal Sandbox REST API (api-m.sandbox.paypal.com)"]
        GeminiAPI["Google Gemini LLM (gemini-2.5-flash)"]
    end

    Browser -->|HTTP JSON Requests| CORS
    CORS --> Router
    Router --> Validation
    Validation --> Gate
    Gate --> Services

    S_AI <-->|Prompt & JSON Schema| GeminiAPI
    S_AI <-->|Query Grounding Facts| DB
    S_PP <-->|OAuth 2.0 & Orders/Payouts| PayPalAPI
    S_Inv --> DB
    S_Pay --> DB
    S_Wf --> DB
    S_Tx --> DB
    S_Audit --> AuditLog
```

---

## 2. Security Boundaries & The Financial Safety Model

The primary vulnerability of LLM-based financial applications is **uncontrolled execution authority**. If a model can directly invoke database queries or payment APIs, prompt injection attacks or hallucinations can cause disastrous financial loss.

PayPilot AI implements a strict, 4-tier security boundary:

```mermaid
graph LR
    Tier1["Tier 1: Intent Understanding (Probabilistic)"]
    Tier2["Tier 2: Business Rule Validation (Deterministic)"]
    Tier3["Tier 3: Human Authorization Gate (Manual Confirmation)"]
    Tier4["Tier 4: Payment Execution & Reconciliation (Cryptographic)"]

    Tier1 --> Tier2
    Tier2 --> Tier3
    Tier3 --> Tier4
```

1. **Tier 1 — Probabilistic Extraction:** The LLM parses the natural-language prompt. The output is strictly treated as untrusted draft input.
2. **Tier 2 — Deterministic Server-Side Validation:** The backend validates:
   - Amounts are positive (`amount > 0`).
   - Currency is valid ISO 4217 code.
   - Payout amounts above `$100.00` strictly mandate human approval (`requires_approval = True`).
   - Duplicate protection checks if identical recipient and amount occurred in the past 24 hours.
3. **Tier 3 — Human Confirmation Gate:** The plan is persisted with `status = "PROPOSED"`. Execution is physically impossible until an authenticated operator submits an explicit confirmation (`POST /api/ai/execute-plan` with `decision = "CONFIRM"`).
4. **Tier 4 — Cryptographic Settlement:** The backend generates an idempotent PayPal Request ID, executes the authorized REST API call, verifies the returned capture status, and only then writes to the permanent ledger.

---

## 3. Component Interaction Sequence

```mermaid
sequenceDiagram
    participant Operator
    participant ReactClient
    participant FastAPI
    participant SQLite
    participant PayPalSandbox

    Operator->>ReactClient: Types payment request
    ReactClient->>FastAPI: POST /api/ai/chat
    FastAPI->>SQLite: Query active unpaid balances & contractors
    SQLite-->>FastAPI: Grounding facts
    FastAPI->>FastAPI: Formulate JSON prompt & call AI / Fallback
    FastAPI->>FastAPI: Apply business rules & duplicate checks
    FastAPI->>SQLite: Insert AIActionPlan (status: PROPOSED)
    FastAPI-->>ReactClient: Return Action Plan Card

    Operator->>ReactClient: Clicks "Authorize & Execute"
    ReactClient->>FastAPI: POST /api/ai/execute-plan (decision: CONFIRM)
    FastAPI->>SQLite: Update AIActionPlan (status: EXECUTED)
    FastAPI->>SQLite: Create Invoice / Payout record
    FastAPI-->>ReactClient: Action completed

    Operator->>ReactClient: Initiates PayPal Checkout
    ReactClient->>FastAPI: POST /api/invoices/{id}/checkout
    FastAPI->>PayPalSandbox: POST /v2/checkout/orders
    PayPalSandbox-->>FastAPI: Order ID (status: CREATED)
    FastAPI-->>ReactClient: Order ID & Approval URL

    Operator->>ReactClient: Completes Sandbox Approval & Capture
    ReactClient->>FastAPI: POST /api/invoices/{id}/capture
    FastAPI->>PayPalSandbox: POST /v2/checkout/orders/{id}/capture
    PayPalSandbox-->>FastAPI: Capture Verified (status: COMPLETED)
    FastAPI->>SQLite: Update Invoice (status: PAID)
    FastAPI->>SQLite: Insert Transaction (source: PAYPAL_SANDBOX_ORDER)
    FastAPI->>SQLite: Insert AuditEvent (event: PAYMENT_CAPTURED_RECONCILED)
    FastAPI-->>ReactClient: Verified reconciliation response
```
