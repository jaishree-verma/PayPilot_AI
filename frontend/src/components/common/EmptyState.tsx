import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
}) => {
  const finalLabel = action?.label || actionLabel;
  const finalAction = action?.onClick || onAction;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {finalLabel && finalAction && (
        <button
          onClick={finalAction}
          className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          {finalLabel}
        </button>
      )}
    </div>
  );
};
