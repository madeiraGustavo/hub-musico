import type { Metadata } from 'next'
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader'

export const metadata: Metadata = {
  title: 'Marketplace de Lonas | Arte Hub',
  description: 'Catálogo profissional de toldos, capotas, coberturas e lonas industriais.',
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <MarketplaceHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
