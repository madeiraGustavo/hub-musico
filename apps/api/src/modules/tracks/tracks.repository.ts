import { prisma } from '../../lib/prisma.js'
import type { CreateTrackBody, UpdateTrackBody } from './tracks.schema.js'

/**
 * Retorna todas as tracks de um artista, ordenadas por sort_order.
 * Seleciona apenas os campos necessários para o dashboard.
 */
export async function findAllByArtist(artistId: string) {
  return prisma.track.findMany({
    where:   { artistId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id:         true,
      title:      true,
      genre:      true,
      genreLabel: true,
      duration:   true,
      key:        true,
      isPublic:   true,
      sortOrder:  true,
      createdAt:  true,
    },
  })
}

/**
 * Busca uma track pelo ID.
 * Retorna apenas id e artistId — usado exclusivamente para verificação de ownership.
 */
export async function findById(id: string) {
  return prisma.track.findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })
}

/**
 * Cria uma nova track para o artista.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function create(artistId: string, data: CreateTrackBody) {
  return prisma.track.create({
    data: {
      artistId,
      title:      data.title,
      genre:      data.genre,
      genreLabel: data.genre_label,
      duration:   data.duration,
      key:        data.key,
      isPublic:   data.is_public ?? true,
      sortOrder:  data.sort_order ?? 0,
    },
  })
}

/**
 * Atualiza uma track.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode atualizar tracks de outro artista mesmo com ID correto.
 */
export async function update(id: string, artistId: string, data: UpdateTrackBody) {
  return prisma.track.update({
    where: { id, artistId },
    data: {
      ...(data.title      !== undefined && { title:      data.title }),
      ...(data.genre      !== undefined && { genre:      data.genre }),
      ...(data.genre_label !== undefined && { genreLabel: data.genre_label }),
      ...(data.duration   !== undefined && { duration:   data.duration }),
      ...(data.key        !== undefined && { key:        data.key }),
      ...(data.is_public  !== undefined && { isPublic:   data.is_public }),
      ...(data.sort_order !== undefined && { sortOrder:  data.sort_order }),
    },
  })
}

/**
 * Remove uma track.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode remover tracks de outro artista mesmo com ID correto.
 */
export async function remove(id: string, artistId: string) {
  return prisma.track.delete({
    where: { id, artistId },
  })
}
