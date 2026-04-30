/**
 * artistService.ts
 *
 * Camada de acesso a dados do artista.
 * Componentes React NUNCA importam dados diretamente — sempre via este serviço.
 *
 * Hoje: lê de /public/data/artists.json
 * FASE 3: substituir fetch por chamada à API REST sem alterar os componentes.
 */

import type { Artist, ArtistService, ArtistTestimonial } from '@hub-musico/types'

// Tipo interno do JSON para validação de shape
interface ArtistsJson {
  artist: Artist
}

let cache: Artist | null = null

async function fetchArtist(): Promise<Artist> {
  if (cache) return cache

  const res = await fetch('/data/artists.json', { cache: 'force-cache' })

  if (!res.ok) {
    throw new Error(`artistService: falha ao carregar dados (${res.status})`)
  }

  const json: ArtistsJson = await res.json() as ArtistsJson
  cache = json.artist
  return cache
}

export async function getArtist(): Promise<Artist> {
  return fetchArtist()
}

export async function getArtistServices(): Promise<ArtistService[]> {
  const artist = await fetchArtist()
  return artist.services
}

export async function getArtistTestimonials(): Promise<ArtistTestimonial[]> {
  const artist = await fetchArtist()
  return artist.testimonials
}
