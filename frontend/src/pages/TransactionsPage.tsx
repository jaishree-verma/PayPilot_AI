import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  X,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { api, TransactionItem, formatCodeClean } from "../api";

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === "ALL" ? undefined : typeFilter;
      const data = await api.getTransactions(typeParam, undefined, search || undefined);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Ledger & Transactions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled PayPal Sandbox orders, contractor disbursements, and verified journal entries
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
          {[
            { id: "ALL", label: "All Types" },
            { id: "INCOMING_PAYMENT", label: "Incoming" },
            { id: "CONTRACTOR_PAYOUT", label: "Payouts" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                typeFilter === t.id ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full sm:w-72 shadow-2xs transition"
          />
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-3.5 px-4 font-semibold">Reference ID</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Description</th>
                <th className="py-3.5 px-4 font-semibold">Gross</th>
                <th className="py-3.5 px-4 font-semibold">Net</th>
                <th className="py-3.5 px-4 font-semibold">Source</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-blue-600">{formatCodeClean(tx.reference_id)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === "INCOMING_PAYMENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {tx.type === "INCOMING_PAYMENT" ? "Incoming" : "Payout"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{tx.description}</td>
                    <td
                      className={`py-3.5 px-4 font-bold ${
                        tx.type === "INCOMING_PAYMENT" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {tx.type === "INCOMING_PAYMENT" ? "+" : "-"}${tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      ${tx.net_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {tx.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Clean White Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Transaction Record Details</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reference ID:</span>
                <span className="font-mono font-bold text-blue-600">{selectedTx.reference_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Type:</span>
                <span className="font-bold text-slate-900">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gross Amount:</span>
                <span className="font-bold text-slate-900">
                  ${selectedTx.amount.toFixed(2)} {selectedTx.currency}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Processing Fee:</span>
                <span className="font-mono text-slate-700">${selectedTx.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Net Reconciled:</span>
                <span className="font-bold text-emerald-600">${selectedTx.net_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Data Source:</span>
                <span className="font-mono text-slate-700">{selectedTx.source}</span>
              </div>
              {selectedTx.paypal_resource_id && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">PayPal Resource ID:</span>
                  <span className="font-mono text-slate-700">{selectedTx.paypal_resource_id}</span>
                </div>
              )}
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedTx.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
