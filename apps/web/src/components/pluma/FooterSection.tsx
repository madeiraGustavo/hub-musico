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
    <footer className="bg-[#050706] border-t border-[#EBE8D8]/10">
      <div className="px-6 lg:px-12 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Logo */}
        <div>
          <span className="font-[family-name:var(--font-anton)] text-2xl text-[#EBE8D8] tracking-tight uppercase">
            Pluma
          </span>
          <p className="text-[#EBE8D8]/40 text-xs mt-2 tracking-widest uppercase">
            Assistente Financeiro com IA
          </p>
        </div>

        {/* Nav */}
        <nav aria-label="Navegação do rodapé">
          <ul className="flex flex-col gap-3">
            {NAV_SECTIONS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-xs text-[#EBE8D8]/60 hover:text-[#2E8F86] tracking-widest uppercase transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E8F86]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal */}
        <div className="flex flex-col gap-3">
          {LEGAL_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#EBE8D8]/60 hover:text-[#2E8F86] tracking-widest uppercase transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E8F86]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#EBE8D8]/10 px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[#EBE8D8]/30 text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} Pluma
        </p>
        <p className="text-[#EBE8D8]/20 text-xs tracking-widest uppercase">
          Todos os direitos reservados
        </p>
      </div>
    </footer>
  )
}
