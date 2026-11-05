import React from "react";

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3.5 bg-slate-200 rounded w-24" />
        <div className="w-8 h-8 rounded-lg bg-slate-100" />
      </div>
      <div className="h-7 bg-slate-200 rounded w-32" />
      <div className="h-2.5 bg-slate-100 rounded w-48" />
    </div>
  );
};

