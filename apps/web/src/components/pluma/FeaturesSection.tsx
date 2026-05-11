import { LandmarkIcon } from './icons/LandmarkIcon'
import { WalletIcon } from './icons/WalletIcon'
import { MessageCircleIcon } from './icons/MessageCircleIcon'

const FEATURES = [
  {
    icon: <LandmarkIcon className="w-8 h-8 text-[#1C3F3A]" aria-hidden="true" />,
    title: 'Conecta automaticamente',
    description:
      'Conecta automaticamente todas suas contas via Open Finance do Banco Central.',
  },
  {
    icon: <WalletIcon className="w-8 h-8 text-[#1C3F3A]" aria-hidden="true" />,
    title: 'Experiência personalizada',
    description:
      'Responde suas dúvidas em linguagem humana e sugere ações para sua situação real.',
  },
  {
    icon: <MessageCircleIcon className="w-8 h-8 text-[#1C3F3A]" aria-hidden="true" />,
    title: 'Atualiza sozinho',
    description:
      'Não precisa fazer input manual. Você só conversa e toma decisões.',
  },
]

export function FeaturesSection(): JSX.Element {
  return (
    <section id="features" className="bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl md:text-6xl font-bold text-[#050706] mb-16 leading-tight">
          Menos planilhas. Mais clareza.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="border border-[rgba(28,63,58,0.16)] rounded-sm p-8 hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-[#050706] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#050706] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
