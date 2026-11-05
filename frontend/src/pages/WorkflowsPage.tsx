import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";
import { api, WorkflowRuleItem, WorkflowExecutionItem } from "../api";
import { useToast } from "../context/ToastContext";
import { CreateWorkflowModal } from "../components/CreateWorkflowModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { SkeletonTable } from "../components/common/SkeletonTable";
import { EmptyState } from "../components/common/EmptyState";

export const WorkflowsPage: React.FC = () => {
  const { showToast } = useToast();
  const [rules, setRules] = useState<WorkflowRuleItem[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningRuleId, setRunningRuleId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Confirm delete modal state
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<WorkflowRuleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, execData] = await Promise.all([
        api.getWorkflows(),
        api.getWorkflowExecutions(),
      ]);
      setRules(rulesData);
      setExecutions(execData);
    } catch (e: any) {
      console.error(e);
      showToast("Failed to load workflows", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: number) => {
    // Optimistic UI update
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
    try {
      const updated = await api.toggleWorkflow(id);
      showToast(
        `Rule '${updated.name}' is now ${updated.is_active ? "Active" : "Paused"}`,
        "info"
      );
    } catch (e: any) {
      showToast(`Toggle failed: ${e.message}`, "error");
      fetchData(); // rollback
    }
  };

  const handleTestRun = async (id: number) => {
    setRunningRuleId(id);
    try {
      const res = await api.testRunWorkflow(id);
      showToast(`Rule evaluated: ${res.status}`, "success", "Workflow Executed");
      // refresh executions
      const execData = await api.getWorkflowExecutions();
      setExecutions(execData);
    } catch (e: any) {
      showToast(`Evaluation failed: ${e.message}`, "error", "Execution Error");
    } finally {
      setRunningRuleId(null);
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleTarget) return;
    setDeleting(true);
    try {
      await api.deleteWorkflow(deleteRuleTarget.id);
      showToast(`Rule '${deleteRuleTarget.name}' deleted`, "success");
      setRules((prev) => prev.filter((r) => r.id !== deleteRuleTarget.id));
      setDeleteRuleTarget(null);
    } catch (e: any) {
      showToast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conditional Payment Automation</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Visual Workflow Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trigger → Validation → Approval → PayPal Execution → Reconciliation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Visual Pipeline Showcase Banner */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Standard Automation Pipeline Flow
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Trigger Event</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>2. Business Validation</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Human Approval</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>4. PayPal Execution</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>5. Ledger Reconciliation</span>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-2/3"></div>
            <div className="h-16 bg-slate-100 rounded"></div>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 bg-white animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-2/3"></div>
            <div className="h-16 bg-slate-100 rounded"></div>
          </div>
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          title="No Automation Rules Configured"
          description="Create your first rule to automate incoming payment triggers and payout verifications."
          icon={<GitBranch className="w-8 h-8" />}
          action={{
            label: "Create Automation Rule",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-6 rounded-xl border transition shadow-2xs space-y-4 ${
                rule.is_active
                  ? "bg-white border-slate-200 hover:border-blue-200"
                  : "bg-slate-50/70 border-slate-200 opacity-60"
              }`}
            >
              {/* Header & Toggle */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {rule.trigger_type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 pt-1">{rule.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={rule.is_active ? "Disable Rule" : "Enable Rule"}
                  >
                    {rule.is_active ? (
                      <ToggleRight className="w-7 h-7 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteRuleTarget(rule)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>

              {/* Condition & Action Pipeline */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs font-mono">
                <div className="flex items-center space-x-2 text-blue-700">
                  <span className="text-slate-500 font-sans font-bold">WHEN:</span>
                  <span>{rule.trigger_type}</span>
                </div>
                {rule.condition_expression && (
                  <div className="flex items-center space-x-2 text-amber-700">
                    <span className="text-slate-500 font-sans font-bold">IF:</span>
                    <span>{rule.condition_expression}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-emerald-700">
                  <span className="text-slate-500 font-sans font-bold">THEN:</span>
                  <span>{rule.action_type}</span>
                </div>
              </div>

              {/* Actions & Status */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rule.requires_approval
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {rule.requires_approval ? "Requires Human Approval" : "Autonomous Execution"}
                </span>

                <button
                  onClick={() => handleTestRun(rule.id)}
                  disabled={runningRuleId === rule.id || !rule.is_active}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 text-blue-600 ${runningRuleId === rule.id ? "animate-spin" : ""}`} />
                  <span>{runningRuleId === rule.id ? "Evaluating..." : "Test Trigger Rule"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4 p-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Workflow Execution History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of all automated triggers, inputs, and executed outcomes
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <SkeletonTable columns={5} rows={3} />
          ) : executions.length === 0 ? (
            <EmptyState
              title="No Executions Logged"
              description='Click "Test Trigger Rule" above to evaluate an automation rule and review its output.'
              icon={<Clock className="w-8 h-8" />}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                  <th className="py-3 px-3 font-semibold">Workflow Name</th>
                  <th className="py-3 px-3 font-semibold">Trigger Event</th>
                  <th className="py-3 px-3 font-semibold">Outcome / Action</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{ex.workflow_name}</td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {ex.trigger_event}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-sm truncate font-mono text-[11px]">
                      {ex.execution_result ? JSON.stringify(ex.execution_result) : "Processed"}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ex.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {new Date(ex.executed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      <CreateWorkflowModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onWorkflowCreated={(newRule) => {
          setRules((prev) => [newRule, ...prev]);
        }}
      />

      {/* Delete Rule Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteRuleTarget)}
        title="Delete Workflow Rule"
        message={`Are you sure you want to permanently delete rule "${deleteRuleTarget?.name}"?`}
        confirmLabel="Delete Rule"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteRule}
        onCancel={() => setDeleteRuleTarget(null)}
      />
    </div>
  );
};
