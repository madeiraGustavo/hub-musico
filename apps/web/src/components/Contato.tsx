'use client'

import { useContactForm } from '@/hooks/useContactForm'

const SERVICOS_OPTIONS = [
  { value: 'gravacao',   label: 'Bateria para Gravação' },
  { value: 'shows',      label: 'Shows & Performances' },
  { value: 'aulas',      label: 'Aulas de Bateria / Violão' },
  { value: 'composicao', label: 'Composição & Arranjo' },
  { value: 'outro',      label: 'Outro' },
]

export function Contato() {
  const { form, feedback, loading, handleChange, handleSubmit } = useContactForm()

  return (
    <section id="contato" className="py-[120px] bg-bg-base">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-[1fr_1.2fr] gap-20 items-start max-md:grid-cols-1 max-md:gap-12">

          {/* Info */}
          <div>
            <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase text-accent mb-3">
              Vamos criar
            </p>
            <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15] mb-4">
              Tem um projeto<br />
              <span className="bg-grad-main bg-clip-text text-transparent">em mente?</span>
            </h2>
            <p className="text-text-secondary leading-[1.7] mb-8">
              Me conta o que você está pensando. Respondo em até 24 horas.
            </p>

            <div className="flex flex-col gap-4">
              {[
                {
                  href: 'mailto:maxsouzask8@gmail.com',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  ),
                  label: 'maxsouzask8@gmail.com',
                },
                {
                  href: 'https://wa.me/5532991092531',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  ),
                  label: '(32) 99109-2531',
                },
                {
                  href: '#',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                  label: 'Juiz de Fora - MG · Atuação Nacional',
                },
              ].map(link => (
                <a key={link.label} href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 text-[0.95rem] text-text-secondary px-4 py-3 rounded-md
                    border border-transparent hover:text-text-primary hover:bg-bg-elevated hover:border-[rgba(255,255,255,0.07)]
                    transition-all">
                  <span className="w-9 h-9 flex items-center justify-center bg-accent-dim border border-[rgba(108,99,255,0.35)]
                    rounded-sm text-accent flex-shrink-0 hover:bg-accent hover:text-white transition-all">
                    {link.icon}
                  </span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {[
              { id: 'nome',     label: 'Nome',     type: 'text',  placeholder: 'Seu nome' },
              { id: 'email',    label: 'Email',    type: 'email', placeholder: 'seu@email.com' },
            ].map(field => (
              <div key={field.id} className="flex flex-col gap-2">
                <label htmlFor={field.id} className="text-sm font-medium text-text-secondary">
                  {field.label}
                </label>
                <input
                  id={field.id} name={field.id} type={field.type}
                  placeholder={field.placeholder} required
                  value={form[field.id as 'nome' | 'email']}
                  onChange={handleChange}
                  className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                    text-text-primary text-sm outline-none transition-all placeholder:text-text-muted
                    focus:border-accent focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"
                />
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <label htmlFor="servico" className="text-sm font-medium text-text-secondary">Serviço</label>
              <select id="servico" name="servico" value={form.servico} onChange={handleChange}
                className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                  text-text-primary text-sm outline-none transition-all
                  focus:border-accent focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]">
                <option value="">Selecione um serviço</option>
                {SERVICOS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mensagem" className="text-sm font-medium text-text-secondary">Mensagem</label>
              <textarea id="mensagem" name="mensagem" rows={4} required
                placeholder="Fale sobre seu projeto..."
                value={form.mensagem} onChange={handleChange}
                className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                  text-text-primary text-sm outline-none transition-all resize-y placeholder:text-text-muted
                  focus:border-accent focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-[32px] bg-grad-main text-white font-semibold text-sm
                shadow-[0_4px_20px_rgba(108,99,255,0.4)] hover:translate-y-[-2px]
                hover:shadow-[0_8px_32px_rgba(108,99,255,0.55)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </button>

            {feedback.type && (
              <div className={`text-sm px-4 py-3 rounded-md border
                ${feedback.type === 'success'
                  ? 'bg-[rgba(0,200,100,0.1)] border-[rgba(0,200,100,0.3)] text-[#00c864]'
                  : 'bg-[rgba(255,60,60,0.1)] border-[rgba(255,60,60,0.3)] text-[#ff3c3c]'
                }`}>
                {feedback.message}
              </div>
            )}
          </form>

        </div>
      </div>
    </section>
  )
}
