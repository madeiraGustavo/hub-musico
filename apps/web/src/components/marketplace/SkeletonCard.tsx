interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`animate-pulse rounded-[var(--mp-radius-md)] border border-[var(--mp-border-default)] bg-[var(--mp-bg-elevated)] overflow-hidden ${className}`}
    >
      {/* Image placeholder — matches aspect-[4/3] from ProductCard */}
      <div className="aspect-[4/3] bg-[var(--mp-bg-muted)]" />

      {/* Content area — matches p-4 padding from ProductCard */}
      <div className="p-4 space-y-3">
        {/* Category badge placeholder */}
        <div className="h-4 w-16 rounded-full bg-[var(--mp-bg-muted)]" />

        {/* Title line 1 */}
        <div className="h-4 w-full rounded bg-[var(--mp-bg-muted)]" />

        {/* Title line 2 (shorter) */}
        <div className="h-4 w-3/4 rounded bg-[var(--mp-bg-muted)]" />

        {/* Price placeholder */}
        <div className="h-5 w-24 rounded bg-[var(--mp-bg-muted)]" />
      </div>
    </div>
  )
}
