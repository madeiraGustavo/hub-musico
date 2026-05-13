'use client'

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm rounded border border-border-default bg-bg-surface text-text-default disabled:opacity-50 disabled:cursor-not-allowed hover:border-border-hover transition-colors"
      >
        Anterior
      </button>
      <span className="text-sm text-text-muted">
        {page} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm rounded border border-border-default bg-bg-surface text-text-default disabled:opacity-50 disabled:cursor-not-allowed hover:border-border-hover transition-colors"
      >
        Próxima
      </button>
    </nav>
  )
}
