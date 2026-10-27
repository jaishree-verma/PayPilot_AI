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
} from "lucide-react";
import { api, PayoutItem } from "../api";

export const PayoutsPage: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

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

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    try {
      await api.approvePayout(id, "Human Operator");
      fetchPayouts();
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleExecute = async (id: number) => {
    setExecutingId(id);
    try {
      await api.executePayout(id);
      fetchPayouts();
    } catch (e: any) {
      alert(`Execution error: ${e.message}`);
    } finally {
      setExecutingId(null);
    }
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
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-3.5 px-4 font-semibold">Reference</th>
                <th className="py-3.5 px-4 font-semibold">Contractor</th>
                <th className="py-3.5 px-4 font-semibold">Purpose</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Mode & Batch</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.length > 0 ? (
                payouts.map((po) => (
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
                    <td className="py-4 px-4 text-right space-x-2">
                      {po.status === "PENDING_APPROVAL" && (
                        <button
                          onClick={() => handleApprove(po.id)}
                          disabled={approvingId === po.id}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs transition cursor-pointer"
                        >
                          {approvingId === po.id ? "Approving..." : "Approve Request"}
                        </button>
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
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Disbursed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payouts staged yet. Click "Prepare Payout" to disburse funds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </div>
  );
};
