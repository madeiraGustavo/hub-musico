import Link from 'next/link'

const PROJECTS = [
  { title: 'Cobertura Comercial', description: 'Shopping Center' },
  { title: 'Toldo Retrátil', description: 'Restaurante' },
  { title: 'Lona Industrial', description: 'Galpão Logístico' },
  { title: 'Capota Náutica', description: 'Marina' },
]

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
]

function ProjectPlaceholderSVG({ gradient }: { gradient: string }) {
  return (
    <div
      style={{
        aspectRatio: '4/3',
        background: gradient,
        borderRadius: 'var(--mp-radius-md) var(--mp-radius-md) 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        {/* Simple architectural/construction icon */}
        <rect x="12" y="28" width="40" height="24" rx="2" fill="rgba(255,255,255,0.3)" />
        <polygon points="32,8 8,28 56,28" fill="rgba(255,255,255,0.4)" />
        <rect x="26" y="38" width="12" height="14" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="14" y="32" width="8" height="8" rx="1" fill="rgba(255,255,255,0.25)" />
        <rect x="42" y="32" width="8" height="8" rx="1" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  )
}

export function ProjectsSection() {
  return (
    <section className="mp-section">
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 var(--mp-content-padding)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h2 className="mp-heading-2" style={{ marginBottom: '8px' }}>
              Nossos Projetos
            </h2>
            <p
              style={{
                fontFamily: 'var(--mp-font-body)',
                fontSize: '1rem',
                color: 'var(--mp-text-secondary)',
                margin: 0,
              }}
            >
              Conheça alguns dos projetos que realizamos para nossos clientes
            </p>
          </div>
          <Link
            href="/marketplace"
            style={{
              fontFamily: 'var(--mp-font-body)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: 'var(--mp-text-accent)',
              textDecoration: 'none',
              transition: 'opacity 200ms ease',
            }}
          >
            Ver Todos →
          </Link>
        </div>

        {/* Projects Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '24px',
          }}
          className="mp-projects-grid"
        >
          {PROJECTS.map((project, index) => (
            <article
              key={project.title}
              className="mp-card"
              style={{ overflow: 'hidden', cursor: 'pointer' }}
            >
              <ProjectPlaceholderSVG gradient={GRADIENTS[index] ?? GRADIENTS[0]!} />
              <div style={{ padding: '16px 20px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--mp-font-heading)',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: 'var(--mp-text-default)',
                    margin: '0 0 4px',
                  }}
                >
                  {project.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--mp-font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--mp-text-secondary)',
                    margin: 0,
                  }}
                >
                  {project.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
