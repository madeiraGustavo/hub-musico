/**
 * Breadcrumb — hierarchical navigation component.
 * Renders a semantic nav with ordered list of links.
 * The last item is the current page (non-clickable, aria-current="page").
 *
 * Requirements: 2.4, 15.4
 */

import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string // undefined = current page (not clickable)
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="select-none"
                  style={{ color: 'var(--mp-text-muted)' }}
                >
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors duration-150 hover:underline"
                  style={{ color: 'var(--mp-text-muted)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  style={{ color: 'var(--mp-text-default)', fontWeight: 500 }}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
