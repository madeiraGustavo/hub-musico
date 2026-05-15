import type { Metadata } from 'next'
import { fetchProducts, fetchCategories } from '@/lib/marketplace/api'
import { generateCategoryMetadata } from '@/lib/marketplace/metadata'
import { Breadcrumb } from '@/components/marketplace/Breadcrumb'
import { BreadcrumbJsonLd } from '@/components/marketplace/JsonLd'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { PaginationControls } from '@/components/marketplace/PaginationControls'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { CategoryPageClient } from './CategoryPageClient'

interface PageProps {
  params: { slug: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categories = await fetchCategories()
  const category = categories.find((c) => c.slug === params.slug)
  if (!category) {
    return { title: 'Categoria não encontrada | Lonas SP', robots: 'noindex' }
  }
  return generateCategoryMetadata({
    name: category.name,
    slug: category.slug,
    description: category.description,
  })
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const categories = await fetchCategories()
  const category = categories.find((c) => c.slug === params.slug)

  if (!category) {
    return (
      <EmptyState
        icon="category"
        title="Categoria não encontrada"
        description="A categoria que você procura não existe ou foi removida."
        action={{ label: 'Voltar ao catálogo', href: '/marketplace' }}
      />
    )
  }

  const productsRes = await fetchProducts({ categoryId: category.id, page, pageSize: 20 })
  const products = productsRes.data
  const pagination = productsRes.pagination

  const breadcrumbItems = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: category.name },
  ]

  return (
    <>
      {/* Structured Data */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketplace', url: 'https://lonassp.com.br/marketplace' },
          { name: category.name, url: `https://lonassp.com.br/marketplace/category/${category.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mp-heading-2">{category.name}</h1>
        {category.description && (
          <p className="mt-2" style={{ color: 'var(--mp-text-secondary)' }}>
            {category.description}
          </p>
        )}
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <EmptyState
          icon="category"
          title="Nenhum produto nesta categoria"
          description="Ainda não há produtos disponíveis nesta categoria. Explore outras categorias."
          action={{ label: 'Ver catálogo completo', href: '/marketplace' }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  description: product.description,
                  type: product.type,
                  basePrice: product.basePrice,
                  thumbnailUrl: product.thumbnailUrl,
                  category: { name: category.name, slug: category.slug },
                  widthCm: product.widthCm,
                  heightCm: product.heightCm,
                  material: product.material,
                }}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <CategoryPageClient
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              categorySlug={params.slug}
            />
          )}
        </>
      )}
    </>
  )
}
