import React from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: "danger" | "default" | "primary";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive,
  variant,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const destructive = isDestructive || variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                destructive
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please confirm your decision</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 ${
              destructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
