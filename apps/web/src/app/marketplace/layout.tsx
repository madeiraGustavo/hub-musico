import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader'
import { MarketplaceFooter } from '@/components/marketplace/MarketplaceFooter'
import { ToastContainer } from '@/components/marketplace/Toast'
import './marketplace.css'

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="marketplace min-h-screen flex flex-col">
      <MarketplaceHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        {children}
      </main>
      <MarketplaceFooter />
      <ToastContainer />
    </div>
  )
}
