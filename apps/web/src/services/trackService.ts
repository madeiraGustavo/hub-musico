/**
 * trackService.ts
 *
 * Camada de acesso a dados de faixas musicais.
 * Componentes React NUNCA importam dados diretamente — sempre via este serviço.
 *
 * Hoje: lê de /public/data/tracks.json
 * FASE 3: substituir fetch por chamada à API REST sem alterar os componentes.
 */

import type { Track, TrackGenre } from '@hub-musico/types'

interface TracksJson {
  tracks: Track[]
}

let cache: Track[] | null = null

async function fetchTracks(): Promise<Track[]> {
  if (cache) return cache

  const res = await fetch('/data/tracks.json', { cache: 'force-cache' })

  if (!res.ok) {
    throw new Error(`trackService: falha ao carregar dados (${res.status})`)
  }

  const json: TracksJson = await res.json() as TracksJson
  cache = json.tracks
  return cache
}

export async function getTracks(): Promise<Track[]> {
  return fetchTracks()
}

export async function getTracksByGenre(genre: TrackGenre): Promise<Track[]> {
  const tracks = await fetchTracks()
  if (genre === 'all') return tracks
  return tracks.filter(t => t.genre === genre)
}

export async function getTrackById(id: number): Promise<Track | undefined> {
  const tracks = await fetchTracks()
  return tracks.find(t => t.id === id)
}
