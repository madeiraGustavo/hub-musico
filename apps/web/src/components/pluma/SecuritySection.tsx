import { CheckIcon } from './icons/CheckIcon'

export const SECURITY_ITEMS = [
  {
    title: 'Open Finance certificado pelo Banco Central',
    description:
      'Integração oficial com o ecossistema Open Finance regulado pelo Banco Central do Brasil.',
  },
  {
    title: 'Mesma segurança que seu internet banking',
    description:
      'Protocolos de segurança bancária com autenticação de múltiplos fatores.',
  },
  {
    title: 'Seus dados nunca saem do Brasil',
    description:
      'Infraestrutura 100% nacional. Seus dados financeiros ficam em servidores no Brasil.',
  },
  {
    title: 'Criptografia de ponta a ponta',
    description:
      'Todas as comunicações são criptografadas com TLS 1.3 e chaves gerenciadas localmente.',
  },
]

export const CARD_BORDER_CLASS = 'border border-[rgba(28,63,58,0.16)]'

export function SecuritySection(): JSX.Element {
  return (
    <section id="security" className="bg-[#EBE8D8] py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#050706] mb-12">
          Segurança que você pode confiar.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SECURITY_ITEMS.map((item) => (
            <div
              key={item.title}
              className={`${CARD_BORDER_CLASS} bg-white rounded p-6 flex gap-4`}
            >
              <div className="flex-shrink-0 mt-1">
                <CheckIcon
                  aria-hidden="true"
                  className="w-5 h-5 text-[#1C3F3A]"
                />
              </div>
              <div>
                <h3 className="text-[#050706] font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-[#050706] text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
