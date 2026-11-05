import React, { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, Clock, AlertTriangle, CreditCard, Printer, Trash2, ExternalLink } from "lucide-react";
import { api, InvoiceItem, formatCodeClean } from "../api";
import { useToast } from "../context/ToastContext";
import { ConfirmModal } from "./common/ConfirmModal";

interface InvoiceDetailModalProps {
  invoice: InvoiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPayNow?: (inv: InvoiceItem) => void;
  onInvoiceDeleted?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPayNow,
  onInvoiceDeleted,
}) => {
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && invoice) {
      setLoadingReceipt(true);
      api
        .getInvoiceReceipt(invoice.id)
        .then((data) => setReceiptData(data))
        .catch(() => setReceiptData(null))
        .finally(() => setLoadingReceipt(false));
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteInvoice(invoice.id);
      showToast(`Invoice ${invoice.invoice_number} deleted`, "success");
      setIsConfirmDeleteOpen(false);
      onClose();
      if (onInvoiceDeleted) onInvoiceDeleted();
    } catch (e: any) {
      showToast(e.message || "Failed to delete invoice", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Invoice {formatCodeClean(invoice.invoice_number)}
                </h3>
                <p className="text-xs text-slate-500 font-mono">ID: #{invoice.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1 text-xs">
            {/* Status & Amount Banner */}
            <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Billed Amount
                </span>
                <span className="text-2xl font-black text-slate-900">
                  ${invoice.amount.toFixed(2)}{" "}
                  <span className="text-sm font-semibold text-slate-500">{invoice.currency}</span>
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  invoice.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : invoice.status === "OVERDUE"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {invoice.status}
              </span>
            </div>

            {/* Merchant & Customer Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Issued By (Merchant)
                </span>
                <p className="font-bold text-slate-900">
                  {receiptData?.merchant?.business_name || "Mercer Tech Labs"}
                </p>
                <p className="text-slate-500">{receiptData?.merchant?.email || "alex@mercertech.io"}</p>
                <span className="inline-block mt-1 text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  PayPal Sandbox Verified
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Billed To (Client)
                </span>
                <p className="font-bold text-slate-900">{invoice.recipient_name}</p>
                <p className="text-slate-500">{invoice.recipient_email}</p>
                <p className="text-slate-400 mt-1">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Line Items / Description */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Services Rendered
              </span>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                <p className="font-semibold text-slate-900">{invoice.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-slate-600">
                  <span>Standard Rate / Milestone Total</span>
                  <span className="font-bold text-slate-900">${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* PayPal Settlement Details */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                PayPal Sandbox Reconciliation
              </span>
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-slate-600 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="text-slate-800 font-semibold">{invoice.paypal_order_id || "Awaiting Checkout"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capture ID:</span>
                  <span className="text-slate-800 font-semibold">{invoice.paypal_capture_id || "Uncaptured"}</span>
                </div>
                {invoice.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid Timestamp:</span>
                    <span className="text-emerald-700 font-semibold">{new Date(invoice.paid_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-150 bg-slate-50/60 flex items-center justify-between">
            {invoice.status !== "PAID" ? (
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="flex items-center space-x-1.5 text-rose-600 hover:text-rose-700 font-semibold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel / Delete Invoice</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reconciled in General Ledger</span>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
              {invoice.status !== "PAID" && onPayNow && (
                <button
                  onClick={() => {
                    onClose();
                    onPayNow(invoice);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay via PayPal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.invoice_number}? This will permanently remove this receivable record.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Invoice"}
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};

