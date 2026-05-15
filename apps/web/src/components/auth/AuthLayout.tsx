import type { SiteConfig } from '@/lib/sites'

interface AuthLayoutProps {
  site: SiteConfig
  children: React.ReactNode
}

/**
 * Layout wrapper para páginas de autenticação.
 * Aplica branding dinâmico baseado no site/tenant.
 */
export function AuthLayout({ site, children }: AuthLayoutProps) {
  const bgColor = site.theme.backgroundColor ?? '#0a0a0a'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="font-head text-2xl font-bold mb-2"
            style={
              site.theme.gradientMain
                ? {
                    background: site.theme.gradientMain,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }
                : { color: site.theme.primaryColor }
            }
          >
            {site.displayName}
          </div>
          <p className="text-text-secondary text-sm">
            {site.id === 'platform'
              ? 'Acesso ao painel administrativo'
              : `Acesse sua conta no ${site.displayName}`}
          </p>
        </div>

        {children}

        <div className="mt-4 text-center">
          <a
            href={site.id === 'platform' ? '/' : `/${site.slug}`}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            ← Voltar
          </a>
        </div>
      </div>
    </div>
  )
}
