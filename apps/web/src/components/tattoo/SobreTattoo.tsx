import type { Artist } from '@hub-musico/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { GradientText } from '@/lib/profile/GradientText'

interface Props {
  artist: Artist
}

export function SobreTattoo({ artist }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]

  return (
    <section id="sobre" className="py-[120px]" style={{ background: 'var(--profile-bg-surface)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">

          {/* Placeholder de foto */}
          <div className="relative">
            <div className="w-full aspect-square max-w-[420px] rounded-lg flex items-center justify-center overflow-hidden relative"
              style={{ background: 'var(--profile-bg-card)', border: '1px solid var(--profile-accent-border)' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="absolute bottom-4 text-xs" style={{ color: 'var(--profile-text-secondary)' }}>
                Foto do artista
              </p>
            </div>

            <div className="absolute bottom-[-16px] right-[-16px] rounded-md px-4 py-3
              flex items-center gap-2 text-sm font-medium shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              style={{ background: 'var(--profile-bg-card)', border: '1px solid var(--profile-accent-border)', color: 'var(--profile-text)' }}>
              <span style={{ color: 'var(--profile-accent)' }}>✦</span>
              <span>Disponível para sessões</span>
            </div>
          </div>

          {/* Texto */}
          <div>
            <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase mb-3"
              style={{ color: 'var(--profile-accent)' }}>
              Sobre mim
            </p>
            <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15] mb-4"
              style={{ color: 'var(--profile-text)' }}>
              {config.aboutTitle}<br />
              <GradientText gradient="var(--profile-gradient)">{config.aboutSubtitle}</GradientText>
            </h2>

            {artist.bio.map((paragraph, i) => (
              <p key={i} className="leading-[1.75] mb-4" style={{ color: 'var(--profile-text-secondary)' }}>
                {paragraph}
              </p>
            ))}

            <div className="flex flex-wrap gap-2 mb-6">
              {artist.skills.map(skill => (
                <span key={skill}
                  className="px-3.5 py-1.5 rounded-[20px] text-xs font-medium transition-all cursor-default"
                  style={{
                    background: 'var(--profile-accent-dim)',
                    border:     '1px solid var(--profile-accent-border)',
                    color:      'var(--profile-accent)',
                  }}>
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {artist.tools.map(tool => (
                <span key={tool}
                  className="px-4 py-2 rounded-sm text-xs font-medium"
                  style={{
                    background: 'var(--profile-bg-card)',
                    border:     '1px solid rgba(255,255,255,0.07)',
                    color:      'var(--profile-text-secondary)',
                  }}>
                  {tool}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
