// Server Component — sem props
export function HeroSection(): JSX.Element {
  return (
    <section id="hero" className="bg-[#050706] overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-[#EBE8D8]/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        <span className="text-[#EBE8D8] text-xs tracking-[0.3em] uppercase font-medium">
          Pluma
        </span>
        <span className="text-[#EBE8D8]/40 text-xs tracking-widest uppercase hidden md:block">
          Assistente Financeiro com IA
        </span>
        <a
          href="/register"
          className="text-[#EBE8D8] text-xs tracking-widest uppercase border border-[#EBE8D8]/30 px-4 py-2 hover:bg-[#EBE8D8] hover:text-[#050706] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E8F86]"
        >
          Entrar
        </a>
      </div>

      {/* Hero grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]">
        {/* Left: visual placeholder */}
        <div
          aria-hidden="true"
          className="relative bg-[#1C3F3A] flex items-end order-2 lg:order-1 min-h-[40vh] lg:min-h-0"
        >
          {/* Abstract financial grid pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-8 left-8 w-32 h-32 border border-[#2E8F86]" />
            <div className="absolute top-16 left-16 w-32 h-32 border border-[#EBE8D8]" />
            <div className="absolute bottom-24 right-8 w-48 h-1 bg-[#2E8F86]" />
            <div className="absolute bottom-32 right-8 w-32 h-1 bg-[#EBE8D8]" />
            <div className="absolute bottom-40 right-8 w-40 h-1 bg-[#2E8F86]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-[#2E8F86]/40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#EBE8D8]/20" />
          </div>
          {/* Big teal accent number */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#2E8F86] font-[family-name:var(--font-anton)] text-[20vw] lg:text-[12vw] leading-none opacity-30 select-none">
            R$
          </div>
          {/* Bottom label */}
          <div className="relative z-10 p-8 border-t border-[#EBE8D8]/10 w-full">
            <p className="text-[#EBE8D8]/60 text-xs tracking-widest uppercase">
              Conectado ao Open Finance do Banco Central
            </p>
          </div>
        </div>

        {/* Right: copy */}
        <div className="flex flex-col justify-between p-8 lg:p-12 order-1 lg:order-2 border-l border-[#EBE8D8]/10">
          <div>
            <p className="text-[#2E8F86] text-xs tracking-[0.3em] uppercase mb-8">
              Assistente Financeiro com IA
            </p>
            <h1 className="font-[family-name:var(--font-anton)] text-[clamp(4rem,10vw,9rem)] leading-[0.9] tracking-tight text-[#EBE8D8] mb-8 uppercase">
              SEU<br />
              DINHEIRO,<br />
              <span className="text-[#2E8F86]">FINALMENTE</span><br />
              CLARO.
            </h1>
          </div>

          <div>
            <p className="text-[#EBE8D8]/70 text-base lg:text-lg leading-relaxed mb-10 max-w-sm">
              Pluma conecta todas as suas contas, entende seus hábitos e responde suas dúvidas financeiras em linguagem humana.
            </p>
            <a
              href="/register"
              className="inline-block bg-[#2E8F86] text-[#050706] px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#EBE8D8] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBE8D8]"
            >
              Teste grátis por 14 dias
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
