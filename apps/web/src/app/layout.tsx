import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Max Souza — Baterista · Multi-instrumentista · Compositor',
  description:
    'Baterista profissional e multi-instrumentista formado pela Bituca. Gravações, shows e projetos musicais em Juiz de Fora e em todo o Brasil.',
  openGraph: {
    title: 'Max Souza — Baterista Profissional',
    description: 'Portfólio musical de Max Souza — Baterista, Multi-instrumentista, Compositor e Educador Musical.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
