import type { Artist } from '@hub-musico/types'

interface Props {
  artist: Artist
}

// Posts recentes simulados — em produção seriam puxados via Instagram Basic Display API
// com token OAuth armazenado no Supabase (Fase 6)
const RECENT_POSTS = [
  { id: 1, bg: 'rgba(201,169,110,0.08)' },
  { id: 2, bg: 'rgba(255,255,255,0.04)' },
  { id: 3, bg: 'rgba(201,169,110,0.05)' },
  { id: 4, bg: 'rgba(255,255,255,0.03)' },
  { id: 5, bg: 'rgba(201,169,110,0.06)' },
  { id: 6, bg: 'rgba(255,255,255,0.04)' },
]

export function InstagramCTA({ artist }: Props) {
  const ig = artist.social['instagram'] ?? 'martt_atoo'
  const igUrl = `https://instagram.com/${ig}`

  return (
    <section style={{ background: '#0d0d0d', padding: '100px 0' }}>
      <div className="max-w-[1200px] mx-auto px-8">

        {/* Top divider */}
        <div
          className="w-full h-px mb-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.3), transparent)' }}
        />

        <div className="grid grid-cols-[1fr_1.2fr] gap-20 items-center max-lg:grid-cols-1 max-lg:gap-12">

          {/* Left — text */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-6 h-px" style={{ background: '#c9a96e' }} />
              <span
                className="text-[0.7rem] font-bold tracking-[0.2em] uppercase"
                style={{ color: '#c9a96e' }}
              >
                Instagram
              </span>
            </div>

            <h2
              className="font-head font-bold leading-[1.1] tracking-[-0.02em] mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#f5f5f5' }}
            >
              Acompanhe o{' '}
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                processo
              </span>
            </h2>

            <p
              className="text-[0.95rem] leading-[1.8] mb-8"
              style={{ color: '#a0a0a0' }}
            >
              Novos trabalhos, bastidores das sessões e disponibilidade de agenda.
              Tudo no Instagram.
            </p>

            {/* Stats row */}
            <div
              className="flex gap-8 mb-10 pb-8"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              {[
                { value: '800+', label: 'Publicações' },
                { value: '2k+',  label: 'Seguidores' },
                { value: '100%', label: 'Trabalhos reais' },
              ].map(stat => (
                <div key={stat.label}>
                  <div
                    className="font-head text-xl font-bold"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-sm font-semibold text-sm transition-all hover:translate-y-[-2px]"
              style={{
                background: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                color: '#0d0d0d',
                boxShadow: '0 4px 24px rgba(201,169,110,0.25)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              Seguir @{ig}
            </a>
          </div>

          {/* Right — preview grid */}
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {RECENT_POSTS.map(post => (
                <a
                  key={post.id}
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-sm overflow-hidden flex items-center justify-center transition-all hover:scale-[0.98]"
                  style={{
                    background: post.bg,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Placeholder icon */}
                  <svg
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(201,169,110,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-all group-hover:stroke-[rgba(201,169,110,0.5)]"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="rgba(201,169,110,0.2)" stroke="none"/>
                  </svg>

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: 'rgba(201,169,110,0.08)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: '#c9a96e' }}>Ver →</span>
                  </div>
                </a>
              ))}
            </div>

            <p
              className="text-center text-xs mt-4"
              style={{ color: '#444' }}
            >
              Clique para ver os trabalhos reais no Instagram
            </p>
          </div>

        </div>

        {/* Bottom divider */}
        <div
          className="w-full h-px mt-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.3), transparent)' }}
        />

      </div>
    </section>
  )
}
