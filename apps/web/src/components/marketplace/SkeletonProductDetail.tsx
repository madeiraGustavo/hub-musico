interface SkeletonProductDetailProps {
  className?: string
}

export function SkeletonProductDetail({ className = '' }: SkeletonProductDetailProps) {
  return (
    <div className={`animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8 ${className}`}>
      {/* Left column — Gallery */}
      <div className="space-y-4">
        {/* Main image placeholder (square) */}
        <div className="aspect-square w-full rounded-[var(--mp-radius-md)] bg-[var(--mp-bg-muted)]" />

        {/* Thumbnail row */}
        <div className="flex gap-2">
          <div className="w-16 h-16 rounded-[var(--mp-radius-sm)] bg-[var(--mp-bg-muted)]" />
          <div className="w-16 h-16 rounded-[var(--mp-radius-sm)] bg-[var(--mp-bg-muted)]" />
          <div className="w-16 h-16 rounded-[var(--mp-radius-sm)] bg-[var(--mp-bg-muted)]" />
          <div className="w-16 h-16 rounded-[var(--mp-radius-sm)] bg-[var(--mp-bg-muted)]" />
        </div>
      </div>

      {/* Right column — Details */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-7 w-3/4 rounded bg-[var(--mp-bg-muted)]" />
          {/* Short description lines */}
          <div className="h-4 w-full rounded bg-[var(--mp-bg-muted)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--mp-bg-muted)]" />
        </div>

        {/* Price block */}
        <div className="h-8 w-32 rounded bg-[var(--mp-bg-muted)]" />

        {/* Button placeholder */}
        <div className="h-12 w-full rounded-lg bg-[var(--mp-bg-muted)]" />

        {/* Specs grid */}
        <div className="border-t border-[var(--mp-border-default)] pt-6 space-y-3">
          <div className="h-4 w-28 rounded bg-[var(--mp-bg-muted)]" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-4 w-16 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-20 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-16 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-20 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-16 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-20 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-16 rounded bg-[var(--mp-bg-muted)]" />
            <div className="h-4 w-20 rounded bg-[var(--mp-bg-muted)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
