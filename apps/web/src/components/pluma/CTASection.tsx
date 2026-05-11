// Server Component — sem props
export const BENEFITS = [
  "✓ 14 dias grátis, sem cartão de crédito",
  "✓ Conecta com mais de 200 bancos via Open Finance",
  "✓ Cancele quando quiser, sem burocracia",
] as const

export function CTASection(): JSX.Element {
  return (
    <section id="cta" className="bg-[#050706] overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-[#2E8F86]" />

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
        {/* Left: big text */}
        <div className="px-6 lg:px-12 py-16 lg:py-24 border-r border-[#EBE8D8]/10 flex flex-col justify-between">
          <p className="text-[#2E8F86] text-xs tracking-[0.3em] uppercase mb-8">
            Comece agora
          </p>
          <h2 className="font-[family-name:var(--font-anton)] text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-tight text-[#EBE8D8] uppercase">
            EXPERIMENTE<br />
            O PLUMA<br />
            <span className="text-[#2E8F86]">GRÁTIS.</span>
          </h2>
        </div>

        {/* Right: benefits + CTA */}
        <div className="px-6 lg:px-12 py-16 lg:py-24 flex flex-col justify-between">
          <ul className="flex flex-col gap-6 mb-12">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-4 border-b border-[#EBE8D8]/10 pb-6">
                <span className="text-[#2E8F86] font-bold text-lg leading-none mt-0.5">✓</span>
                <span className="text-[#EBE8D8] text-base lg:text-lg leading-snug">
                  {benefit.replace('✓ ', '')}
                </span>
              </li>
            ))}
          </ul>

          <a
            href="/register"
            className="inline-block bg-[#2E8F86] text-[#050706] px-8 py-5 text-sm font-bold tracking-widest uppercase hover:bg-[#EBE8D8] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBE8D8] self-start"
          >
            Teste grátis por 14 dias
          </a>
        </div>
      </div>

      {/* Bottom big text */}
      <div className="border-t border-[#EBE8D8]/10 px-6 lg:px-12 py-8 overflow-hidden">
        <p className="font-[family-name:var(--font-anton)] text-[clamp(3rem,10vw,10rem)] leading-none text-[#EBE8D8]/5 uppercase whitespace-nowrap select-none">
          PLUMA — ASSISTENTE FINANCEIRO COM IA
        </p>
      </div>
    </section>
  )
}
