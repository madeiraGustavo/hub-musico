import { prisma } from '../../lib/prisma.js'
import type {
  CreateAvailabilityRuleBody,
  UpdateAvailabilityRuleBody,
  CreateAvailabilityBlockBody,
  UpdateAvailabilityBlockBody,
} from './availability.schemas.js'

// ── Availability Rules ────────────────────────────────────────────────────────

/**
 * Retorna todas as regras de disponibilidade de um artista (ativas e inativas),
 * ordenadas por weekday e startTime.
 */
export async function findRulesByArtist(artistId: string) {
  return prisma.availabilityRule.findMany({
    where:   { artistId },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    select: {
      id:          true,
      weekday:     true,
      startTime:   true,
      endTime:     true,
      slotMinutes: true,
      active:      true,
      createdAt:   true,
      updatedAt:   true,
    },
  })
}

/**
 * Busca uma regra pelo ID.
 * Retorna apenas id e artistId — usado exclusivamente para verificação de ownership.
 */
export async function findRuleById(id: string) {
  return prisma.availabilityRule.findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })
}

/**
 * Cria uma nova regra de disponibilidade para o artista.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function createRule(artistId: string, data: CreateAvailabilityRuleBody) {
  return prisma.availabilityRule.create({
    data: {
      artistId,
      weekday:     data.weekday,
      startTime:   data.startTime,
      endTime:     data.endTime,
      slotMinutes: data.slotMinutes,
      active:      data.active ?? true,
    },
  })
}

/**
 * Atualiza uma regra de disponibilidade.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode atualizar regras de outro artista mesmo com ID correto.
 */
export async function updateRule(id: string, artistId: string, data: UpdateAvailabilityRuleBody) {
  return prisma.availabilityRule.update({
    where: { id, artistId },
    data: {
      ...(data.weekday     !== undefined && { weekday:     data.weekday }),
      ...(data.startTime   !== undefined && { startTime:   data.startTime }),
      ...(data.endTime     !== undefined && { endTime:     data.endTime }),
      ...(data.slotMinutes !== undefined && { slotMinutes: data.slotMinutes }),
      ...(data.active      !== undefined && { active:      data.active }),
    },
  })
}

/**
 * Remove uma regra de disponibilidade.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode remover regras de outro artista mesmo com ID correto.
 */
export async function deleteRule(id: string, artistId: string) {
  return prisma.availabilityRule.delete({
    where: { id, artistId },
  })
}

// ── Availability Blocks ───────────────────────────────────────────────────────

/**
 * Retorna todos os bloqueios de agenda de um artista,
 * ordenados por startAt.
 */
export async function findBlocksByArtist(artistId: string) {
  return prisma.availabilityBlock.findMany({
    where:   { artistId },
    orderBy: { startAt: 'asc' },
    select: {
      id:        true,
      startAt:   true,
      endAt:     true,
      reason:    true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Busca um bloqueio pelo ID.
 * Retorna apenas id e artistId — usado exclusivamente para verificação de ownership.
 */
export async function findBlockById(id: string) {
  return prisma.availabilityBlock.findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })
}

/**
 * Cria um novo bloqueio de agenda para o artista.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function createBlock(artistId: string, data: CreateAvailabilityBlockBody) {
  return prisma.availabilityBlock.create({
    data: {
      artistId,
      startAt: new Date(data.startAt),
      endAt:   new Date(data.endAt),
      reason:  data.reason,
    },
  })
}

/**
 * Atualiza um bloqueio de agenda.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode atualizar bloqueios de outro artista mesmo com ID correto.
 */
export async function updateBlock(id: string, artistId: string, data: UpdateAvailabilityBlockBody) {
  return prisma.availabilityBlock.update({
    where: { id, artistId },
    data: {
      ...(data.startAt !== undefined && { startAt: new Date(data.startAt) }),
      ...(data.endAt   !== undefined && { endAt:   new Date(data.endAt) }),
      ...(data.reason  !== undefined && { reason:  data.reason }),
    },
  })
}

/**
 * Remove um bloqueio de agenda.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode remover bloqueios de outro artista mesmo com ID correto.
 */
export async function deleteBlock(id: string, artistId: string) {
  return prisma.availabilityBlock.delete({
    where: { id, artistId },
  })
}
