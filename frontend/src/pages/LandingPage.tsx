import React from "react";
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
} from "lucide-react";

interface LandingPageProps {
  onOpenSettings: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenSettings }) => {
  return (
    <div className="space-y-16 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-6 pb-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>PayPal Developer Sandbox Hackathon Edition</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Intelligent Payment Operations <br />
          <span className="text-blue-600">Driven by Autonomous AI</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          PayPilot AI understands natural-language invoicing and payment requests, enforces strict financial safety
          guards, and autonomously executes verified payment workflows through official PayPal Sandbox APIs.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to="/agent"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition"
          >
            <Bot className="w-4 h-4" />
            <span>Launch AI Agent Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold transition shadow-2xs"
          >
            <span>Explore Dashboard</span>
          </Link>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-4 py-3.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 border border-blue-200 text-sm font-semibold transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Sandbox Configuration</span>
          </button>
        </div>

        {/* Sandbox Notice Banner */}
        <div className="mt-8 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 max-w-xl mx-auto flex items-center justify-center space-x-2 shadow-2xs">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Safe Demonstration Environment: Connected to official PayPal Sandbox REST APIs. Zero real-money movement.
          </span>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Three Architecture Pillars</h2>
          <p className="text-xs text-slate-500 mt-1">
            Engineered for hackathon-winning depth: real backend services, safety limits, and verifiable reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">A. AI Operations Agent</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Interprets natural-language intent, extracts amount, recipient, and purpose, generates structured
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">B. Conditional Automations</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Visual rule engine that reacts to triggers: reconcile PayPal captured orders, stage contractor payouts
                upon milestone approvals, and diagnose payment failures with retry controls.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link to="/workflows" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                <span>View Workflow Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">C. Business Finance Copilot</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Grounded in the database: summarizes cash flow, identifies overdue invoices, detects duplicate payment
                attempts, and explains ledger transactions with zero hallucinations.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link to="/insights" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                <span>Inspect Insights & Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Minute Hackathon Demo Script Section */}
      <section className="max-w-4xl mx-auto">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Judge Walkthrough</span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">3-Minute Evaluation Script</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              Live & Verified
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Test AI Agent Natural Language Invoicing</p>
                <p className="text-slate-600 mt-0.5">
                  In the AI Workspace, click:{" "}
                  <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    "Create a $250 invoice for Alex for website development"
                  </code>
                  . Review the structured action plan and click <strong>"Authorize & Execute"</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900">Execute PayPal Sandbox Checkout & Capture</p>
                <p className="text-slate-600 mt-0.5">
                  Go to <strong>Invoices</strong>, locate the invoice, and click{" "}
                  <strong>"Pay via PayPal"</strong>. Complete the checkout flow to capture the order and
                  reconcile the ledger.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">Stage & Disburse Contractor Payout</p>
                <p className="text-slate-600 mt-0.5">
                  Ask the AI:{" "}
                  <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    "Prepare a $120 contractor payout for the approved design task"
                  </code>
                  . Verify safety limits require human approval, approve the payout, and disburse via Sandbox Payouts.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-semibold text-slate-900">Grounded Business Copilot & Audit Trail</p>
                <p className="text-slate-600 mt-0.5">
                  Ask:{" "}
                  <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">"Show overdue invoices"</code>.
                  Notice exact invoice numbers and balances match the database. View full audit trail in{" "}
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
