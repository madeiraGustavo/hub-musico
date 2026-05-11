// Server Component — sem props
export const BENEFITS = [
  "✓ 14 dias grátis, sem cartão de crédito",
  "✓ Conecta com mais de 200 bancos via Open Finance",
  "✓ Cancele quando quiser, sem burocracia",
] as const

export function CTASection(): JSX.Element {
  return (
    <section id="cta" className="bg-[#1C3F3A] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[720px] mx-auto text-center">
        <h2 className="text-5xl md:text-6xl text-white font-bold leading-tight mb-8">
          Comece a tomar decisões financeiras melhores hoje
        </h2>

        <ul className="flex flex-col items-center gap-3 mb-10">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="text-white text-lg">
              {benefit}
            </li>
          ))}
        </ul>

        <a
          href="/register"
          className="inline-block bg-[#2E8F86] hover:bg-[#1C3F3A] transition-colors duration-300 text-white rounded px-8 py-4 text-lg font-semibold border border-[#2E8F86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Teste grátis por 14 dias
        </a>
      </div>
    </section>
  )
}
