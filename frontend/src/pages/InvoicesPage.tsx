import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { api, InvoiceItem, formatCodeClean } from "../api";
import { PayPalCheckoutModal } from "../components/PayPalCheckoutModal";

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceForCheckout, setSelectedInvoiceForCheckout] = useState<InvoiceItem | null>(null);

  // Form State
  const [formRecipientName, setFormRecipientName] = useState("");
  const [formRecipientEmail, setFormRecipientEmail] = useState("");
  const [formAmount, setFormAmount] = useState<number | "">("");
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formDescription, setFormDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const statusParam = filter === "ALL" ? undefined : filter;
      const data = await api.getInvoices(statusParam);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || formAmount <= 0) {
      setErrorMsg("Amount must be strictly positive");
      return;
    }
    setCreating(true);
    setErrorMsg("");
    try {
      await api.createInvoice({
        recipient_name: formRecipientName,
        recipient_email: formRecipientEmail,
        amount: Number(formAmount),
        currency: formCurrency,
        description: formDescription,
      });
      setIsCreateOpen(false);
      setFormRecipientName("");
      setFormRecipientEmail("");
      setFormAmount("");
      setFormDescription("");
      fetchInvoices();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, track, and collect customer payments via official PayPal Sandbox Orders API
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
          {["ALL", "SENT", "PAID", "OVERDUE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filter === tab ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, number, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full sm:w-72 shadow-2xs transition"
          />
        </div>
      </div>

      {/* Clean White Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-3.5 px-4 font-semibold">Invoice ID</th>
                <th className="py-3.5 px-4 font-semibold">Client / Recipient</th>
                <th className="py-3.5 px-4 font-semibold">Description</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Due Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600">{formatCodeClean(inv.invoice_number)}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{inv.recipient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.recipient_email}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate">{inv.description}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                      ${inv.amount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "OVERDUE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {inv.status !== "PAID" ? (
                        <button
                          onClick={() => setSelectedInvoiceForCheckout(inv)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay via PayPal</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reconciled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No invoices found. Click "Create Invoice" to issue a new bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Clean White Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Customer Invoice</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={formRecipientName}
                  onChange={(e) => setFormRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Email (PayPal)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex.rivera@example.com"
                  value={formRecipientEmail}
                  onChange={(e) => setFormRecipientEmail(e.target.value)}
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
                    placeholder="250.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Deliverable</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Website development milestone 1 deliverable"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">{errorMsg}</div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm cursor-pointer"
              >
                {creating ? "Creating Invoice..." : "Issue Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PayPal Checkout Modal */}
      <PayPalCheckoutModal
        invoice={selectedInvoiceForCheckout}
        isOpen={Boolean(selectedInvoiceForCheckout)}
        onClose={() => setSelectedInvoiceForCheckout(null)}
        onPaymentSuccess={() => {
          setSelectedInvoiceForCheckout(null);
          fetchInvoices();
        }}
      />
    </div>
  );
};
