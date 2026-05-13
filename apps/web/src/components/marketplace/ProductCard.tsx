'use client'

interface Product {
  id: string
  slug: string
  title: string
  description: string | null
  price: number | null
  thumbnailUrl: string | null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <a
      href={`/marketplace/product/${product.slug}`}
      className="group block rounded-lg border border-border-default bg-bg-surface overflow-hidden hover:border-border-hover transition-colors"
    >
      <div className="aspect-[4/3] bg-bg-muted flex items-center justify-center">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-bg-muted flex items-center justify-center">
            <span className="text-text-muted text-xs">Sem imagem</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-text-default group-hover:text-text-accent transition-colors line-clamp-2">
          {product.title}
        </h3>
        {product.price !== null && (
          <p className="mt-1 text-sm font-semibold text-text-default">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </p>
        )}
        {product.price === null && (
          <p className="mt-1 text-xs text-text-muted">Sob consulta</p>
        )}
      </div>
    </a>
  )
}
