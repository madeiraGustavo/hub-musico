'use client'

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  // Generate page numbers to display (show up to 5 pages with ellipsis)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = [1]

    if (page > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      className="flex items-center justify-center gap-1 sm:gap-2 mt-8"
      aria-label="Paginação"
      style={{ fontFamily: 'var(--mp-font-body)' }}
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '44px',
          minHeight: '44px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          borderRadius: 'var(--mp-radius-full)',
          border: '1px solid var(--mp-border-default)',
          backgroundColor: 'var(--mp-bg-elevated)',
          color: page <= 1 ? 'var(--mp-text-muted)' : 'var(--mp-text-default)',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
          opacity: page <= 1 ? 0.5 : 1,
          transition: 'background-color 200ms ease, border-color 200ms ease, transform 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (page > 1) {
            e.currentTarget.style.backgroundColor = 'var(--mp-bg-muted)'
            e.currentTarget.style.borderColor = 'var(--mp-border-hover)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--mp-bg-elevated)'
          e.currentTarget.style.borderColor = 'var(--mp-border-default)'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ marginRight: '4px' }}
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                  fontSize: '0.875rem',
                  color: 'var(--mp-text-muted)',
                }}
                aria-hidden="true"
              >
                …
              </span>
            )
          }

          const isActive = pageNum === page

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Página ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                borderRadius: 'var(--mp-radius-full)',
                border: isActive ? 'none' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--mp-accent)' : 'transparent',
                color: isActive ? 'var(--mp-text-on-accent)' : 'var(--mp-text-default)',
                cursor: 'pointer',
                transition: 'background-color 200ms ease, color 200ms ease, transform 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--mp-bg-muted)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {pageNum}
            </button>
          )
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página seguinte"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '44px',
          minHeight: '44px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          borderRadius: 'var(--mp-radius-full)',
          border: '1px solid var(--mp-border-default)',
          backgroundColor: 'var(--mp-bg-elevated)',
          color: page >= totalPages ? 'var(--mp-text-muted)' : 'var(--mp-text-default)',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          opacity: page >= totalPages ? 0.5 : 1,
          transition: 'background-color 200ms ease, border-color 200ms ease, transform 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (page < totalPages) {
            e.currentTarget.style.backgroundColor = 'var(--mp-bg-muted)'
            e.currentTarget.style.borderColor = 'var(--mp-border-hover)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--mp-bg-elevated)'
          e.currentTarget.style.borderColor = 'var(--mp-border-default)'
        }}
      >
        <span className="hidden sm:inline">Próxima</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ marginLeft: '4px' }}
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  )
}
