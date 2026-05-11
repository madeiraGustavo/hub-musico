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
    <section id="chat" className="bg-[#1C3F3A] text-[#EBE8D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-[#EBE8D8]">
            Pluma Answers
          </h2>
          <p className="text-lg mb-10 text-[#EBE8D8] opacity-80">
            Pergunte sobre suas finanças em linguagem natural. O Pluma entende e responde.
          </p>

          {/* Chat card */}
          <div className="bg-[#0f2b27] rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={CHAT_PLACEHOLDER}
                className="flex-1 bg-[#1C3F3A] text-[#EBE8D8] placeholder-[#EBE8D8]/50 border border-[#EBE8D8]/20 rounded px-4 py-3 text-base outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E8F86]"
              />
              <button
                type="button"
                aria-label="Enviar pergunta"
                className="bg-[#2E8F86] hover:bg-[#1C3F3A] border border-[#2E8F86] text-white rounded px-5 py-3 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBE8D8]"
              >
                Enviar
              </button>
            </div>

            {/* Prompt pills */}
            <div className="flex flex-wrap gap-2">
              {PROMPT_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handlePillClick(pill)}
                  className="text-sm text-[#EBE8D8] bg-[#1C3F3A] border border-[#EBE8D8]/20 rounded-full px-4 py-2 hover:bg-[#2E8F86] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBE8D8]"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
