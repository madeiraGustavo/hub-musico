import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchProducts, fetchCategories } from '@/lib/marketplace/api'
import { generateHomeMetadata } from '@/lib/marketplace/metadata'
import { HeroSection } from '@/components/marketplace/HeroSection'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { SocialProofSection } from '@/components/marketplace/SocialProofSection'
import { ProjectsSection } from '@/components/marketplace/ProjectsSection'
import { TrustBadges } from '@/components/marketplace/TrustBadges'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { SkeletonCard } from '@/components/marketplace/SkeletonCard'
import { LocalBusinessJsonLd, BreadcrumbJsonLd } from '@/components/marketplace/JsonLd'
import { CatalogSection } from './CatalogSection'

export function generateMetadata(): Metadata {
  return generateHomeMetadata()
}

export default async function MarketplacePage() {
  const [productsRes, categories] = await Promise.all([
    fetchProducts({ pageSize: 12 }),
    fetchCategories(),
  ])

  const products = productsRes.data

  return (
    <>
      {/* Structured Data */}
      <LocalBusinessJsonLd
        name="Toldos Colibri"
        address="Rio Pomba, MG — Brasil"
        telephone="(32) 98432-7514"
        openingHours={['Mo-Fr 08:00-18:00', 'Sa 08:00-12:00']}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Toldos Colibri', url: 'https://toldoscolibri.com.br/marketplace' },
        ]}
      />

      {/* Hero Section */}
      <HeroSection
        title="Toldos & Coberturas Sob Medida"
        subtitle="Fabricação e instalação de toldos, coberturas de policarbonato, lonas e estruturas metálicas. Qualidade industrial com atendimento personalizado."
        ctaPrimary={{ label: 'Ver Catálogo', href: '#catalogo' }}
        ctaSecondary={{ label: 'Solicitar Orçamento', href: '#orcamento' }}
        socialProof={{ count: 500, label: 'projetos entregues' }}
        categories={categories}
      />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Catalog Section (Client Component for search/filter interactivity) */}
      <section id="catalogo" className="mp-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="mp-heading-2">Nossos Produtos</h2>
            <p style={{ color: 'var(--mp-text-secondary)', marginTop: '8px', fontSize: '1.125rem' }}>
              Encontre o produto certo para o seu próximo projeto
            </p>
          </div>

          <Suspense fallback={<CatalogSkeleton />}>
            <CatalogSection
              initialProducts={products}
              categories={categories}
            />
          </Suspense>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProofSection />

      {/* Projects */}
      <ProjectsSection />
    </>
  )
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
