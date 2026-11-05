import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bg = "bg-white border-slate-200 text-slate-800";
          let icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;
          if (toast.type === "success") {
            bg = "bg-white border-emerald-200 text-slate-900";
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
          } else if (toast.type === "error") {
            bg = "bg-white border-rose-200 text-slate-900";
            icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
          } else if (toast.type === "warning") {
            bg = "bg-white border-amber-200 text-slate-900";
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-3 ${bg}`}
              role="alert"
            >
              {icon}
              <div className="flex-1 min-w-0 text-xs">
                {toast.title && <p className="font-bold text-slate-900 mb-0.5">{toast.title}</p>}
                <p className="font-medium text-slate-600 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

