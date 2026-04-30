'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Erro ao fazer login')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-head text-2xl font-bold bg-grad-main bg-clip-text text-transparent mb-2">
            MAX SOUZA
          </div>
          <p className="text-text-secondary text-sm">Acesso ao painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-bg-card border border-[rgba(255,255,255,0.07)] rounded-lg p-8 flex flex-col gap-5">

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email</label>
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                text-text-primary text-sm outline-none placeholder:text-text-muted
                focus:border-accent focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-text-secondary">Senha</label>
            <input
              id="password" type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                text-text-primary text-sm outline-none placeholder:text-text-muted
                focus:border-accent focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)] transition-all"
            />
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-md border
              bg-[rgba(255,60,60,0.1)] border-[rgba(255,60,60,0.3)] text-[#ff3c3c]">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-[32px] bg-grad-main text-white font-semibold text-sm
              shadow-[0_4px_20px_rgba(108,99,255,0.4)] hover:translate-y-[-2px] transition-all
              disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <a href="/" className="text-center text-xs text-text-muted hover:text-text-secondary transition-colors">
            ← Voltar ao portfólio
          </a>
        </form>
      </div>
    </div>
  )
}
