'use client'

import { useEffect, useState } from 'react'

interface Track {
  id: string
  title: string
  genre: string
  genre_label: string
  duration: string | null
  is_public: boolean
  sort_order: number
  created_at: string
}

export default function TracksPage() {
  const [tracks, setTracks]   = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/tracks')
      .then(r => r.json())
      .then((d: { data?: Track[]; error?: string }) => {
        if (d.error) setError(d.error)
        else setTracks(d.data ?? [])
      })
      .catch(() => setError('Erro ao carregar faixas'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta faixa?')) return
    const res = await fetch(`/api/dashboard/tracks/${id}`, { method: 'DELETE' })
    if (res.ok) setTracks(prev => prev.filter(t => t.id !== id))
    else alert('Erro ao deletar faixa')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-head text-3xl font-bold">Faixas</h1>
        <a href="/dashboard/tracks/new"
          className="px-5 py-2.5 rounded-[20px] bg-grad-main text-white font-semibold text-sm
            hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(108,99,255,0.4)] transition-all">
          + Nova Faixa
        </a>
      </div>

      {loading && <p className="text-text-muted">Carregando...</p>}
      {error   && <p className="text-red-400">{error}</p>}

      {!loading && !error && tracks.length === 0 && (
        <p className="text-text-muted">Nenhuma faixa cadastrada ainda.</p>
      )}

      <div className="flex flex-col gap-2">
        {tracks.map(track => (
          <div key={track.id}
            className="flex items-center justify-between bg-bg-card border border-[rgba(255,255,255,0.07)]
              rounded-md px-5 py-4 hover:border-[rgba(108,99,255,0.35)] transition-all">
            <div>
              <h3 className="font-semibold text-sm">{track.title}</h3>
              <span className="text-xs text-accent uppercase tracking-wider">{track.genre_label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-xl ${track.is_public ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {track.is_public ? 'Público' : 'Privado'}
              </span>
              <a href={`/dashboard/tracks/${track.id}`}
                className="text-xs text-accent hover:underline">Editar</a>
              <button onClick={() => handleDelete(track.id)}
                className="text-xs text-red-400 hover:underline">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
