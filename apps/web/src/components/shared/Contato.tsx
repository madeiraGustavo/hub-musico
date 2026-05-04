'use client'

import type { Artist, ArtistType } from '@hub-musico/types'
import type { ProfileConfig } from '@/lib/profile/profileConfig'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { useContactForm } from '@/hooks/useContactForm'
import { GradientText } from '@/lib/profile/GradientText'

const SERVICOS_OPTIONS = [
  { value: 'gravacao',   label: 'Bateria para Gravação' },
  { value: 'shows',      label: 'Shows & Performances' },
  { value: 'aulas',      label: 'Aulas de Bateria / Violão' },
  { value: 'composicao', label: 'Composição & Arranjo' },
  { value: 'sessao',     label: 'Sessão de Tatuagem' },
  { value: 'outro',      label: 'Outro' },
]

interface Props {
  artist:      Artist
  profileType?: ArtistType
  palette?:    ProfileConfig['palette']
}

export function Contato({
  artist,
  profileType = 'musician',
  palette     = PROFILE_CONFIG.musician.palette,
}: Props) {
  const { form, feedback, loading, handleChange, handleSubmit } = useContactForm()
  const id = `contato-${profileType}`

  return (
    <section id="contato" style={{ background: palette.bgBase, padding: '120px 0' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        #${id} .contato-input {
          background: ${palette.bgCard};
          border: 1px solid ${palette.accentBorder};
          color: ${palette.text};
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        #${id} .contato-input:focus {
          outline: none;
          border-color: ${palette.accent};
          box-shadow: 0 0 0 3px ${palette.accentDim};
        }
        #${id} .contato-input::placeholder { color: ${palette.textSecondary}; opacity: 0.6; }
        #${id} .contato-link { color: ${palette.textSecondary}; transition: color 0.2s; }
        #${id} .contato-link:hover { color: ${palette.text}; }
        #${id} .contato-link-icon {
          background: ${palette.accentDim};
          border: 1px solid ${palette.accentBorder};
          color: ${palette.accent};
        }
        #${id} .contato-btn {
          background: ${palette.gradient};
          color: ${palette.bgBase};
          box-shadow: 0 4px 20px ${palette.accentDim};
          transition: transform 0.2s, box-shadow 0.2s;
        }
        #${id} .contato-btn:hover { transform: translateY(-2px); }
        #${id} .contato-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      ` }} />

      <div id={id} className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-[1fr_1.2fr] gap-20 items-start max-md:grid-cols-1 max-md:gap-12">

          <div>
            <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase mb-3"
              style={{ color: palette.accent }}>
              Vamos criar
            </p>
            <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15] mb-4"
              style={{ color: palette.text }}>
              Tem um projeto<br />
              <GradientText gradient={palette.gradient}>em mente?</GradientText>
            </h2>
            <p className="leading-[1.7] mb-8" style={{ color: palette.textSecondary }}>
              Me conta o que você está pensando. Respondo em até 24 horas.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { href: `mailto:${artist.contact.email}`, icon: '✉', label: artist.contact.email, external: false },
                { href: `https://wa.me/${artist.contact.whatsapp}`, icon: '💬', label: artist.contact.whatsapp, external: true },
                { href: '#', icon: '📍', label: `${artist.location} · ${artist.reach}`, external: false },
              ].map(item => (
                <a key={item.label} href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="contato-link flex items-center gap-3 text-[0.95rem] px-4 py-3 rounded-md">
                  <span className="contato-link-icon w-9 h-9 flex items-center justify-center rounded-sm flex-shrink-0 text-sm">
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {[
              { id: 'nome',  label: 'Nome',  type: 'text',  placeholder: 'Seu nome' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'seu@email.com' },
            ].map(field => (
              <div key={field.id} className="flex flex-col gap-2">
                <label htmlFor={field.id} className="text-sm font-medium" style={{ color: palette.textSecondary }}>
                  {field.label}
                </label>
                <input id={field.id} name={field.id} type={field.type}
                  placeholder={field.placeholder} required
                  value={form[field.id as 'nome' | 'email']}
                  onChange={handleChange}
                  className="contato-input rounded-md px-4 py-3 text-sm w-full"
                />
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <label htmlFor="servico" className="text-sm font-medium" style={{ color: palette.textSecondary }}>
                Serviço
              </label>
              <select id="servico" name="servico" value={form.servico} onChange={handleChange}
                className="contato-input rounded-md px-4 py-3 text-sm w-full">
                <option value="">Selecione um serviço</option>
                {SERVICOS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mensagem" className="text-sm font-medium" style={{ color: palette.textSecondary }}>
                Mensagem
              </label>
              <textarea id="mensagem" name="mensagem" rows={4} required
                placeholder="Fale sobre seu projeto..."
                value={form.mensagem} onChange={handleChange}
                className="contato-input rounded-md px-4 py-3 text-sm w-full resize-y"
              />
            </div>

            <button type="submit" disabled={loading}
              className="contato-btn w-full py-3.5 rounded-[32px] font-semibold text-sm">
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
