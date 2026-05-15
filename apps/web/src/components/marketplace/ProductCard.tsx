import Link from 'next/link'

interface ProductCardProps {
  product: {
    id: string
    slug: string
    title: string
    description: string | null
    type: 'FIXED_PRICE' | 'QUOTE_ONLY'
    basePrice: number | null
    thumbnailUrl: string | null
    category?: { name: string; slug: string }
    widthCm?: number | null
    heightCm?: number | null
    material?: string | null
  }
}

function PlaceholderSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="placeholder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#placeholder-grad)" />
      {/* Stylized awning/canopy icon */}
      <path
        d="M120 180 L200 130 L280 180 L280 200 L120 200 Z"
        fill="#9CA3AF"
        opacity="0.6"
      />
      <path
        d="M130 200 L130 240 M270 200 L270 240"
        stroke="#9CA3AF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M140 180 L200 145 L260 180"
        stroke="#6B7280"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}

function DimensionsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M2 14 L14 14 M14 14 L14 2 M2 14 L2 12 M14 14 L12 14 M14 2 L12 2 M14 2 L14 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MaterialIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5 flex-shrink-0"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 6 L14 6 M6 2 L6 14"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

function formatDimensions(
  widthCm: number | null | undefined,
  heightCm: number | null | undefined
): string | null {
  if (widthCm && heightCm) return `${widthCm} × ${heightCm} cm`
  if (widthCm) return `${widthCm} cm (L)`
  if (heightCm) return `${heightCm} cm (A)`
  return null
}

export function ProductCard({ product }: ProductCardProps) {
  const dimensions = formatDimensions(product.widthCm, product.heightCm)
  const hasSpecs = dimensions || product.material

  return (
    <Link
      href={`/marketplace/product/${product.slug}`}
      className="group block mp-card overflow-hidden"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <PlaceholderSvg />
        )}

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-full bg-white/90 backdrop-blur-sm border border-[var(--mp-border-default)] text-[var(--mp-text-secondary)]">
            {product.category.name}
          </span>
        )}

        {/* Hover overlay with "Ver Detalhes" button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none">
          <span className="px-4 py-2 text-sm font-semibold text-white bg-[var(--mp-accent)] rounded-full shadow-md">
            Ver Detalhes
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4">
        {/* Title */}
        <h3
          className="text-base leading-snug line-clamp-2 text-[var(--mp-text-default)]"
          style={{ fontFamily: 'var(--mp-font-heading)', fontWeight: 600 }}
        >
          {product.title}
        </h3>

        {/* Price */}
        <div className="mt-2">
          {product.type === 'FIXED_PRICE' && product.basePrice !== null ? (
            <p className="text-sm font-semibold text-[var(--mp-text-default)]">
              {formatPrice(product.basePrice)}
            </p>
          ) : (
            <p className="text-sm font-medium text-[var(--mp-text-accent)]">
              Sob consulta
            </p>
          )}
        </div>

        {/* Spec summary */}
        {hasSpecs && (
          <div className="mt-3 pt-3 border-t border-[var(--mp-border-default)] flex flex-wrap gap-3 text-xs text-[var(--mp-text-secondary)]">
            {dimensions && (
              <span className="inline-flex items-center gap-1">
                <DimensionsIcon />
                {dimensions}
              </span>
            )}
            {product.material && (
              <span className="inline-flex items-center gap-1">
                <MaterialIcon />
                {product.material}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
