/**
 * artistService.ts
 * Lê de /public/data/*.json via fs (Server Components).
 * FASE 6: substituir por chamada à API REST (Supabase).
 */

import type { Artist, ArtistService, ArtistTestimonial } from '@hub-musico/types'
import { MemoryCache } from '@/lib/cache'
import path from 'path'
import fs   from 'fs/promises'

interface ArtistsJson { artist: Artist }

// Cache com TTL de 60s — evita dados antigos entre deploys serverless
const cache = new MemoryCache<Artist>(60_000)

const SLUG_TO_FILE: Record<string, string> = {
  'max-souza':    'artists.json',
  'arte-na-pele': 'tattoo-artist.json',
}

async function readArtistFile(filename: string): Promise<Artist | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', filename)
    const raw  = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(raw) as ArtistsJson
    return json.artist
  } catch {
    return null
  }
}

async function fetchArtistBySlug(slug: string): Promise<Artist | null> {
  const cached = cache.get(slug)
  if (cached) return cached

  const filename = SLUG_TO_FILE[slug]
  if (!filename) return null

  const artist = await readArtistFile(filename)
  if (!artist) return null

  cache.set(slug, artist)
  return artist
}

async function fetchArtist(): Promise<Artist> {
  const artist = await fetchArtistBySlug('max-souza')
  if (!artist) throw new Error('artistService: artista padrão não encontrado')
  return artist
}

export async function getArtist(): Promise<Artist> {
  return fetchArtist()
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  return fetchArtistBySlug(slug)
}

export async function getArtistServices(): Promise<ArtistService[]> {
  const artist = await fetchArtist()
  return artist.services
}

export async function getArtistTestimonials(): Promise<ArtistTestimonial[]> {
  const artist = await fetchArtist()
  return artist.testimonials
}
