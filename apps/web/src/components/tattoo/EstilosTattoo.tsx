import type { Artist } from '@hub-musico/types'

interface Props {
  artist: Artist
}

const ESTILOS_DEFAULT = [
  {
    title: 'Fine Line',
    subtitle: 'Traços delicados e precisos',
    description: 'Linhas finas com alta precisão. Ideal para florais, retratos e designs minimalistas com muito detalhe.',
    icon: '—',
  },
  {
    title: 'Blackwork',
    subtitle: 'Preto sólido e impactante',
    description: 'Composições em preto puro com alto contraste. Geométricos, tribais e ornamentais com presença marcante.',
    icon: '■',
  },
  {
    title: 'Pontilhismo',
    subtitle: 'Textura e profundidade',
    description: 'Técnica de pontos que cria gradientes e texturas únicas. Cada peça é uma composição artesanal.',
    icon: '·',
  },
  {
    title: 'Geométrico',
    subtitle: 'Precisão matemática',
    description: 'Formas geométricas perfeitas, mandalas e padrões sagrados com simetria impecável.',
    icon: '◇',
  },
  {
    title: 'Minimalista',
    subtitle: 'Menos é mais',
    description: 'Designs limpos e intencionais. Cada elemento tem propósito — sem excessos, com muito significado.',
    icon: '○',
  },
  {
    title: 'Floral',
    subtitle: 'Natureza na pele',
    description: 'Flores, folhas e elementos botânicos com traço delicado. Fine line floral é uma das especialidades.',
    icon: '✿',
  },
]

export function EstilosTattoo({ artist }: Props) {
  const skills = artist.skills

  // Usa os estilos do artista se disponíveis, senão usa os defaults
  const estilos = ESTILOS_DEFAULT.filter(e =>
    skills.length === 0 || skills.some(s => s.toLowerCase().includes(e.title.toLowerCase()))
  )

  return (
    <section id="estilos" style={{ background: '#111111', padding: '120px 0' }}>
      <div className="max-w-[1200px] mx-auto px-8">

        {/* Header */}
        <div className="max-w-[560px] mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-6 h-px" style={{ background: '#c9a96e' }} />
            <span
              className="text-[0.7rem] font-bold tracking-[0.2em] uppercase"
              style={{ color: '#c9a96e' }}
            >
              Especialidades
            </span>
          </div>
          <h2
            className="font-head font-bold leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#f5f5f5' }}
          >
            Estilos que{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              domino
            </span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-px max-lg:grid-cols-2 max-sm:grid-cols-1"
          style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          {estilos.map((estilo, i) => (
            <div
              key={estilo.title}
              className="group p-8 transition-all duration-300 relative"
              style={{
                background: '#111111',
                borderRight: i % 3 !== 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                borderBottom: i < estilos.length - 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* Hover fill */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'rgba(201,169,110,0.04)' }}
              />

              {/* Icon */}
              <div
                className="text-2xl font-light mb-5 leading-none"
                style={{ color: 'rgba(201,169,110,0.5)' }}
              >
                {estilo.icon}
              </div>

              {/* Title */}
              <h3
                className="font-head text-lg font-bold mb-1 transition-colors duration-300 group-hover:text-[#c9a96e]"
                style={{ color: '#f5f5f5' }}
              >
                {estilo.title}
              </h3>

              {/* Subtitle */}
              <p
                className="text-xs uppercase tracking-[0.1em] mb-3"
                style={{ color: '#c9a96e', opacity: 0.7 }}
              >
                {estilo.subtitle}
              </p>

              {/* Description */}
              <p
                className="text-sm leading-[1.7]"
                style={{ color: '#666' }}
              >
                {estilo.description}
              </p>

              {/* Bottom accent line on hover */}
              <div
                className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500"
                style={{ background: 'linear-gradient(90deg, #c9a96e, transparent)' }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
