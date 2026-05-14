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
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
