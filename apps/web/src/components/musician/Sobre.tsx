import type { Artist } from '@hub-art/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { VinylSVG } from './VinylSVG'

interface Props {
  artist: Artist
}

export function Sobre({ artist }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]

  return (
    <section id="sobre" className="py-[120px] bg-bg-surface">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">

          {/* Vinil */}
          <div className="relative">
            <div className="w-full aspect-square max-w-[420px] bg-bg-elevated border border-[rgba(255,255,255,0.07)]
              rounded-lg flex items-center justify-center overflow-hidden relative
              before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(108,99,255,0.15),transparent_70%)]">
              <div className="drop-shadow-[0_0_32px_rgba(108,99,255,0.35)]">
                <VinylSVG />
              </div>
            </div>
            <div className="absolute bottom-[-16px] right-[-16px] bg-bg-elevated border border-[rgba(108,99,255,0.35)]
              rounded-md px-4 py-3 flex items-center gap-2 text-sm font-medium shadow-[0_4px_24px_rgba(0,0,0,0.4)]
              animate-pulse-glow">
              <svg className="text-accent" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Disponível para projetos</span>
            </div>
          </div>

          {/* Texto */}
          <div>
            <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase text-accent mb-3">
              Sobre mim
            </p>
            <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15] mb-4">
              {config.aboutTitle}<br />
              <span className="bg-grad-main bg-clip-text text-transparent">{config.aboutSubtitle}</span>
            </h2>

            {artist.bio.map((paragraph, i) => (
              <p key={i} className="text-text-secondary leading-[1.75] mb-4">{paragraph}</p>
            ))}

            <div className="flex flex-wrap gap-2 mb-6">
              {artist.skills.map(skill => (
                <span key={skill}
                  className="px-3.5 py-1.5 bg-accent-dim border border-[rgba(108,99,255,0.35)] rounded-[20px]
                    text-xs font-medium text-accent hover:bg-accent hover:text-white hover:translate-y-[-2px]
                    transition-all cursor-default">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {artist.tools.map(tool => (
                <span key={tool}
                  className="px-4 py-2 bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-sm
                    text-xs text-text-secondary font-medium">
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
