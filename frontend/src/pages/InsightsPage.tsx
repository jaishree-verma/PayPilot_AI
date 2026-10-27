import React, { useState, useEffect } from "react";
import {
  BarChart3,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api, AuditEventItem, FinancialStats } from "../api";

export const InsightsPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditEventItem[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logs, statsData] = await Promise.all([
        api.getAuditLogs(filterType || undefined),
        api.getFinancialStats(),
      ]);
      setAuditLogs(logs);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Insights & Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Grounded intelligence, receivables analysis, and an append-only audit trail of every AI-initiated action
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Receivables Health */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2.5 text-blue-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Receivables Intelligence</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {stats && stats.overdue_invoices_count > 0 ? (
              <span className="text-amber-700">
                ⚠️ {stats.overdue_invoices_count} overdue invoice(s) totaling ${stats.overdue_invoices_amount.toFixed(2)} require collection follow-up. Automated reminders can be triggered via Workflow Rule.
              </span>
            ) : (
              <span className="text-emerald-700">
                ✓ All recorded customer invoices are currently within their payment terms. No overdue receivables detected.
              </span>
            )}
          </p>
        </div>

        {/* Card 2: Duplicate Prevention Status */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2.5 text-blue-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Duplicate Protection Layer</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Active idempotency verification locks prevent accidental re-execution of identical payout or invoice
            amounts within 24-hour windows. Double disbursement risk is mitigated.
          </p>
        </div>

        {/* Card 3: Reconciliation Engine */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2.5 text-blue-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Ledger Grounding Policy</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All AI financial responses and copilot summaries are strictly grounded in active SQLite records.
            The model is prohibited from generating fictitious ledger entries.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">System Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only log recording actor, validated parameters, approvals, and PayPal references
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="">All Event Types</option>
              <option value="AI_PLAN_PROPOSED">AI Plan Proposed</option>
              <option value="AI_PLAN_EXECUTED">AI Plan Executed</option>
              <option value="INVOICE_CREATED">Invoice Created</option>
              <option value="PAYPAL_ORDER_CREATED">PayPal Order Created</option>
              <option value="PAYMENT_CAPTURED_RECONCILED">Payment Captured & Reconciled</option>
              <option value="PAYOUT_STAGED">Payout Staged</option>
              <option value="PAYOUT_APPROVED">Payout Approved</option>
              <option value="PAYOUT_EXECUTED_COMPLETED">Payout Executed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-3 px-3 font-semibold">Event Type</th>
                <th className="py-3 px-3 font-semibold">Initiated By</th>
                <th className="py-3 px-3 font-semibold">Approval</th>
                <th className="py-3 px-3 font-semibold">Result</th>
                <th className="py-3 px-3 font-semibold">Reference ID</th>
                <th className="py-3 px-3 font-semibold">Details</th>
                <th className="py-3 px-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3 font-mono font-semibold text-blue-600">{log.event_type}</td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                        {log.initiated_by}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.approval_status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.approval_status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {log.approval_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.execution_result === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : log.execution_result === "BLOCKED"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {log.execution_result}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700 text-[11px]">{log.reference_id || "-"}</td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-sm truncate">{log.details || "-"}</td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit events found. Actions taken across the application will be recorded here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
