import type { ArtistTestimonial, ArtistType } from '@hub-musico/types'
import type { ProfileConfig } from '@/lib/profile/profileConfig'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { GradientText } from '@/lib/profile/GradientText'

interface Props {
  testimonials: ArtistTestimonial[]
  profileType?: ArtistType
  palette?:     ProfileConfig['palette']
}

export function Depoimentos({
  testimonials,
  profileType = 'musician',
  palette     = PROFILE_CONFIG.musician.palette,
}: Props) {
  return (
    <section style={{ background: palette.bgSurface, padding: '120px 0' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase mb-3"
            style={{ color: palette.accent }}>
            Clientes
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]"
            style={{ color: palette.text }}>
            O que dizem{' '}
            <GradientText gradient={palette.gradient}>sobre mim</GradientText>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {testimonials.map(dep => (
            <div key={dep.id} className="rounded-lg p-7 transition-all hover:translate-y-[-4px]"
              style={{
                background: palette.bgCard,
                border:     `1px solid ${palette.accentBorder}`,
              }}>
              <div className="tracking-[2px] mb-4" style={{ color: '#ffd700' }}>★★★★★</div>
              <p className="text-[0.9rem] leading-[1.7] mb-5 italic" style={{ color: palette.textSecondary }}>
                {dep.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: dep.gradient, color: '#fff' }}>
                  {dep.initials}
                </div>
                <div>
                  <strong className="block text-sm mb-0.5" style={{ color: palette.text }}>{dep.author}</strong>
                  <span className="text-xs" style={{ color: palette.textSecondary }}>{dep.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
