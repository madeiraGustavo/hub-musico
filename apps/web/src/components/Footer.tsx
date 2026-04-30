const NAV_LINKS = [
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

export function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-[rgba(255,255,255,0.07)] py-8">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Linha principal — tudo horizontal */}
        <div className="flex items-center justify-between flex-wrap gap-6 mb-6">

          {/* Logo */}
          <div className="font-head text-xl font-bold tracking-wide bg-grad-main bg-clip-text text-transparent">
            MAX SOUZA
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-6 flex-wrap">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social */}
          <div className="flex items-center gap-2">
            {SOCIAL.map(s => (
              <a key={s.abbr} href={s.href} aria-label={s.label}
                className="text-xs font-semibold tracking-[0.06em] text-text-secondary px-3 py-1.5
                  border border-[rgba(255,255,255,0.07)] rounded-sm
                  hover:text-accent hover:border-[rgba(108,99,255,0.35)] hover:bg-accent-dim transition-all">
                {s.abbr}
              </a>
            ))}
          </div>

        </div>

        {/* Copyright */}
        <div className="flex justify-between items-center pt-5 border-t border-[rgba(255,255,255,0.07)]
          text-xs text-text-muted max-sm:flex-col max-sm:gap-2 max-sm:text-center">
          <p>© 2026 Max Souza Music. Todos os direitos reservados.</p>
          <p>Juiz de Fora, MG 🇧🇷</p>
        </div>

      </div>
    </footer>
  )
}
