export interface FinancialStats {
  total_incoming: number;
  total_outgoing: number;
  net_balance: number;
  pending_invoices_count: number;
  pending_invoices_amount: number;
  overdue_invoices_count: number;
  overdue_invoices_amount: number;
  pending_payouts_count: number;
  pending_payouts_amount: number;
  recent_transactions: TransactionItem[];
  cash_flow_trends: { date: string; incoming: number; outgoing: number; net: number }[];
  ai_summary: string;
}

export interface TransactionItem {
  id: number;
  reference_id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  source: string;
  paypal_resource_id?: string;
  invoice_id?: number;
  payout_id?: number;
  description: string;
  fee: number;
  net_amount: number;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_number: string;
  recipient_name: string;
  recipient_email: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  due_date: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  is_paypal_synced: boolean;
  paid_at?: string;
  created_at: string;
}

export interface PayoutItem {
  id: number;
  payout_reference: string;
  recipient_name: string;
  recipient_email: string;
  amount: number;
  currency: string;
  purpose: string;
  status: string;
  requires_approval: boolean;
  is_duplicate_flag: boolean;
  paypal_batch_id?: string;
  paypal_payout_item_id?: string;
  payout_mode: string;
  failure_reason?: string;
  approved_at?: string;
  approved_by?: string;
  executed_at?: string;
  created_at: string;
}

export interface WorkflowRuleItem {
  id: number;
  name: string;
  description: string;
  trigger_type: string;
  condition_expression?: string;
  action_type: string;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowExecutionItem {
  id: number;
  workflow_id?: number;
  workflow_name: string;
  trigger_event: string;
  status: string;
  input_payload?: any;
  execution_result?: any;
  error_message?: string;
  executed_at: string;
}

export interface AuditEventItem {
  id: number;
  event_type: string;
  initiated_by: string;
  validated_parameters?: any;
  approval_status: string;
  execution_result: string;
  reference_id?: string;
  details?: string;
  timestamp: string;
}

export interface AIActionPlan {
  plan_id?: number;
  intent: string;
  entities: {
    amount?: number;
    currency?: string;
    recipient_name?: string;
    recipient_email?: string;
    purpose?: string;
    due_date?: string;
    action_type?: string;
  };
  proposed_action: string;
  reasoning: string;
  risk_level: string;
  requires_approval: boolean;
  is_allowed: boolean;
  blocking_reason?: string;
  follow_up_question?: string;
  consequences: string;
}

export interface AIChatResponse {
  message: string;
  action_plan?: AIActionPlan;
  grounded_data?: any;
  audit_event_id?: number;
}

export interface PayPalConfig {
  client_id_configured: boolean;
  client_id_preview?: string;
  mode: string;
  api_base: string;
  is_connected: boolean;
  status_message: string;
  gemini_configured: boolean;
}

const API_BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let errDetail = "API Request failed";
    try {
      const err = await res.json();
      errDetail = err.detail || JSON.stringify(err);
    } catch {
      errDetail = await res.text();
    }
    throw new Error(errDetail);
  }
  return res.json();
}

export const api = {
  // Config
  getPayPalConfig: () => fetchJSON<PayPalConfig>("/paypal/config"),
  testPayPalConnection: () => fetchJSON<{ connected: boolean; message: string }>("/paypal/test-connection", { method: "POST" }),
  updatePayPalConfig: (data: { client_id: string; client_secret: string; gemini_api_key?: string }) =>
    fetchJSON<any>("/paypal/update-config", { method: "POST", body: JSON.stringify(data) }),

  // Stats
  getFinancialStats: () => fetchJSON<FinancialStats>("/transactions/stats"),

  // AI Agent
  sendChatMessage: (message: string, sessionId: string = "default") =>
    fetchJSON<AIChatResponse>("/ai/chat", { method: "POST", body: JSON.stringify({ message, session_id: sessionId }) }),
  executePlan: (plan_id: number, decision: "CONFIRM" | "REJECT" = "CONFIRM") =>
    fetchJSON<{ status: string; result?: any; message: string }>("/ai/execute-plan", {
      method: "POST",
      body: JSON.stringify({ plan_id, decision }),
    }),

  // Invoices
  getInvoices: (status?: string) => fetchJSON<InvoiceItem[]>(`/invoices${status ? `?status=${status}` : ""}`),
  createInvoice: (data: { recipient_name: string; recipient_email: string; amount: number; currency: string; description: string }) =>
    fetchJSON<InvoiceItem>("/invoices", { method: "POST", body: JSON.stringify(data) }),
  createCheckoutOrder: (invoiceId: number) =>
    fetchJSON<any>(`/invoices/${invoiceId}/checkout`, { method: "POST" }),
  captureInvoiceOrder: (invoiceId: number, orderId: string) =>
    fetchJSON<{ status: string; invoice: InvoiceItem }>(`/invoices/${invoiceId}/capture?order_id=${encodeURIComponent(orderId)}`, {
      method: "POST",
    }),

  // Payouts
  getPayouts: (status?: string) => fetchJSON<PayoutItem[]>(`/payouts${status ? `?status=${status}` : ""}`),
  createPayout: (data: { recipient_name: string; recipient_email: string; amount: number; currency: string; purpose: string }) =>
    fetchJSON<PayoutItem>("/payouts", { method: "POST", body: JSON.stringify(data) }),
  approvePayout: (payoutId: number, approved_by: string = "Operator") =>
    fetchJSON<PayoutItem>(`/payouts/${payoutId}/approve`, { method: "POST", body: JSON.stringify({ approved_by }) }),
  executePayout: (payoutId: number) =>
    fetchJSON<PayoutItem>(`/payouts/${payoutId}/execute`, { method: "POST" }),

  // Workflows
  getWorkflows: () => fetchJSON<WorkflowRuleItem[]>("/workflows"),
  toggleWorkflow: (id: number) => fetchJSON<WorkflowRuleItem>(`/workflows/${id}/toggle`, { method: "PATCH" }),
  testRunWorkflow: (id: number) => fetchJSON<WorkflowExecutionItem>(`/workflows/${id}/run`, { method: "POST" }),
  getWorkflowExecutions: () => fetchJSON<WorkflowExecutionItem[]>("/workflows/executions"),

  // Transactions
  getTransactions: (type?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    return fetchJSON<TransactionItem[]>(`/transactions?${params.toString()}`);
  },

  // Audit
  getAuditLogs: (eventType?: string) => fetchJSON<AuditEventItem[]>(`/audit${eventType ? `?event_type=${eventType}` : ""}`),

  // Recipients
  getRecipients: () => fetchJSON<any[]>("/recipients"),

  // Seed & Reset
  seedDemo: () => fetchJSON<any>("/seed", { method: "POST" }),
  resetDemo: () => fetchJSON<any>("/seed/reset", { method: "POST" }),
};
