import type { Track } from '@hub-musico/types'
import { GradientText } from '@/lib/profile/GradientText'

interface Props {
  tracks: Track[]
}

export function EstilosTattoo({ tracks }: Props) {
  const estilos = tracks.length > 0 ? tracks : [
    { id: 0, title: 'Blackwork',   genreLabel: 'Geométrico',  genre: 'demo' as const, duration: '—', key: '—', src: null },
    { id: 1, title: 'Fine Line',   genreLabel: 'Delicado',    genre: 'demo' as const, duration: '—', key: '—', src: null },
    { id: 2, title: 'Old School',  genreLabel: 'Tradicional', genre: 'demo' as const, duration: '—', key: '—', src: null },
    { id: 3, title: 'Aquarela',    genreLabel: 'Colorido',    genre: 'demo' as const, duration: '—', key: '—', src: null },
    { id: 4, title: 'Realismo',    genreLabel: 'Retrato',     genre: 'demo' as const, duration: '—', key: '—', src: null },
    { id: 5, title: 'Minimalista', genreLabel: 'Clean',       genre: 'demo' as const, duration: '—', key: '—', src: null },
  ]

  return (
    <section id="estilos" className="py-[120px]" style={{ background: 'var(--profile-bg-surface)' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase mb-3"
            style={{ color: 'var(--profile-accent)' }}>
            Especialidades
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]"
            style={{ color: 'var(--profile-text)' }}>
            Estilos que{' '}
            <GradientText gradient="var(--profile-gradient)">domino</GradientText>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {estilos.map(estilo => (
            <div key={estilo.id}
              className="rounded-lg p-6 transition-all hover:translate-y-[-4px]"
              style={{
                background: 'var(--profile-bg-card)',
                border:     '1px solid var(--profile-accent-border)',
              }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
                style={{
                  background: 'var(--profile-accent-dim)',
                  border:     '1px solid var(--profile-accent-border)',
                  color:      'var(--profile-accent)',
                }}>
                ✦
              </div>
              <h3 className="font-head text-base font-bold mb-1" style={{ color: 'var(--profile-text)' }}>
                {estilo.title}
              </h3>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--profile-accent)' }}>
                {estilo.genreLabel}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
