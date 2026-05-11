// Server Component — sem props
export function HeroSection(): JSX.Element {
  return (
    <section id="hero" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Coluna esquerda: copy */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1C3F3A] mb-4">
              ASSISTENTE FINANCEIRO COM IA
            </p>

            <h1
              className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight text-[#050706] mb-6"
            >
              Seu dinheiro,<br />
              finalmente<br />
              claro.
            </h1>

            <p className="text-base md:text-lg text-[#050706] font-normal leading-relaxed mb-8 max-w-md">
              Pluma conecta todas as suas contas, entende seus hábitos e responde suas dúvidas financeiras em linguagem humana.
            </p>

            <a
              href="/register"
              className="inline-block bg-[#1C3F3A] text-white rounded px-6 py-3 text-base font-semibold transition-colors duration-200 hover:bg-[#2E8F86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Teste grátis por 14 dias
            </a>
          </div>

          {/* Coluna direita: mockup do produto */}
          <div
            aria-hidden="true"
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#1C3F3A] via-[#2E8F86] to-[#EBE8D8] flex items-center justify-center"
          >
            {/* Card de chat simulado */}
            <div className="w-4/5 bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
              <div className="h-3 bg-white/40 rounded-full w-3/4" />
              <div className="h-3 bg-white/30 rounded-full w-full" />
              <div className="h-3 bg-white/30 rounded-full w-5/6" />
              <div className="mt-4 h-10 bg-[#EBE8D8]/20 rounded-lg flex items-center px-3">
                <div className="h-2 bg-white/30 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
