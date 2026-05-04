/**
 * trackService.ts
 * Lê de /public/data/tracks.json via fs (Server Components).
 * FASE 6: substituir por chamada à API REST.
 */

import type { Track, TrackGenre } from '@hub-musico/types'
import path from 'path'
import fs   from 'fs/promises'

interface TracksJson {
  tracks: Track[]
}

let cache: Track[] | null = null

async function fetchTracks(): Promise<Track[]> {
  if (cache) return cache

  const filePath = path.join(process.cwd(), 'public', 'data', 'tracks.json')
  const raw  = await fs.readFile(filePath, 'utf-8')
  const json = JSON.parse(raw) as TracksJson
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
