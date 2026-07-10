interface SkeletonProps {
  lines?: number;
  className?: string;
}

export default function Skeleton({ lines = 3, className = '' }: SkeletonProps) {
  const widths = ['100%', '85%', '70%'];
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-6 space-y-4">
      <div className="skeleton h-5 w-1/3" />
      <Skeleton lines={2} />
    </div>
  );
}
