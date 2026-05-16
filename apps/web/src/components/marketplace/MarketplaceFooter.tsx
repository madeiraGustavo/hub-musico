/**
 * MarketplaceFooter — Full footer with company info, navigation links,
 * contact details, and business hours.
 * Semantic <footer> element with responsive multi-column layout.
 */
export function MarketplaceFooter() {
  return (
    <footer
      className="mt-auto"
      style={{
        backgroundColor: 'var(--mp-bg-dark)',
        color: 'var(--mp-text-on-dark)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-10">
        {/* Main columns grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div>
            <h2
              className="text-xl font-bold mb-3"
              style={{ fontFamily: 'var(--mp-font-heading)' }}
            >
              Toldos Colibri
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--mp-text-muted)' }}
            >
              Fabricação e instalação de toldos, coberturas e lonas sob medida.
              Qualidade e durabilidade para seu projeto comercial ou residencial.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <nav aria-label="Links do rodapé">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Navegação
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/marketplace"
                  className="mp-footer-link text-sm"
                  style={{ color: 'var(--mp-text-muted)' }}
                >
                  Catálogo
                </a>
              </li>
              <li>
                <a
                  href="/marketplace#categorias"
                  className="mp-footer-link text-sm"
                  style={{ color: 'var(--mp-text-muted)' }}
                >
                  Categorias
                </a>
              </li>
              <li>
                <a
                  href="/marketplace/checkout"
                  className="mp-footer-link text-sm"
                  style={{ color: 'var(--mp-text-muted)' }}
                >
                  Orçamento
                </a>
              </li>
            </ul>
          </nav>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Contato
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--mp-text-muted)' }}>
              <li className="flex items-center gap-2">
                <PhoneIcon />
                <span>(11) 9999-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <EmailIcon />
                <span>contato@toldoscolibri.com.br</span>
              </li>
              <li className="flex items-start gap-2">
                <LocationIcon className="mt-0.5 shrink-0" />
                <span>São Paulo, SP — Brasil</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Business Hours */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Horário de Funcionamento
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--mp-text-muted)' }}>
              <li className="flex justify-between">
                <span>Seg — Sex</span>
                <span>08:00 — 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado</span>
                <span>08:00 — 12:00</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo</span>
                <span>Fechado</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 text-center text-sm"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--mp-text-muted)',
          }}
        >
          © 2024 Toldos Colibri. Todos os direitos reservados.
        </div>
      </div>

      {/* Scoped hover styles for footer links */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .mp-footer-link {
              transition: color 200ms ease;
            }
            .mp-footer-link:hover {
              color: var(--mp-accent) !important;
            }
          `,
        }}
      />
    </footer>
  )
}

/* ─── Inline SVG Icons ─── */

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
