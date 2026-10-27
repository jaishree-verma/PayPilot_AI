import React, { useState } from "react";
import { X, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { api, InvoiceItem } from "../api";

interface PayPalCheckoutModalProps {
  invoice: InvoiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PayPalCheckoutModal: React.FC<PayPalCheckoutModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<"INIT" | "ORDER_CREATED" | "CAPTURING" | "SUCCESS" | "ERROR">("INIT");
  const [orderData, setOrderData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleCreateOrder = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.createCheckoutOrder(invoice.id);
      setOrderData(data);
      setStep("ORDER_CREATED");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to initialize PayPal order");
      setStep("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureOrder = async () => {
    if (!orderData?.id) return;
    setLoading(true);
    setStep("CAPTURING");
    try {
      await api.captureInvoiceOrder(invoice.id, orderData.id);
      setStep("SUCCESS");
      onPaymentSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || "Capture failed");
      setStep("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const approveLink = orderData?.links?.find((l: any) => l.rel === "approve")?.href;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-6 border-b border-slate-150 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900">PayPal Sandbox Checkout</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {orderData?.simulated ? "Simulated" : "Orders API"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Invoice #{invoice.invoice_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Invoice Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Client / Recipient:</span>
              <span className="font-semibold text-slate-900">{invoice.recipient_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Description:</span>
              <span className="text-slate-700 truncate max-w-[240px] font-medium">{invoice.description}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total Payable:</span>
              <span className="text-xl font-bold text-blue-600">
                ${invoice.amount.toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>

          {/* Step 1: Initial Prompt */}
          {step === "INIT" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Click below to create an authorized order session via the official PayPal Sandbox Orders API. The backend will
                generate an idempotent order session and prepare for client capture.
              </p>
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{loading ? "Creating PayPal Order..." : "Create PayPal Sandbox Order"}</span>
              </button>
            </div>
          )}

          {/* Step 2: Order Created, Ready to Capture */}
          {step === "ORDER_CREATED" && orderData && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>PayPal Order Created ({orderData.id})</span>
                </div>
                <p className="text-slate-600">
                  Status: <span className="font-mono font-bold text-emerald-600">{orderData.status}</span> | Intent: CAPTURE
                </p>
              </div>

              {approveLink && (
                <a
                  href={approveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs"
                >
                  <span>Open PayPal Sandbox Approval Window</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                onClick={handleCaptureOrder}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Simulate Client Approval & Capture Funds</span>
              </button>
            </div>
          )}

          {/* Step 3: Capturing Spinner */}
          {step === "CAPTURING" && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-900">Capturing PayPal Order via REST API...</p>
              <p className="text-xs text-slate-500">Verifying signature and reconciling ledger transaction</p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "SUCCESS" && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Payment Captured & Reconciled!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Invoice #{invoice.invoice_number} is now marked <strong>PAID</strong>. A verified incoming transaction
                  has been added to the financial ledger.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Close & View Reconciled Ledger
              </button>
            </div>
          )}

          {/* Error State */}
          {step === "ERROR" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-semibold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Checkout Error</span>
                </div>
                <p>{errorMsg}</p>
              </div>
              <button
                onClick={() => setStep("INIT")}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Retry Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
