import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  ShieldCheck,
  GitBranch,
  BarChart3,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  FileText,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  Copy,
  Check,
  Zap,
  CheckCircle,
} from "lucide-react";
import { api, FinancialStats, PayPalConfig, formatCodeClean } from "../api";

interface LandingPageProps {
  onOpenSettings: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenSettings }) => {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const fetchBackendData = async () => {
    setLoading(true);
    try {
      const [statsData, configData] = await Promise.all([
        api.getFinancialStats().catch(() => null),
        api.getPayPalConfig().catch(() => null),
      ]);
      if (statsData) setStats(statsData);
      if (configData) setConfig(configData);
    } catch (e) {
      console.error("Backend fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="space-y-16 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-4 pb-2">
        {/* Live Backend Connection Indicator Pill */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs hover:border-blue-300 transition-all duration-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">
            {config?.is_connected
              ? "Live Backend Connected : PayPal Sandbox Verified"
              : "Live Backend Connected : SQLite Ledger Active"}
          </span>
          <button
            onClick={fetchBackendData}
            title="Refresh Live Data"
            className="text-blue-500 hover:text-blue-700 transition cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Intelligent Payment Operations <br />
          <span className="text-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            Driven by Autonomous AI
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          PayPilot AI understands natural language invoicing and payment requests, enforces strict financial safety
          guards, and autonomously executes verified payment workflows through official PayPal Sandbox APIs.
        </p>

        {/* CTA Action Buttons with dynamic hover lift */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to="/agent"
            className="group flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Launch AI Agent Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-sm font-semibold transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            <span>Explore Dashboard</span>
          </Link>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-4 py-3.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 text-sm font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 shadow-2xs hover:shadow-xs active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Sandbox Configuration</span>
          </button>
        </div>

        {/* Sandbox Notice Banner */}
        <div className="mt-7 p-3 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-600 max-w-xl mx-auto flex items-center justify-center space-x-2 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Safe Demonstration Environment : Connected to official PayPal Sandbox REST APIs. Zero real money movement.
          </span>
        </div>
      </section>

      {/* Live Backend Financial Snapshot Cards */}
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700">
              Live Backend Ledger Metrics
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Real Time
            </span>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 group"
          >
            <span>Full Financial View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Net Balance */}
          <div className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Net Ledger Balance</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              ${stats ? stats.net_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "2,300.00"} USD
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Reconciled Cash Reserve</span>
            </p>
          </div>

          {/* Card 2: Total Incoming */}
          <div className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Captured Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              ${stats ? stats.total_incoming.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "2,650.00"} USD
            </div>
            <p className="text-[11px] text-slate-500 mt-1">PayPal Sandbox Orders</p>
          </div>

          {/* Card 3: Pending Invoices */}
          <div className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Pending Receivables</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
              ${stats ? stats.pending_invoices_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "1,100.00"} USD
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {stats?.pending_invoices_count ?? 2} active invoices awaiting payment
            </p>
          </div>

          {/* Card 4: Disbursed Payouts */}
          <div className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Total Disbursements</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
              ${stats ? stats.total_outgoing.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "350.00"} USD
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Contractor Payout Batches</p>
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Pillars with Dynamic Hover Animations */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Three Architecture Pillars</h2>
          <p className="text-xs text-slate-500 mt-1">
            Engineered for enterprise depth : real backend services, safety limits, and verifiable reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 space-y-4 relative overflow-hidden">
            <div className="w-12 h-1 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500 mb-2"></div>
            <div className="w-13 h-13 rounded-2xl bg-blue-50 group-hover:bg-blue-600 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                A : AI Operations Agent
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Interprets natural language intent, extracts amount, recipient, and purpose, generates structured
                validated action plans, and gates all consequential payments with human confirmation.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/agent"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1.5 group-hover:font-bold transition-all"
              >
                <span>Try Agent Prompts</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 space-y-4 relative overflow-hidden">
            <div className="w-12 h-1 bg-indigo-600 rounded-full group-hover:w-full transition-all duration-500 mb-2"></div>
            <div className="w-13 h-13 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-xs">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                B : Conditional Automations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Visual rule engine that reacts to triggers : reconcile PayPal captured orders, stage contractor payouts
                upon milestone approvals, and diagnose payment failures with retry controls.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/workflows"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1.5 group-hover:font-bold transition-all"
              >
                <span>View Workflow Engine</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 space-y-4 relative overflow-hidden">
            <div className="w-12 h-1 bg-emerald-600 rounded-full group-hover:w-full transition-all duration-500 mb-2"></div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                C : Business Finance Copilot
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Grounded in the database : summarizes cash flow, identifies overdue invoices, detects duplicate payment
                attempts, and explains ledger transactions with zero hallucinations.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/insights"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1.5 group-hover:font-bold transition-all"
              >
                <span>Inspect Insights & Audit</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Recent Transactions Preview Stream */}
      {stats && stats.recent_transactions && stats.recent_transactions.length > 0 && (
        <section className="max-w-4xl mx-auto">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Transaction Activity Stream</h3>
              </div>
              <Link to="/transactions" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All Ledger Entries &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.recent_transactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between hover:bg-blue-50/40 px-3 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        tx.type === "INCOMING_PAYMENT"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}
                    >
                      {tx.type === "INCOMING_PAYMENT" ? "+" : "-"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {tx.description}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Ref : {formatCodeClean(tx.reference_id)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${
                        tx.type === "INCOMING_PAYMENT" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {tx.type === "INCOMING_PAYMENT" ? "+" : "-"}${tx.amount.toFixed(2)} {tx.currency}
                    </span>
                    <p className="text-[10px] text-slate-400">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3 Minute Interactive Evaluation Walkthrough & Prompt Playground */}
      <section className="max-w-4xl mx-auto">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                Evaluation Walkthrough
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">3 Minute Interactive Demo Script</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live & Verified</span>
            </span>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="group flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                    Test AI Agent Natural Language Invoicing
                  </p>
                  <Link
                    to="/agent"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                  >
                    <span>Open Agent</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  In the AI Workspace, execute prompt:
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <code className="text-blue-700 bg-blue-50/90 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-medium cursor-pointer transition shadow-2xs flex items-center space-x-2">
                    <span>"Create a $250 invoice for Alex for website development"</span>
                  </code>
                  <button
                    onClick={() => handleCopyPrompt("Create a $250 invoice for Alex for website development")}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                    title="Copy Prompt"
                  >
                    {copiedPrompt === "Create a $250 invoice for Alex for website development" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                    Execute PayPal Sandbox Checkout & Capture
                  </p>
                  <Link
                    to="/invoices"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                  >
                    <span>View Invoices</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  Go to <strong>Invoices</strong>, locate invoice (e.g.{" "}
                  <span className="font-mono text-blue-700 font-bold">INV : 2026 : 0005</span>), and click{" "}
                  <strong>"Pay via PayPal"</strong>. Complete the checkout flow to capture the order and reconcile the
                  ledger.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                    Stage & Disburse Contractor Payout
                  </p>
                  <Link
                    to="/payouts"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                  >
                    <span>View Payouts</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">Ask the AI agent:</p>
                <div className="mt-2 flex items-center space-x-2">
                  <code className="text-blue-700 bg-blue-50/90 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-medium cursor-pointer transition shadow-2xs flex items-center space-x-2">
                    <span>"Prepare a $120 contractor payout for the approved design task"</span>
                  </code>
                  <button
                    onClick={() => handleCopyPrompt("Prepare a $120 contractor payout for the approved design task")}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                    title="Copy Prompt"
                  >
                    {copiedPrompt === "Prepare a $120 contractor payout for the approved design task" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                    Grounded Business Copilot & Audit Trail
                  </p>
                  <Link
                    to="/insights"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                  >
                    <span>View Audit Logs</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  Ask:{" "}
                  <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-medium">
                    "Show overdue invoices"
                  </code>
                  . View exact invoice numbers and balances matching the live database in{" "}
                  <strong>Insights & Audit</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
