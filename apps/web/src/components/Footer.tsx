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
    <footer className="bg-bg-surface border-t border-[rgba(255,255,255,0.07)] pt-[60px] pb-8">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="grid grid-cols-[1fr_auto_auto] gap-[60px] items-start mb-12 max-md:grid-cols-1 max-md:gap-8">
          <div>
            <div className="font-head text-2xl font-bold tracking-wide bg-grad-main bg-clip-text text-transparent mb-3">
              MAX SOUZA
            </div>
            <p className="text-sm text-text-muted max-w-[240px]">
              Baterista · Multi-instrumentista · Compositor · Juiz de Fora, MG 🇧🇷
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            {SOCIAL.map(s => (
              <a key={s.abbr} href={s.href} aria-label={s.label}
                className="text-xs font-semibold tracking-[0.06em] text-text-secondary px-3 py-1.5
                  border border-[rgba(255,255,255,0.07)] rounded-sm text-center
                  hover:text-accent hover:border-[rgba(108,99,255,0.35)] hover:bg-accent-dim transition-all">
                {s.abbr}
              </a>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-[rgba(255,255,255,0.07)]
          text-xs text-text-muted max-sm:flex-col max-sm:gap-2 max-sm:text-center">
          <p>© 2026 Max Souza Music. Todos os direitos reservados.</p>
          <p>Juiz de Fora, MG 🇧🇷</p>
        </div>

      </div>
    </footer>
  )
}
