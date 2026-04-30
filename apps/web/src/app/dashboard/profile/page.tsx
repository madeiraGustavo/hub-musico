'use client'

import { useEffect, useState } from 'react'
import { useContactForm } from '@/hooks/useContactForm'

interface Profile {
  id: string
  name: string
  tagline: string | null
  bio: string[] | null
  location: string | null
  reach: string | null
  email: string | null
  whatsapp: string | null
  skills: string[]
  tools: string[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/profile')
      .then(r => r.json())
      .then((d: { data?: Profile }) => setProfile(d.data ?? null))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setFeedback(null)

    const res = await fetch('/api/dashboard/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     profile.name,
        tagline:  profile.tagline,
        location: profile.location,
        reach:    profile.reach,
        skills:   profile.skills,
        tools:    profile.tools,
      }),
    })

    if (res.ok) setFeedback({ type: 'success', msg: 'Perfil atualizado com sucesso!' })
    else        setFeedback({ type: 'error',   msg: 'Erro ao atualizar perfil.' })
    setSaving(false)
  }

  if (loading) return <p className="text-text-muted">Carregando...</p>
  if (!profile) return <p className="text-red-400">Perfil não encontrado.</p>

  return (
    <div className="max-w-2xl">
      <h1 className="font-head text-3xl font-bold mb-8">Perfil</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {[
          { id: 'name',     label: 'Nome',       value: profile.name,     key: 'name' as const },
          { id: 'tagline',  label: 'Tagline',    value: profile.tagline ?? '', key: 'tagline' as const },
          { id: 'location', label: 'Localização',value: profile.location ?? '', key: 'location' as const },
          { id: 'reach',    label: 'Alcance',    value: profile.reach ?? '', key: 'reach' as const },
        ].map(field => (
          <div key={field.id} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">{field.label}</label>
            <input
              type="text" value={field.value}
              onChange={e => setProfile(prev => prev ? { ...prev, [field.key]: e.target.value } : prev)}
              className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                text-text-primary text-sm outline-none focus:border-accent
                focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)] transition-all"
            />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">
            Skills <span className="text-text-muted">(separadas por vírgula)</span>
          </label>
          <input
            type="text"
            value={profile.skills.join(', ')}
            onChange={e => setProfile(prev => prev
              ? { ...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
              : prev
            )}
            className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
              text-text-primary text-sm outline-none focus:border-accent transition-all"
          />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3.5 rounded-[32px] bg-grad-main text-white font-semibold text-sm
            shadow-[0_4px_20px_rgba(108,99,255,0.4)] hover:translate-y-[-2px] transition-all
            disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? 'Salvando...' : 'Salvar Perfil'}
        </button>

        {feedback && (
          <div className={`text-sm px-4 py-3 rounded-md border
            ${feedback.type === 'success'
              ? 'bg-[rgba(0,200,100,0.1)] border-[rgba(0,200,100,0.3)] text-[#00c864]'
              : 'bg-[rgba(255,60,60,0.1)] border-[rgba(255,60,60,0.3)] text-[#ff3c3c]'
            }`}>
            {feedback.msg}
          </div>
        )}
      </form>
    </div>
  )
}
