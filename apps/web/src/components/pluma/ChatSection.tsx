'use client'

import { useState } from 'react'

export const PROMPT_PILLS = [
  'Quanto posso gastar neste fim de semana?',
  'Por que minha conta está sempre no vermelho?',
  'Consigo trocar de carro este ano?',
  'Onde estou gastando demais?',
  'Quanto preciso guardar para a reserva de emergência?',
]

export const CHAT_PLACEHOLDER = 'Pergunte algo sobre suas finanças pessoais'

export function ChatSection(): JSX.Element {
  const [inputValue, setInputValue] = useState('')

  const handlePillClick = (text: string) => setInputValue(text)

  return (
    <section id="chat" className="bg-[#1C3F3A]">
      {/* Headline */}
      <div className="border-b border-[#EBE8D8]/10 px-6 lg:px-12 py-16 lg:py-20">
        <p className="text-[#2E8F86] text-xs tracking-[0.3em] uppercase mb-6">
          Pluma Answers
        </p>
        <h2 className="font-[family-name:var(--font-anton)] text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-tight text-[#EBE8D8] uppercase">
          PERGUNTE<br />
          QUALQUER<br />
          <span className="text-[#2E8F86]">COISA.</span>
        </h2>
      </div>

      {/* Chat interface */}
      <div className="px-6 lg:px-12 py-12">
        {/* Input row */}
        <div className="flex gap-0 mb-8 border border-[#EBE8D8]/20">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={CHAT_PLACEHOLDER}
            className="flex-1 bg-transparent text-[#EBE8D8] placeholder-[#EBE8D8]/30 px-6 py-4 text-base outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#2E8F86]"
          />
          <button
            type="button"
            className="bg-[#2E8F86] text-[#050706] px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#EBE8D8] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBE8D8] flex-shrink-0"
          >
            Enviar
          </button>
        </div>

        {/* Pills label */}
        <p className="text-[#EBE8D8]/40 text-xs tracking-widest uppercase mb-4">
          Sugestões
        </p>

        {/* Prompt pills — brutalist tag style */}
        <div className="flex flex-wrap gap-3">
          {PROMPT_PILLS.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handlePillClick(pill)}
              className="text-xs text-[#EBE8D8] border border-[#EBE8D8]/20 px-4 py-3 tracking-wide hover:bg-[#2E8F86] hover:border-[#2E8F86] hover:text-[#050706] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBE8D8] text-left"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
