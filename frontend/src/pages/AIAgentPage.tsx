import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";
import { api, AIChatResponse, AIActionPlan } from "../api";

interface MessageItem {
  id: string;
  sender: "user" | "agent";
  text: string;
  actionPlan?: AIActionPlan | null;
  groundedData?: any;
  auditId?: number;
  executionStatus?: "PENDING" | "EXECUTING" | "EXECUTED" | "REJECTED" | "FAILED";
  executionResult?: any;
  timestamp: string;
}

export const AIAgentPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "msg-1",
      sender: "agent",
      text: "Hello! I am PayPilot AI, your autonomous payment operations assistant. I can interpret natural-language requests, extract payment entities, enforce safety rules, and stage verified operations via PayPal Developer Sandbox.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "Create an invoice for $250.",
    "Show my overdue invoices.",
    "Prepare a contractor payout.",
    "Summarize my recent transactions.",
    "Check for duplicate payment requests.",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response: AIChatResponse = await api.sendChatMessage(text);
      const agentMsg: MessageItem = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: response.message,
        actionPlan: response.action_plan,
        groundedData: response.grounded_data,
        auditId: response.audit_event_id,
        executionStatus: response.action_plan ? "PENDING" : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (e: any) {
      const errorMsg: MessageItem = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `Error processing request: ${e.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePlan = async (messageId: string, planId: number, decision: "CONFIRM" | "REJECT") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, executionStatus: "EXECUTING" } : m))
    );

    try {
      const res = await api.executePlan(planId, decision);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                executionStatus: decision === "CONFIRM" ? "EXECUTED" : "REJECTED",
                executionResult: res.result || res.message,
              }
            : m
        )
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                executionStatus: "FAILED",
                executionResult: e.message,
              }
            : m
        )
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Centered Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">PayPilot AI Assistant</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                Controlled Execution
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Natural language payment planning with entity extraction, safety thresholds, and operator approval gates
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Suggested Inquiries</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="text-left px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium shadow-2xs transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Spacious White Chat Window */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[480px] max-h-[640px] overflow-y-auto space-y-6 shadow-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === "user"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-3 max-w-2xl ${m.sender === "user" ? "items-end" : ""}`}>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-2xs"
                    : "bg-slate-50/80 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-2xs"
                }`}
              >
                <p className="whitespace-pre-line font-medium">{m.text}</p>
                <span className={`block mt-2 text-[10px] text-right ${m.sender === "user" ? "text-blue-100" : "text-slate-400"}`}>
                  {m.timestamp}
                </span>
              </div>

              {/* Structured Payment Action Card */}
              {m.actionPlan && (
                <div className="p-5 rounded-xl bg-white border-t-4 border-t-blue-600 border border-slate-200 space-y-3.5 text-xs shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Structured Payment Action Plan
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.actionPlan.risk_level === "HIGH"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : m.actionPlan.risk_level === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        Risk: {m.actionPlan.risk_level}
                      </span>
                      {m.actionPlan.requires_approval && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Approval Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Content */}
                  <div className="space-y-1">
                    <p className="font-bold text-blue-600 text-sm">{m.actionPlan.proposed_action}</p>
                    <p className="text-slate-600">{m.actionPlan.reasoning}</p>
                  </div>

                  {/* Extracted Parameter Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-150 text-[11px]">
                    {m.actionPlan.entities.amount && (
                      <div>
                        <span className="text-slate-500 block">Amount:</span>
                        <span className="font-bold text-slate-900">
                          ${m.actionPlan.entities.amount.toFixed(2)} {m.actionPlan.entities.currency || "USD"}
                        </span>
                      </div>
                    )}
                    {m.actionPlan.entities.recipient_name && (
                      <div>
                        <span className="text-slate-500 block">Recipient:</span>
                        <span className="font-semibold text-slate-900">{m.actionPlan.entities.recipient_name}</span>
                      </div>
                    )}
                    {m.actionPlan.entities.purpose && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block">Purpose:</span>
                        <span className="text-slate-700 truncate block font-medium">{m.actionPlan.entities.purpose}</span>
                      </div>
                    )}
                  </div>

                  {/* Consequences */}
                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-800">Consequences: </strong>
                    {m.actionPlan.consequences}
                  </div>

                  {/* Human Confirmation Controls */}
                  {m.actionPlan.is_allowed && m.actionPlan.plan_id && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {m.executionStatus === "PENDING" && (
                        <div className="flex items-center space-x-2 w-full">
                          <button
                            onClick={() => handleExecutePlan(m.id, m.actionPlan!.plan_id!, "CONFIRM")}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Authorize & Execute Action</span>
                          </button>
                          <button
                            onClick={() => handleExecutePlan(m.id, m.actionPlan!.plan_id!, "REJECT")}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {m.executionStatus === "EXECUTING" && (
                        <div className="flex items-center space-x-2 text-blue-600 py-1 font-medium">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Executing authorized action via PayPal backend service...</span>
                        </div>
                      )}

                      {m.executionStatus === "EXECUTED" && (
                        <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Action Successfully Authorized & Executed</span>
                          </div>
                          {typeof m.executionResult === "object" && (
                            <p className="text-[11px] font-mono text-emerald-700">
                              Ref: {m.executionResult.invoice_number || m.executionResult.payout_reference} | Status:{" "}
                              {m.executionResult.status}
                            </p>
                          )}
                        </div>
                      )}

                      {m.executionStatus === "REJECTED" && (
                        <div className="flex items-center space-x-1.5 text-slate-500 py-1">
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span>Action plan was rejected by operator.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!m.actionPlan.is_allowed && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Execution Blocked by Safety Guard</span>
                        <p className="text-[11px] mt-0.5 text-rose-700">{m.actionPlan.blocking_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>AI Agent is analyzing request, querying database records and safety limits...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Rounded Prompt Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="Type payment request (e.g. 'Create an invoice for $250' or 'Show my overdue invoices')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
