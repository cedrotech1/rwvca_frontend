function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-gray-200/80 ${className}`} aria-hidden />;
}

export function Skeleton({ className = '' }) {
  return <SkeletonBlock className={className} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ rows = 4 }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
      <SkeletonBlock className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-16 w-full rounded-xl" />
      <SkeletonCard rows={6} />
      <SkeletonCard rows={3} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-44 rounded-xl" />
        ))}
      </div>
      <SkeletonBlock className="h-52 rounded-xl" />
      <div className="grid lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TablePageSkeleton({ rows = 8 }) {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-16 w-full rounded-xl" />
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-3">
        <SkeletonBlock className="h-9 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
