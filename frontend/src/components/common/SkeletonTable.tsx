import React from "react";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs animate-pulse">
      <div className="bg-slate-50 border-b border-slate-200 h-10 flex items-center px-4 space-x-6">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded w-24" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center px-4 py-4 space-x-6">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={`h-3 bg-slate-100 rounded ${
                  cIdx === 0 ? "w-28 bg-slate-200" : cIdx === 1 ? "w-40" : "w-20"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

