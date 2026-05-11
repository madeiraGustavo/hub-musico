import { LandmarkIcon } from './icons/LandmarkIcon'
import { WalletIcon } from './icons/WalletIcon'
import { MessageCircleIcon } from './icons/MessageCircleIcon'

const FEATURES = [
  {
    icon: <LandmarkIcon className="w-6 h-6 text-[#2E8F86]" aria-hidden="true" />,
    title: 'Conecta automaticamente',
    description:
      'Conecta automaticamente todas suas contas via Open Finance do Banco Central.',
  },
  {
    icon: <WalletIcon className="w-6 h-6 text-[#2E8F86]" aria-hidden="true" />,
    title: 'Experiência personalizada',
    description:
      'Responde suas dúvidas em linguagem humana e sugere ações para sua situação real.',
  },
  {
    icon: <MessageCircleIcon className="w-6 h-6 text-[#2E8F86]" aria-hidden="true" />,
    title: 'Atualiza sozinho',
    description:
      'Não precisa fazer input manual. Você só conversa e toma decisões.',
  },
]

export function FeaturesSection(): JSX.Element {
  return (
    <section id="features" className="bg-[#EBE8D8]">
      {/* Big headline block */}
      <div className="border-b border-[#050706]/10 px-6 lg:px-12 py-16 lg:py-24">
        <p className="text-[#1C3F3A] text-xs tracking-[0.3em] uppercase mb-6">
          Por que Pluma
        </p>
        <h2 className="font-[family-name:var(--font-anton)] text-[clamp(3.5rem,8vw,8rem)] leading-[0.9] tracking-tight text-[#050706] uppercase">
          MENOS<br />
          PLANILHAS.<br />
          <span className="text-[#1C3F3A]">MAIS CLAREZA.</span>
        </h2>
      </div>

      {/* Feature rows — brutalist list style */}
      <div>
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] border-b border-[#050706]/10 hover:-translate-y-1 transition-transform duration-200"
          >
            {/* Number + icon */}
            <div className="flex items-center gap-6 px-6 lg:px-12 py-8 border-b lg:border-b-0 lg:border-r border-[#050706]/10">
              <span className="font-[family-name:var(--font-anton)] text-6xl text-[#050706]/10 leading-none select-none">
                0{i + 1}
              </span>
              <div className="w-10 h-10 bg-[#1C3F3A] flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
            </div>
            {/* Content */}
            <div className="px-6 lg:px-12 py-8">
              <h3 className="font-[family-name:var(--font-anton)] text-2xl lg:text-3xl text-[#050706] uppercase mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-[#050706]/70 text-base leading-relaxed max-w-lg">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
