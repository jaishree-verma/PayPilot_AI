# PayPilot AI — 3-Minute Hackathon Evaluation & Demo Guide

This guide provides a reproducible, step-by-step presentation script designed for hackathon judges, evaluators, and video recordings.

---

## 🕒 Three-Minute Live Demo Timeline

```
0:00 ─── 0:30 │ Introduction & Business Context
0:30 ─── 1:15 │ Natural-Language Invoicing with AI Agent
1:15 ─── 2:00 │ Official PayPal Sandbox Checkout & Reconciliation
2:00 ─── 2:40 │ Gated Contractor Payout & Duplicate Prevention
2:40 ─── 3:00 │ Grounded Business Copilot & Audit Trail
```

---

## 🎬 Step-by-Step Speaker Script & Screen Actions

### Part 1: The Context & Problem (0:00 – 0:30)
- **Screen:** Open [`http://localhost:5173/`](http://localhost:5173/) on the **Dashboard** or **Landing Page**.
- **Action:** Click **"Seed Demo Data"** in the top navigation bar to ensure fresh sample data is loaded.
- **Spoken Narrative:**
  > *"Managing freelance and agency finances is painful. Invoicing clients, chasing overdue receivables, and paying contractors across fragmented apps wastes valuable hours and frequently leads to accidental double payments.
  >
  > Traditional dashboards show you what happened in the past, but can't take action. On the other hand, generic AI chatbots hallucinate and can't be trusted with your money.
  >
  > Meet PayPilot AI — an intelligent payment operations agent combining the official PayPal Developer Platform with a controlled, auditable AI agent."*

---

### Part 2: Natural-Language Invoicing with AI Agent (0:30 – 1:15)
- **Screen:** Click **"AI Agent"** in the left sidebar.
- **Action:** Click the suggested prompt chip:  
  `"Create an invoice for $250."`  
  *(Or type: `"Create a $250 invoice for Alex for website development"`)*
- **Observation:** Notice the response:
  - The AI parses the recipient (`Alex`), amount (`$250.00 USD`), and deliverable (`Website development`).
  - It generates a **Structured Payment Action Plan Card** with a blue accent bar and a `LOW` risk rating.
- **Spoken Narrative:**
  > *"Instead of filling out multiple form fields, I ask our agent naturally. Notice how the agent doesn't just reply with conversational text — it structures a validated action plan. 
  > 
  > Crucially, as a core safety safeguard, the AI cannot directly mutate our bank or database. It demands human operator authorization."*
- **Action:** Click the green **"Authorize & Execute Action"** button.
- **Observation:** The card updates to **"Action Successfully Authorized & Executed"** and confirms invoice `INV-2026-0004` has been generated.

---

### Part 3: PayPal Sandbox Checkout & Reconciliation (1:15 – 2:00)
- **Screen:** Click **"Invoices"** in the sidebar.
- **Action:** Locate invoice `INV-2026-0004` (Status: `SENT`). Click **"Pay via PayPal"**.
- **Action:** In the modal, click **"Create PayPal Sandbox Order"**.
- **Observation:** Shows `PayPal Order Created` with intent `CAPTURE`.
- **Action:** Click **"Simulate Client Approval & Capture Funds"**.
- **Observation:** Displays green confirmation: **"Payment Captured & Reconciled!"**.
- **Spoken Narrative:**
  > *"Here is the newly created invoice. When our client pays, we use the official PayPal Sandbox Orders API. When the order is captured, our backend verifies the capture ID, reconciles the invoice to PAID, updates our financial ledger, and triggers automated reconciliation workflows."*
- **Action:** Close the modal. Notice the invoice status is now marked **`PAID`**.

---

### Part 4: Gated Contractor Payout & Duplicate Prevention (2:00 – 2:40)
- **Screen:** Return to **"AI Agent"** in the sidebar.
- **Action:** Type or click:  
  `"Prepare a $120 contractor payout for the approved design task"`
- **Observation:**
  - Risk Level: `MEDIUM`
  - Approval Required: `true`
  - Reasoning: `Staged contractor payout. Evaluated business rule: amount exceeds auto-limit ($100.00), requiring explicit approval.`
- **Action:** Click **"Authorize & Execute Action"**.
- **Screen:** Navigate to **"Contractor Payouts"**.
- **Action:** Click **"Approve Request"** on the staged payout, then click **"Disburse Funds"**.
- **Observation:** The payout status changes to `COMPLETED` and records the PayPal Payout batch ID.
- **Spoken Narrative:**
  > *"For contractor payouts, we enforce financial safety thresholds. Any payout above $100 strictly mandates human authorization. Once approved, funds are dispatched through the official PayPal Payouts API and our balance is adjusted."*

---

### Part 5: Grounded Business Copilot & Audit Trail (2:40 – 3:00)
- **Screen:** In **"AI Agent"**, click the prompt chip:  
  `"Show my overdue invoices."`
- **Observation:** The AI responds with exact overdue invoice numbers (`INV-2026-0003`) and amount (`$1,200.00 USD`) pulled directly from SQLite.
- **Screen:** Click **"Financial Insights"** in the sidebar.
- **Observation:** Point to the **System Audit Trail** table.
- **Spoken Narrative:**
  > *"Finally, when we ask our business copilot for overdue invoices, notice that the amounts and references match our database with zero hallucination. 
  > 
  > In the Financial Insights tab, evaluators can inspect an immutable, append-only audit trail logging every action, operator decision, and PayPal reference. 
  > 
  > That's PayPilot AI: intelligent, safe, and truly autonomous payment operations."*

---

## 🛡️ Failure & Edge Case Recovery Demo

Judges can also verify negative test cases:

1. **Negative Payment Amount Block:**  
   In AI Agent, type: `"Create a -$50 invoice for Alex"`.  
   *Result:* Blocked immediately with a red alert: *"Execution Blocked by Safety Guard: Negative or zero payment amounts are prohibited by financial security policy."*
2. **Duplicate Payout Detection:**  
   Try submitting the identical contractor payout twice in succession.  
   *Result:* Flagged with a duplicate alert: *"Duplicate protection triggered: A payout of $120.00 already exists."*
