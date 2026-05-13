interface MetricsCardProps {
  label: string
  value: number
}

export function MetricsCard({ label, value }: MetricsCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border-default bg-bg-surface">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-default mt-1">{value}</p>
    </div>
  )
}
