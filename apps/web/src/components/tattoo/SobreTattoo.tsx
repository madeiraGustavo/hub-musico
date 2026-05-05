import type { Artist } from '@hub-musico/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'

interface Props {
  artist: Artist
}

export function SobreTattoo({ artist }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]
  const ig = artist.social['instagram'] ?? 'martt_atoo'

  return (
    <section id="sobre" style={{ background: '#111111', padding: '120px 0' }}>
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-2 gap-20 items-center max-lg:grid-cols-1 max-lg:gap-12">

          {/* Left — artist photo placeholder with frame */}
          <div className="relative">
            {/* Decorative corner frame */}
            <div className="relative">
              {/* Gold corner accents */}
              <div className="absolute top-[-8px] left-[-8px] w-8 h-8 pointer-events-none"
                style={{
                  borderTop: '2px solid #c9a96e',
                  borderLeft: '2px solid #c9a96e',
                }} />
              <div className="absolute bottom-[-8px] right-[-8px] w-8 h-8 pointer-events-none"
                style={{
                  borderBottom: '2px solid #c9a96e',
                  borderRight: '2px solid #c9a96e',
                }} />

              {/* Photo area */}
              <div
                className="w-full aspect-[3/4] max-w-[400px] rounded-sm overflow-hidden relative flex items-center justify-center"
                style={{
                  background: 'linear-gradient(160deg, #1a1a1a 0%, #141414 100%)',
                  border: '1px solid rgba(201,169,110,0.2)',
                }}
              >
                {/* Placeholder — substituir por <Image> quando tiver foto real */}
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#c9a96e' }}>
                    Foto do artista
                  </span>
                </div>

                {/* Grain overlay */}
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '150px',
                  }}
                />
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute bottom-[-20px] right-[20px] px-5 py-3 rounded-sm flex items-center gap-2 text-sm font-medium"
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(201,169,110,0.35)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ color: '#c9a96e' }}>●</span>
              <span style={{ color: '#f5f5f5' }}>Disponível para sessões</span>
            </div>
          </div>

          {/* Right — text */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="block w-6 h-px" style={{ background: '#c9a96e' }} />
              <span
                className="text-[0.7rem] font-bold tracking-[0.2em] uppercase"
                style={{ color: '#c9a96e' }}
              >
                Sobre mim
              </span>
            </div>

            <h2
              className="font-head font-bold leading-[1.1] tracking-[-0.02em] mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#f5f5f5' }}
            >
              {config.aboutTitle}
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {config.aboutSubtitle}
              </span>
            </h2>

            {artist.bio.map((paragraph, i) => (
              <p
                key={i}
                className="leading-[1.8] mb-4 text-[0.95rem]"
                style={{ color: '#a0a0a0' }}
              >
                {paragraph}
              </p>
            ))}

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-8 mb-6">
              {artist.skills.map(skill => (
                <span
                  key={skill}
                  className="px-4 py-1.5 rounded-sm text-xs font-medium tracking-wide"
                  style={{
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.25)',
                    color: '#c9a96e',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Tools */}
            <div className="flex flex-wrap gap-2 mb-8">
              {artist.tools.map(tool => (
                <span
                  key={tool}
                  className="px-4 py-1.5 rounded-sm text-xs"
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#666',
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>

            {/* Instagram link */}
            <a
              href={`https://instagram.com/${ig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
              style={{ color: '#c9a96e' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              Ver trabalhos no Instagram
              <span>→</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
