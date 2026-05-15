/**
 * TrustBadges — Badges de confiança para o marketplace Toldos Colibri.
 * Exibe garantias, diferenciais e credibilidade da empresa.
 */

const badges = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Garantia de Fábrica',
    description: 'Todos os produtos com garantia contra defeitos de fabricação',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Entrega e Instalação',
    description: 'Equipe própria para entrega e instalação profissional',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Orçamento Grátis',
    description: 'Orçamento sem compromisso via WhatsApp ou telefone',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: '15+ Anos de Mercado',
    description: 'Experiência comprovada em toldos e coberturas',
  },
]

export function TrustBadges() {
  return (
    <section className="mp-section" style={{ backgroundColor: 'var(--mp-bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center p-6 rounded-lg transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: 'var(--mp-bg-elevated)', border: '1px solid var(--mp-border-default)' }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-sm mb-4"
                style={{ backgroundColor: 'rgba(212, 160, 23, 0.1)', color: 'var(--mp-accent)' }}
              >
                {badge.icon}
              </div>
              <h3
                className="text-sm font-bold uppercase tracking-wide mb-1"
                style={{ fontFamily: 'var(--mp-font-heading)', color: 'var(--mp-text-default)' }}
              >
                {badge.title}
              </h3>
              <p className="text-xs" style={{ color: 'var(--mp-text-secondary)' }}>
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
