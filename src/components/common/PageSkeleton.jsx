import { useState, useEffect } from 'react';

export function PageSkeleton({ children, delay = 400 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!ready) return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* KPI row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-card rounded-xl border border-surface-border p-5 animate-pulse">
            <div className="h-3 w-20 bg-surface-hover rounded mb-3" />
            <div className="h-7 w-16 bg-surface-hover rounded mb-2" />
            <div className="h-2.5 w-24 bg-surface-hover rounded" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="h-5 w-40 bg-surface-hover rounded animate-pulse" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-surface-divider">
            <div className="h-3.5 w-24 bg-surface-hover rounded animate-pulse" />
            <div className="h-3.5 w-16 bg-surface-hover rounded animate-pulse" />
            <div className="h-3.5 w-20 bg-surface-hover rounded animate-pulse" />
            <div className="flex-1" />
            <div className="h-3.5 w-12 bg-surface-hover rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  return children;
}
