import { prisma } from '../../lib/prisma.js'
import type { AppointmentStatus, Prisma } from '@prisma/client'

// ── Appointments Repository ───────────────────────────────────────────────────

/**
 * Retorna todos os appointments de um artista no período [from, to],
 * independentemente do status, ordenados por startAt.
 * Inclui todos os campos necessários para o calendário privado.
 *
 * Requirements: 6.2, 6.4
 */
export async function findByArtistAndPeriod(artistId: string, from: Date, to: Date) {
  return prisma.appointment.findMany({
    where: {
      artistId,
      startAt: { gte: from },
      endAt:   { lte: to },
    },
    orderBy: { startAt: 'asc' },
    select: {
      id:             true,
      requesterName:  true,
      requesterEmail: true,
      requesterPhone: true,
      serviceId:      true,
      startAt:        true,
      endAt:          true,
      status:         true,
      notes:          true,
      requestCode:    true,
    },
  })
}

/**
 * Busca um appointment pelo ID.
 * Retorna id, artistId e status — usado para verificação de ownership
 * e validação de transição de status.
 *
 * Requirements: 7.2, 7.7
 */
export async function findById(id: string) {
  return prisma.appointment.findUnique({
    where:  { id },
    select: { id: true, artistId: true, status: true },
  })
}

/**
 * Atualiza o status de um appointment.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode atualizar appointments de outro artista mesmo com ID correto.
 *
 * Requirements: 7.2
 */
export async function updateStatus(id: string, artistId: string, newStatus: AppointmentStatus) {
  return prisma.appointment.update({
    where: { id, artistId },
    data:  { status: newStatus },
  })
}

/**
 * Remove um appointment.
 * O double-check de ownership na query (where: { id, artistId }) garante que
 * um artista não pode remover appointments de outro artista mesmo com ID correto.
 *
 * Requirements: 7.7
 */
export async function remove(id: string, artistId: string) {
  return prisma.appointment.delete({
    where: { id, artistId },
  })
}

/**
 * Busca appointments que conflitam com o intervalo [startAt, endAt] para o artista.
 * Considera apenas appointments com status PENDING ou CONFIRMED.
 * Conflito: startAt < endAt AND endAt > startAt (sobreposição temporal).
 *
 * Aceita um cliente de transaction Prisma opcional para uso dentro de transações
 * com lock pessimista (SELECT ... FOR UPDATE).
 *
 * Requirements: 6.2
 */
export async function findConflicts(
  artistId: string,
  startAt:  Date,
  endAt:    Date,
  tx?:      Prisma.TransactionClient,
) {
  const client = tx ?? prisma
  return client.appointment.findMany({
    where: {
      artistId,
      status:  { in: ['PENDING', 'CONFIRMED'] },
      startAt: { lt: endAt },
      endAt:   { gt: startAt },
    },
    select: {
      id:      true,
      startAt: true,
      endAt:   true,
      status:  true,
    },
  })
}
