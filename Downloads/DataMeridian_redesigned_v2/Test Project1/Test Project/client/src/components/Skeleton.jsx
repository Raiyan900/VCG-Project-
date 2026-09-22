export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <SkeletonBlock className="h-9 w-9 rounded-lg" />
      <SkeletonBlock className="mt-4 h-6 w-20" />
      <SkeletonBlock className="mt-2 h-3.5 w-32" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-surface-600/40 px-4 py-3.5">
      <SkeletonBlock className="h-4 w-1/4" />
      <SkeletonBlock className="h-4 w-1/6" />
      <SkeletonBlock className="h-4 w-1/6" />
      <SkeletonBlock className="h-4 w-1/6" />
    </div>
  );
}
