import { prisma } from '../../lib/prisma.js'
import type { CreateProjectBody, UpdateProjectBody } from './projects.schema.js'

/**
 * Retorna todos os projetos de um artista, ordenados por sort_order.
 * Seleciona apenas os campos necessários para o dashboard.
 */
export async function findAllByArtist(artistId: string) {
  return prisma.project.findMany({
    where:   { artistId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id:        true,
      title:     true,
      platform:  true,
      tags:      true,
      href:      true,
      featured:  true,
      status:    true,
      sortOrder: true,
      createdAt: true,
    },
  })
}

/**
 * Busca um projeto pelo ID.
 * Retorna apenas id e artistId — usado exclusivamente para verificação de ownership.
 */
export async function findById(id: string) {
  return prisma.project.findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })
}

/**
 * Cria um novo projeto para o artista.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function create(artistId: string, data: CreateProjectBody) {
  return prisma.project.create({
    data: {
      artistId,
      title:              data.title,
      description:        data.description,
      yearLabel:          data.year_label,
      platform:           data.platform,
      tags:               data.tags ?? [],
      href:               data.href,
      thumbnailUrl:       data.thumbnail_url ?? null,
      spotifyId:          data.spotify_id ?? null,
      featured:           data.featured ?? false,
      backgroundStyle:    data.background_style,
      backgroundPosition: data.background_position,
      backgroundSize:     data.background_size,
      sortOrder:          data.sort_order ?? 0,
    },
  })
}

/**
 * Atualiza um projeto.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode atualizar projetos de outro artista mesmo com ID correto.
 */
export async function update(id: string, artistId: string, data: UpdateProjectBody) {
  return prisma.project.update({
    where: { id, artistId },
    data: {
      ...(data.title              !== undefined && { title:              data.title }),
      ...(data.description        !== undefined && { description:        data.description }),
      ...(data.year_label         !== undefined && { yearLabel:          data.year_label }),
      ...(data.platform           !== undefined && { platform:           data.platform }),
      ...(data.tags               !== undefined && { tags:               data.tags }),
      ...(data.href               !== undefined && { href:               data.href }),
      ...(data.thumbnail_url      !== undefined && { thumbnailUrl:       data.thumbnail_url }),
      ...(data.spotify_id         !== undefined && { spotifyId:          data.spotify_id }),
      ...(data.featured           !== undefined && { featured:           data.featured }),
      ...(data.background_style   !== undefined && { backgroundStyle:    data.background_style }),
      ...(data.background_position !== undefined && { backgroundPosition: data.background_position }),
      ...(data.background_size    !== undefined && { backgroundSize:     data.background_size }),
      ...(data.sort_order         !== undefined && { sortOrder:          data.sort_order }),
    },
  })
}
