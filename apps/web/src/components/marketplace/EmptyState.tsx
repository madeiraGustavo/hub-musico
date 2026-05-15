import Link from 'next/link'

interface EmptyStateProps {
  icon: 'cart' | 'search' | 'category' | 'product'
  title: string
  description: string
  action?: { label: string; href: string }
}

function CartIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      stroke="var(--mp-text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 10h8l6 36h32l6-24H24" />
      <circle cx="34" cy="56" r="4" />
      <circle cx="54" cy="56" r="4" />
      <path d="M24 22h40" strokeDasharray="4 4" opacity="0.5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      stroke="var(--mp-text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="36" cy="36" r="16" />
      <path d="M48 48l14 14" />
      <path d="M30 32l12 0" />
      <path d="M36 26v12" opacity="0.5" />
      <path d="M56 56l2 2" strokeWidth="3" />
    </svg>
  )
}

function CategoryIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      stroke="var(--mp-text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="12" y="12" width="22" height="22" rx="4" />
      <rect x="46" y="12" width="22" height="22" rx="4" />
      <rect x="12" y="46" width="22" height="22" rx="4" />
      <rect x="46" y="46" width="22" height="22" rx="4" opacity="0.5" strokeDasharray="4 4" />
    </svg>
  )
}

function ProductIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      stroke="var(--mp-text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 28l20-12 20 12v24l-20 12-20-12V28z" />
      <path d="M20 28l20 12 20-12" />
      <path d="M40 40v24" />
      <path d="M30 22l20 12" opacity="0.5" />
    </svg>
  )
}

const icons = {
  cart: CartIcon,
  search: SearchIcon,
  category: CategoryIcon,
  product: ProductIcon,
} as const

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const IconComponent = icons[icon]

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <IconComponent />
      <h3 className="mp-heading-3 mt-6">{title}</h3>
      <p className="mt-2 max-w-md" style={{ color: 'var(--mp-text-muted)' }}>
        {description}
      </p>
      {action && (
        <Link href={action.href} className="mp-btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  )
}
