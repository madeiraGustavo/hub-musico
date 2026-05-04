'use client'

import type { ProfileConfig } from '@/lib/profile/profileConfig'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { GradientText } from '@/lib/profile/GradientText'

const DEFAULT_NAV = [
  { href: '#sobre',    label: 'Sobre' },
  { href: '#musicas',  label: 'Músicas' },
  { href: '#projetos', label: 'Projetos' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#contato',  label: 'Contato' },
]

const SOCIAL = [
  { href: '#', label: 'Instagram', abbr: 'IG' },
  { href: '#', label: 'YouTube',   abbr: 'YT' },
  { href: '#', label: 'SoundCloud',abbr: 'SC' },
  { href: '#', label: 'Spotify',   abbr: 'SP' },
]

interface FooterProps {
  artistName?: string
  navLinks?:   Array<{ href: string; label: string }>
  palette?:    ProfileConfig['palette']
}

export function Footer({
  artistName = 'MAX SOUZA',
  navLinks   = DEFAULT_NAV,
  palette    = PROFILE_CONFIG.musician.palette,
}: FooterProps) {
  // ID único por instância para isolar os estilos de hover
  const id = `footer-${artistName.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <footer id={id} style={{ background: palette.bgSurface, borderTop: `1px solid ${palette.accentBorder}`, padding: '2rem 0' }}>

      {/* Estilos de hover isolados por ID — sem interferência entre perfis */}
      <style dangerouslySetInnerHTML={{ __html: `
        #${id} .footer-link { color: ${palette.textSecondary}; transition: color 0.2s; }
        #${id} .footer-link:hover { color: ${palette.text}; }
        #${id} .footer-social {
          color: ${palette.textSecondary};
          border: 1px solid ${palette.accentBorder};
          background: transparent;
          transition: all 0.2s;
        }
        #${id} .footer-social:hover {
          color: ${palette.accent};
          background: ${palette.accentDim};
          border-color: ${palette.accent};
        }
      ` }} />

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between flex-wrap gap-6 mb-6">

          <div className="font-head text-xl font-bold tracking-wide">
            <GradientText gradient={palette.gradient}>{artistName}</GradientText>
          </div>

          <nav className="flex items-center gap-6 flex-wrap">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="footer-link text-sm">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {SOCIAL.map(s => (
              <a key={s.abbr} href={s.href} aria-label={s.label}
                className="footer-social text-xs font-semibold tracking-[0.06em] px-3 py-1.5 rounded-sm">
                {s.abbr}
              </a>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-5 text-xs max-sm:flex-col max-sm:gap-2 max-sm:text-center"
          style={{ borderTop: `1px solid ${palette.accentBorder}`, color: palette.textSecondary }}>
          <p>© 2026 {artistName}. Todos os direitos reservados.</p>
          <p>Juiz de Fora, MG 🇧🇷</p>
        </div>
      </div>
    </footer>
  )
}
