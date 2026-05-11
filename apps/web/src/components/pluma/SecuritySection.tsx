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

export function SecuritySection(): JSX.Element {
  return (
    <section id="security" className="bg-[#EBE8D8]">
      {/* Headline */}
      <div className="border-t border-b border-[#050706]/10 px-6 lg:px-12 py-16 lg:py-24 bg-[#1C3F3A]">
        <p className="text-[#2E8F86] text-xs tracking-[0.3em] uppercase mb-6">
          Segurança
        </p>
        <h2 className="font-[family-name:var(--font-anton)] text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-tight text-[#EBE8D8] uppercase">
          SEUS DADOS,<br />
          <span className="text-[#2E8F86]">PROTEGIDOS.</span>
        </h2>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {SECURITY_ITEMS.map((item, i) => (
          <div
            key={item.title}
            className={`px-6 lg:px-12 py-10 border-[#050706]/10
              ${i % 2 === 0 ? 'md:border-r' : ''}
              ${i < 2 ? 'border-b' : ''}
              border-b md:border-b-0
              ${i === 0 ? 'md:border-b' : ''}
              ${i === 1 ? 'md:border-b' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#2E8F86] flex items-center justify-center flex-shrink-0 mt-1">
                <CheckIcon aria-hidden="true" className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-anton)] text-xl lg:text-2xl text-[#050706] uppercase tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-[#050706]/70 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
