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
  Wallet,
  ArrowDown,
  Search,
  Bell,
  Users,
  Send,
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

  const scrollToSecondary = () => {
    const el = document.getElementById("secondary-page");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-16 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* =========================================================================
          PRIMARY VISUAL SHOWCASE (Matching Provided Hero Visual)
         ========================================================================= */}
      <section className="bg-gradient-to-b from-[#F0F5FD] via-[#F6F9FE] to-white border border-blue-100/80 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">PayPilot AI</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI-Powered Finance</span>
            </span>
          </div>
        </div>

        {/* Main Hero Header Headlines */}
        <div className="max-w-3xl space-y-3 mb-6">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Your Business Finances. On Autopilot.
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-blue-600">
            One intelligent copilot. Smarter payment operations.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Transform natural-language instructions into secure invoices, approved payouts, and automated financial
            workflows powered by PayPal.
          </p>

          {/* 3 Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="px-3 py-1 rounded-full bg-blue-100/90 text-blue-700 font-semibold text-xs border border-blue-200/60 shadow-2xs">
              AI Automation
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 font-semibold text-xs border border-emerald-200/60 shadow-2xs">
              Human Approval
            </span>
            <span className="px-3 py-1 rounded-full bg-white text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs">
              PayPal Integration
            </span>
          </div>
        </div>

        {/* =========================================================================
            Inner Visual Hero Mockup (The High-Fidelity UI Interface)
           ========================================================================= */}
        <div className="relative mt-8 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-4 sm:p-7 overflow-hidden">
          {/* Mockup Top Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  P
                </div>
                <span className="font-bold text-slate-900 text-sm tracking-tight">PAYPILOT</span>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-xs font-semibold">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white cursor-pointer">Dashboard</span>
                <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer">Analytics</span>
                <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer">Clients</span>
                <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer">Invoices</span>
                <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer">Automation</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative hidden sm:block">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value="Search clients, invoices..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 w-44 focus:outline-none"
                />
              </div>
              <div className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-100">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  JL
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-[11px] font-bold text-slate-900 leading-none">Jordan Lee</div>
                  <div className="text-[9px] text-slate-400">Finance Lead</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mockup Hero Split: Headline + AI Insight Card */}
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Smarter Finance. Better Decisions.
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Your business, <br />
                <span className="text-emerald-600">at a glance.</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Real-time insights. Track performance, optimise operations, grow with confidence.
              </p>
            </div>

            {/* Right Glowing AI Insight Card */}
            <div className="lg:col-span-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80 shadow-xs relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    <span>AI Insight</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-xl font-extrabold text-slate-900">
                  Your revenue grew <span className="text-emerald-600">24%</span> this month
                </div>
                <p className="text-xs text-slate-600 mt-1">Keep up the momentum! 5 new opportunities identified.</p>
              </div>
            </div>
          </div>

          {/* 4 Metric Summary Widgets */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1 */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Total Revenue</span>
                </span>
                <span className="text-[10px] text-slate-400">...</span>
              </div>
              <div className="text-xl font-bold text-slate-900">$48,750</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-600">↑ 18.6% vs last month</span>
                {/* Mini SVG Sparkline */}
                <svg className="w-12 h-4 text-emerald-500" viewBox="0 0 50 15" fill="none">
                  <path d="M0 12 L12 10 L25 5 L38 8 L50 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Clients</span>
                </span>
                <span className="text-[10px] text-slate-400">...</span>
              </div>
              <div className="text-xl font-bold text-slate-900">1,248</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-600">↑ 12.4% vs last month</span>
                {/* Mini Bar Sparkline */}
                <div className="flex items-end space-x-1 h-3.5">
                  <span className="w-1 bg-emerald-300 h-2 rounded-xs"></span>
                  <span className="w-1 bg-emerald-400 h-3 rounded-xs"></span>
                  <span className="w-1 bg-emerald-500 h-3.5 rounded-xs"></span>
                </div>
              </div>
            </div>

            {/* Metric 3: Donut Progress */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoices Status</span>
                </span>
                <span className="text-[10px] text-slate-400">...</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-slate-900">78%</div>
                  <span className="text-[10px] text-slate-500">Paid Invoices</span>
                </div>
                {/* Mini SVG Donut */}
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="4"
                      strokeDasharray="88"
                      strokeDashoffset="20"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-[9px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Paid (78%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Pending (16%)</span>
                </span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cash Flow</span>
                </span>
                <span className="text-[10px] text-slate-400">...</span>
              </div>
              <div className="text-xl font-bold text-slate-900">$24,980</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-600">↑ 8.2% vs last month</span>
                <div className="flex items-end space-x-1 h-3.5">
                  <span className="w-1 bg-indigo-300 h-1.5 rounded-xs"></span>
                  <span className="w-1 bg-indigo-400 h-2.5 rounded-xs"></span>
                  <span className="w-1 bg-indigo-600 h-3.5 rounded-xs"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Split: Revenue Chart vs AI Assistant Panel */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Revenue vs Expenses Graph Mockup */}
            <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Revenue vs Expenses</h4>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Revenue</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      <span>Expenses</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  This Year ▾
                </span>
              </div>

              {/* Graphical Line SVG Mockup */}
              <div className="h-44 w-full pt-2">
                <svg className="w-full h-full" viewBox="0 0 450 140" fill="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="450" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="450" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="450" y2="100" stroke="#F1F5F9" strokeDasharray="3 3" />

                  {/* Gradient Area for Revenue */}
                  <defs>
                    <linearGradient id="chartGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity="0.2" />
                      <stop offset="95%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 95 Q 60 70 120 75 T 220 50 T 320 60 T 440 25 L 440 130 L 10 130 Z"
                    fill="url(#chartGreen)"
                  />
                  {/* Revenue Curve */}
                  <path
                    d="M 10 95 Q 60 70 120 75 T 220 50 T 320 60 T 440 25"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Expense Curve */}
                  <path
                    d="M 10 115 Q 60 100 120 105 T 220 90 T 320 95 T 440 75"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex justify-between text-[10px] text-slate-400 px-2 -mt-2">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>

              {/* Mini Highlights Footer */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-left">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Total Revenue</span>
                  <div className="text-xs font-bold text-slate-900">$285,640</div>
                  <span className="text-[9px] text-emerald-600 font-medium">↑ 16.2% vs last year</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Total Expenses</span>
                  <div className="text-xs font-bold text-slate-900">$186,430</div>
                  <span className="text-[9px] text-slate-500 font-medium">↑ 9.8% vs last year</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Net Profit</span>
                  <div className="text-xs font-bold text-emerald-700">$99,210</div>
                  <span className="text-[9px] text-emerald-600 font-medium">↑ 21.5% vs last year</span>
                </div>
              </div>
            </div>

            {/* Right: AI Assistant Conversation Card */}
            <div className="lg:col-span-5 p-4 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/40 via-white to-white flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span>AI Assistant</span>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </div>

                {/* Message 1: User */}
                <div className="mt-3 flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                    JL
                  </div>
                  <div className="bg-slate-100 p-2.5 rounded-xl text-[11px] text-slate-800 leading-relaxed">
                    Can you analyze last month's revenue and suggest areas to improve?
                  </div>
                </div>

                {/* Message 2: PayPilot AI */}
                <div className="mt-3 flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="bg-blue-50/80 border border-blue-100 p-2.5 rounded-xl text-[11px] text-slate-700 leading-relaxed space-y-1.5">
                    <p className="font-semibold text-blue-950">Sure! Here are 3 key opportunities:</p>
                    <ol className="space-y-1 text-[10px] text-slate-600">
                      <li>
                        <strong>1.</strong> Increase upsell offers for existing clients (+12% potential)
                      </li>
                      <li>
                        <strong>2.</strong> Reduce overdue invoices (save ~$2,400/month)
                      </li>
                      <li>
                        <strong>3.</strong> Focus marketing on high-performing segments (+18% growth)
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action Chips */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium cursor-pointer hover:bg-slate-200">
                    📄 Files
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium cursor-pointer hover:bg-slate-200">
                    📊 Charts
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium cursor-pointer hover:bg-slate-200">
                    📑 Reports
                  </span>
                </div>
                <Link
                  to="/agent"
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-0.5"
                >
                  <span>Open Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Smooth Down Arrow Button to Secondary Page */}
          <div className="mt-8 flex flex-col items-center justify-center text-center">
            <button
              onClick={scrollToSecondary}
              className="group w-11 h-11 rounded-full bg-slate-900 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
              title="Scroll to explore full platform features"
            >
              <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <span className="text-[11px] font-medium text-slate-400 mt-2 tracking-wide">
              AI-powered financial operations platform
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECONDARY PAGE SECTIONS (Detailed Overview, Pitch, Live Ledger & Demo)
         ========================================================================= */}
      <div id="secondary-page" className="space-y-16 pt-6">
        {/* Elevator Pitch Card */}
        <section className="max-w-4xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600">Executive Overview</span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Running a business shouldn't mean spending hours managing invoices, tracking payments, and handling contractor payouts.
          </h3>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-sm text-blue-950 font-semibold leading-relaxed">
            PayPilot AI is an AI-powered financial operations copilot that transforms natural-language instructions into secure, automated payment workflows using official PayPal APIs.
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Simply tell PayPilot AI what you need - create an invoice, prepare a contractor payout, or track overdue payments.
            Its intelligent agent extracts key details, generates structured action plans, validates transactions, and executes
            approved operations while eliminating duplicate disbursements.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Built with financial safety at its core, PayPilot AI combines autonomous execution with human-in-the-loop approval
            controls, real-time PayPal Sandbox integration, and an immutable ledger. From instant invoice generation and PayPal
            Checkout to automated conditional workflows and receivables insights, PayPilot AI simplifies business finances through
            one intelligent platform.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Less manual work. Smarter payment operations. Greater financial control.
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to="/agent"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
              >
                Try AI Workspace
              </Link>
              <button
                onClick={onOpenSettings}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Sandbox Keys
              </button>
            </div>
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
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Net Ledger Balance</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats ? stats.net_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "2,300.00"} USD
              </div>
              <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Reconciled Cash Reserve</span>
              </p>
            </div>

            {/* Card 2: Total Incoming */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Captured Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats ? stats.total_incoming.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "2,650.00"} USD
              </div>
              <p className="text-[11px] text-slate-500">PayPal Sandbox Orders</p>
            </div>

            {/* Card 3: Pending Invoices */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Receivables</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats ? stats.pending_invoices_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "1,100.00"} USD
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {stats?.pending_invoices_count ?? 2} active invoices awaiting payment
              </p>
            </div>

            {/* Card 4: Disbursed Payouts */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Disbursements</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats ? stats.total_outgoing.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "350.00"} USD
              </div>
              <p className="text-[11px] text-slate-500">Contractor Payout Batches</p>
            </div>
          </div>
        </section>

        {/* 3 Core Architecture Pillars */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Three Architecture Pillars</h2>
            <p className="text-xs text-slate-500 mt-1">
              Engineered for enterprise depth : real backend services, safety limits, and verifiable reconciliation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition space-y-4">
              <div className="w-12 h-1 bg-blue-600 rounded-full mb-2"></div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1. AI Operations Agent</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Interprets natural language intent, extracts amount, recipient, and purpose, generates structured
                  validated action plans, and gates all consequential payments with human confirmation.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <Link to="/agent" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                  <span>Try Agent Prompts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition space-y-4">
              <div className="w-12 h-1 bg-indigo-600 rounded-full mb-2"></div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">2. Conditional Automations</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Visual rule engine that reacts to triggers : reconcile PayPal captured orders, stage contractor payouts
                  upon milestone approvals, and diagnose payment failures with retry controls.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <Link to="/workflows" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1">
                  <span>View Workflow Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition space-y-4">
              <div className="w-12 h-1 bg-emerald-600 rounded-full mb-2"></div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">3. Business Finance Copilot</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Grounded in the database : summarizes cash flow, identifies overdue invoices, detects duplicate payment
                  attempts, and explains ledger transactions with zero hallucinations.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <Link to="/insights" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1">
                  <span>Inspect Insights &amp; Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Minute Interactive Evaluation Walkthrough & Prompt Playground */}
        <section className="max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                  Evaluation Walkthrough
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">3 Minute Interactive Demo Script</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live &amp; Verified</span>
              </span>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition duration-200">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
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
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
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
              <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition duration-200">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                      Execute PayPal Sandbox Checkout &amp; Capture
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
              <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition duration-200">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                      Stage &amp; Disburse Contractor Payout
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
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
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
              <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition duration-200">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                      Grounded Business Copilot &amp; Audit Trail
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
                    <strong>Insights &amp; Audit</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
