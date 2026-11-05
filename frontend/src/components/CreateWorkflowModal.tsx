import React, { useState } from "react";
import { X, GitBranch, Plus, CheckCircle2 } from "lucide-react";
import { api, WorkflowRuleItem } from "../api";
import { useToast } from "../context/ToastContext";

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowCreated: (rule: WorkflowRuleItem) => void;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  onWorkflowCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("INVOICE_PAID");
  const [actionType, setActionType] = useState("RECONCILE_AND_LEDGER");
  const [conditionExpression, setConditionExpression] = useState("invoice.amount > 0");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Workflow name is required");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const newRule = await api.createWorkflow({
        name: name.trim(),
        description: description.trim() || `Automated ${actionType} when ${triggerType}`,
        trigger_type: triggerType,
        condition_expression: conditionExpression.trim() || undefined,
        action_type: actionType,
        requires_approval: requiresApproval,
        is_active: true,
      });
      showToast(`Rule '${newRule.name}' created`, "success");
      onWorkflowCreated(newRule);
      onClose();
      // Reset form
      setName("");
      setDescription("");
      setTriggerType("INVOICE_PAID");
      setActionType("RECONCILE_AND_LEDGER");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create workflow rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Workflow Automation</h3>
              <p className="text-xs text-slate-500">Define event-driven financial rules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Workflow Name</label>
            <input
              type="text"
              placeholder="e.g. VIP Contractor Immediate Payout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Description</label>
            <input
              type="text"
              placeholder="Brief explanation of when this rule fires..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Trigger Event (WHEN)</label>
              <select
                value={triggerType}
                onChange={(e) => {
                  setTriggerType(e.target.value);
                  if (e.target.value === "INVOICE_PAID") setConditionExpression("invoice.amount > 0");
                  else if (e.target.value === "TASK_APPROVED") setConditionExpression("payout.amount <= 5000");
                  else if (e.target.value === "INVOICE_OVERDUE") setConditionExpression("invoice.days_overdue > 0");
                  else if (e.target.value === "PAYMENT_FAILED") setConditionExpression("payment.error != null");
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-900"
              >
                <option value="INVOICE_PAID">INVOICE_PAID</option>
                <option value="TASK_APPROVED">TASK_APPROVED</option>
                <option value="INVOICE_OVERDUE">INVOICE_OVERDUE</option>
                <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Action (THEN)</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-900"
              >
                <option value="RECONCILE_AND_LEDGER">RECONCILE_AND_LEDGER</option>
                <option value="PREPARE_PAYOUT">PREPARE_PAYOUT</option>
                <option value="GENERATE_REMINDER">GENERATE_REMINDER</option>
                <option value="LOG_FAILURE_RECOVERY">LOG_FAILURE_RECOVERY</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Condition Expression (IF)</label>
            <input
              type="text"
              value={conditionExpression}
              onChange={(e) => setConditionExpression(e.target.value)}
              placeholder="e.g. invoice.amount > 100"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2.5 pt-2">
            <input
              type="checkbox"
              id="requires_approval"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="requires_approval" className="font-medium text-slate-700 cursor-pointer">
              Enforce Human Operator Authorization Gate before execution
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{saving ? "Creating..." : "Save Rule"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

