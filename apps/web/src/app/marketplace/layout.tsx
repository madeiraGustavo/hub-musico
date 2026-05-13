import type { Metadata } from 'next'

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
      <header className="border-b border-border-default bg-bg-surface sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/marketplace" className="text-lg font-semibold text-text-default">
            Marketplace
          </a>
          <nav className="flex items-center gap-4">
            <a href="/marketplace/cart" className="text-sm text-text-muted hover:text-text-default transition-colors">
              Carrinho
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
