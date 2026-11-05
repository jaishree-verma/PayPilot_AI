import React, { useState, useEffect } from "react";
import {
  Send,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  ArrowRight,
  Trash2,
  XCircle,
} from "lucide-react";
import { api, PayoutItem } from "../api";
import { useToast } from "../context/ToastContext";
import { SkeletonTable } from "../components/common/SkeletonTable";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmModal } from "../components/common/ConfirmModal";

export const PayoutsPage: React.FC = () => {
  const { showToast } = useToast();
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => async () => {});
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("USD");
  const [purpose, setPurpose] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const data = await api.getPayouts();
      setPayouts(data);
    } catch (e) {
      console.error(e);
      showToast("Failed to load payouts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setFormError("Amount must be greater than zero");
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      await api.createPayout({
        recipient_name: name,
        recipient_email: email,
        amount: Number(amount),
        currency,
        purpose,
      });
      showToast(`Payout staged for ${name}`, "success", "Payout Created");
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setAmount("");
      setPurpose("");
      fetchPayouts();
    } catch (e: any) {
      setFormError(e.message || "Failed to create payout");
    } finally {
      setCreating(false);
    }
  };

  const openConfirm = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleConfirmExecute = async () => {
    setConfirmLoading(true);
    try {
      await confirmAction();
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleApprove = (id: number) => {
    const payout = payouts.find((p) => p.id === id);
    openConfirm(
      "Approve Payout",
      `Approve payout of $${payout?.amount.toFixed(2)} to ${payout?.recipient_name}? This will mark it ready for disbursement.`,
      async () => {
        setApprovingId(id);
        try {
          await api.approvePayout(id, "Human Operator");
          showToast("Payout approved successfully", "success", "Approved");
          fetchPayouts();
        } catch (e: any) {
          showToast(`Approval error: ${e.message}`, "error", "Approval Failed");
        } finally {
          setApprovingId(null);
        }
      }
    );
  };

  const handleExecute = (id: number) => {
    const payout = payouts.find((p) => p.id === id);
    openConfirm(
      "Disburse Funds",
      `Execute PayPal payout of $${payout?.amount.toFixed(2)} to ${payout?.recipient_name} (${payout?.recipient_email})? This action is irreversible.`,
      async () => {
        setExecutingId(id);
        try {
          await api.executePayout(id);
          showToast("Funds disbursed via PayPal Sandbox", "success", "Disbursed");
          fetchPayouts();
        } catch (e: any) {
          showToast(`Execution error: ${e.message}`, "error", "Disbursement Failed");
        } finally {
          setExecutingId(null);
        }
      }
    );
  };

  const handleReject = (id: number) => {
    const payout = payouts.find((p) => p.id === id);
    openConfirm(
      "Reject Payout",
      `Reject and cancel payout for ${payout?.recipient_name}? This cannot be undone.`,
      async () => {
        try {
          await api.rejectPayout(id);
          showToast("Payout rejected", "warning", "Rejected");
          fetchPayouts();
        } catch (e: any) {
          showToast(`Reject error: ${e.message}`, "error");
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    const payout = payouts.find((p) => p.id === id);
    openConfirm(
      "Delete Payout Record",
      `Permanently delete payout record for ${payout?.recipient_name}? This cannot be undone.`,
      async () => {
        try {
          await api.deletePayout(id);
          showToast("Payout record deleted", "info", "Deleted");
          fetchPayouts();
        } catch (e: any) {
          showToast(`Delete error: ${e.message}`, "error");
        }
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contractor Payouts</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              PayPal Payouts API
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gated contractor disbursements with double-payment prevention, approval thresholds, and batch tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Prepare Payout</span>
          </button>
          <button
            onClick={fetchPayouts}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Security Protocol Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start space-x-3 text-xs shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-slate-700 space-y-0.5">
          <span className="font-bold text-blue-950">Financial Security Protocol:</span>
          <p className="text-slate-600 leading-relaxed">
            Autonomous payouts above $100 strictly mandate manual operator authorization. All payout executions check
            database idempotency keys to eliminate duplicate disbursements.
          </p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          {loading ? (
            <SkeletonTable columns={7} rows={4} />
          ) : payouts.length === 0 ? (
            <EmptyState
              title="No payouts staged"
              description='Click "Prepare Payout" to stage a contractor disbursement.'
              icon={<Send className="w-8 h-8" />}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                  <th className="py-3.5 px-4 font-semibold">Reference</th>
                  <th className="py-3.5 px-4 font-semibold">Contractor</th>
                  <th className="py-3.5 px-4 font-semibold">Purpose</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Mode &amp; Batch</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 font-mono font-bold text-slate-800">
                      <div>{po.payout_reference}</div>
                      {po.is_duplicate_flag && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                          Duplicate Flagged
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{po.recipient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{po.recipient_email}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate">{po.purpose}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                      ${po.amount.toFixed(2)} {po.currency}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[10px] font-mono text-slate-500">
                        {po.paypal_batch_id || (po.payout_mode === "SANDBOX_API" ? "Live Sandbox" : "Simulated")}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : po.status === "APPROVED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : po.status === "PENDING_APPROVAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {po.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() => handleApprove(po.id)}
                              disabled={approvingId === po.id}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs transition cursor-pointer"
                            >
                              {approvingId === po.id ? "Approving..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(po.id)}
                              className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition cursor-pointer"
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {po.status === "APPROVED" && (
                          <button
                            onClick={() => handleExecute(po.id)}
                            disabled={executingId === po.id}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center space-x-1 inline-flex shadow-2xs cursor-pointer"
                          >
                            <span>{executingId === po.id ? "Disbursing..." : "Disburse Funds"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {po.status === "COMPLETED" && (
                          <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Disbursed</span>
                          </span>
                        )}

                        {(po.status === "REJECTED" || po.status === "COMPLETED") && (
                          <button
                            onClick={() => handleDelete(po.id)}
                            className="px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 text-xs transition cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Prepare Payout Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Prepare Contractor Payout</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contractor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contractor PayPal Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. elena@quantumdev.tech"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="120.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task / Purpose</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Approved milestone deliverable - Mobile wireframes"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">{formError}</div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm cursor-pointer"
              >
                {creating ? "Staging Payout..." : "Stage Payout Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Confirm"
        variant="danger"
        loading={confirmLoading}
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
