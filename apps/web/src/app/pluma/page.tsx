import { Anton } from 'next/font/google'
import type { Metadata } from 'next'
import { PlumaLayout } from '../../components/pluma/PlumaLayout'

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-anton',
})

export const metadata: Metadata = {
  title: 'Pluma — Assistente Financeiro com IA',
  description:
    'Pluma é o assistente financeiro com IA que conecta suas contas, entende seus hábitos e responde suas dúvidas em linguagem humana.',
}

export default function PlumaPage() {
  return (
    <main className={anton.variable}>
      <PlumaLayout />
    </main>
  )
}
