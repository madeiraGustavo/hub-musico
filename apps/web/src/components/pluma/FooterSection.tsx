// Server Component — sem props
export const NAV_SECTIONS = [
  { label: "Início", href: "#hero" },
  { label: "Por que Pluma", href: "#features" },
  { label: "Pluma Answers", href: "#chat" },
  { label: "Segurança", href: "#security" },
  { label: "Experimente", href: "#cta" },
]

export const LEGAL_LINKS = [
  { label: "Política de Privacidade", href: "/pluma/privacidade" },
  { label: "Termos de Uso", href: "/pluma/termos" },
]

export function FooterSection(): JSX.Element {

  return (
    <footer className="bg-[#050706] text-[#EBE8D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Logo / Nome */}
          <div>
            <span className="text-xl font-semibold text-[#EBE8D8]">Pluma</span>
          </div>

          {/* Navegação interna */}
          <nav aria-label="Navegação do rodapé">
            <ul className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6">
              {NAV_SECTIONS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-[#EBE8D8] hover:text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E8F86]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Links legais */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {LEGAL_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#EBE8D8] hover:text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E8F86]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-[rgba(235,232,216,0.12)] pt-6">
          <p className="text-xs text-[#EBE8D8] opacity-60">
            © {new Date().getFullYear()} Pluma. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
