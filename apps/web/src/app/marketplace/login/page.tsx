import { SITES } from '@/lib/sites'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

const site = SITES.marketplace!

export const metadata = {
  title: `Login — ${site.displayName}`,
}

export default function MarketplaceLoginPage() {
  return (
    <AuthLayout site={site}>
      <LoginForm site={site} />
    </AuthLayout>
  )
}
