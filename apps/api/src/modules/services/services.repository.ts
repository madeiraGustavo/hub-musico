import { prisma } from '../../lib/prisma.js'
import type { CreateServiceBody, UpdateServiceBody } from './services.schema.js'

/**
 * Retorna todos os serviços de um artista, ordenados por sort_order.
 * Seleciona apenas os campos necessários para o dashboard.
 */
export async function findAllByArtist(artistId: string) {
  return prisma.service.findMany({
    where:   { artistId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id:          true,
      icon:        true,
      title:       true,
      description: true,
      items:       true,
      price:       true,
      highlight:   true,
      sortOrder:   true,
      active:      true,
      createdAt:   true,
    },
  })
}

/**
 * Busca um serviço pelo ID.
 * Retorna apenas id e artistId — usado exclusivamente para verificação de ownership.
 */
export async function findById(id: string) {
  return prisma.service.findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })
}

/**
 * Cria um novo serviço para o artista.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function create(artistId: string, data: CreateServiceBody) {
  return prisma.service.create({
    data: {
      artistId,
      icon:        data.icon,
      title:       data.title,
      description: data.description,
      items:       data.items ?? [],
      price:       data.price,
      highlight:   data.highlight ?? false,
      sortOrder:   data.sort_order ?? 0,
    },
  })
}

/**
 * Atualiza um serviço.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode atualizar serviços de outro artista mesmo com ID correto.
 */
export async function update(id: string, artistId: string, data: UpdateServiceBody) {
  return prisma.service.update({
    where: { id, artistId },
    data: {
      ...(data.icon        !== undefined && { icon:        data.icon }),
      ...(data.title       !== undefined && { title:       data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.items       !== undefined && { items:       data.items }),
      ...(data.price       !== undefined && { price:       data.price }),
      ...(data.highlight   !== undefined && { highlight:   data.highlight }),
      ...(data.sort_order  !== undefined && { sortOrder:   data.sort_order }),
      ...(data.active      !== undefined && { active:      data.active }),
    },
  })
}

/**
 * Remove um serviço.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode remover serviços de outro artista mesmo com ID correto.
 */
export async function remove(id: string, artistId: string) {
  return prisma.service.delete({
    where: { id, artistId },
  })
}
