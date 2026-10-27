import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Sparkles,
  Bot,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api, FinancialStats } from "../api";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getFinancialStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Overview</h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>PayPal Sandbox</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger reconciliation and automated payment workflows for Mercer Tech Labs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/agent"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>Ask AI Agent</span>
          </Link>

          <Link
            to="/invoices"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Link>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* AI Business Copilot Summary Panel */}
      {stats?.ai_summary && (
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start space-x-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-blue-950">AI Financial Operations Copilot</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-blue-700 border border-blue-200 font-semibold shadow-2xs">
                Grounded Database Summary
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{stats.ai_summary}</p>
          </div>
        </div>
      )}

      {/* 4 Clean Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Incoming */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Inflow</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${stats ? stats.total_incoming.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Captured PayPal Sandbox Orders</p>
          </div>
        </div>

        {/* Card 2: Outgoing */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Outflow</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${stats ? stats.total_outgoing.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Contractor Disbursed Payouts</p>
          </div>
        </div>

        {/* Card 3: Pending Invoices */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${stats ? stats.pending_invoices_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {stats?.pending_invoices_count || 0} active invoice(s) awaiting payment
            </p>
          </div>
        </div>

        {/* Card 4: Overdue Alert */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue Invoices</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${stats ? stats.overdue_invoices_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
            <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
              {stats?.overdue_invoices_count || 0} overdue customer invoice(s)
            </p>
          </div>
        </div>
      </div>

      {/* Payment Activity Chart: White and Blue Recharts */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">7-Day Cash Flow Trends</h2>
            <p className="text-xs text-slate-500">Customer payments inflow vs contractor disbursements</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Inflow (USD)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Outflow (USD)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          {stats?.cash_flow_trends && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.cash_flow_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="slateOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    color: "#0F172A",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="incoming"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#blueInflow)"
                  name="Inflow"
                />
                <Area
                  type="monotone"
                  dataKey="outgoing"
                  stroke="#64748B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#slateOutflow)"
                  name="Outflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Ledger Transactions Table */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Ledger Transactions</h2>
            <p className="text-xs text-slate-500">Live records captured from PayPal Sandbox & local ledger</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View Full Ledger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-3 px-3 font-semibold">Reference ID</th>
                <th className="py-3 px-3 font-semibold">Type</th>
                <th className="py-3 px-3 font-semibold">Description</th>
                <th className="py-3 px-3 font-semibold">Amount</th>
                <th className="py-3 px-3 font-semibold">Source</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                stats.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">{tx.reference_id}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.type === "INCOMING_PAYMENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {tx.type === "INCOMING_PAYMENT" ? "Incoming" : "Payout"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{tx.description}</td>
                    <td
                      className={`py-3 px-3 font-bold ${
                        tx.type === "INCOMING_PAYMENT" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {tx.type === "INCOMING_PAYMENT" ? "+" : "-"}${tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {tx.source}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions recorded yet. Create an invoice or seed demo data.
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
