/**
 * appointments.service.ts
 *
 * Lógica de negócio para gerenciamento de Appointments.
 * Não conhece FastifyRequest/FastifyReply — recebe e retorna DTOs tipados.
 * Lança erros com `code` para que o controller mapeie ao HTTP correto.
 *
 * Requirements: 7.4, 7.5
 */

import type { AppointmentStatus } from '@prisma/client'
import { findById, updateStatus as repoUpdateStatus } from './appointments.repository.js'

// ── Tipos de erro ─────────────────────────────────────────────────────────────

/**
 * Erro tipado lançado pelo service.
 * O controller inspeciona `code` para determinar o status HTTP:
 *   - 'NOT_FOUND'          → 404
 *   - 'FORBIDDEN'          → 403
 *   - 'INVALID_TRANSITION' → 422
 */
export class AppointmentServiceError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'INVALID_TRANSITION',
    message: string,
  ) {
    super(message)
    this.name = 'AppointmentServiceError'
  }
}

// ── Transições de status válidas ──────────────────────────────────────────────

/**
 * Mapa de transições permitidas.
 * Requirements: 7.4
 *
 * PENDING   → CONFIRMED
 * PENDING   → REJECTED
 * PENDING   → CANCELLED
 * CONFIRMED → CANCELLED
 */
const VALID_TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  PENDING:   ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
}

// ── updateStatus ──────────────────────────────────────────────────────────────

/**
 * Atualiza o status de um Appointment, validando ownership e transição.
 *
 * Fluxo:
 * 1. Busca o Appointment pelo id — lança NOT_FOUND se não existir
 * 2. Verifica que o artistId corresponde ao dono — lança FORBIDDEN se não
 * 3. Valida que a transição (currentStatus → newStatus) é permitida — lança INVALID_TRANSITION se não
 * 4. Persiste a atualização via repository
 *
 * @param id        - UUID do Appointment
 * @param artistId  - artistId extraído do token JWT (nunca do body)
 * @param newStatus - Novo status desejado
 * @returns         - Appointment atualizado
 *
 * @throws AppointmentServiceError com code 'NOT_FOUND'          se o Appointment não existir
 * @throws AppointmentServiceError com code 'FORBIDDEN'          se o artistId não corresponder
 * @throws AppointmentServiceError com code 'INVALID_TRANSITION' se a transição não for permitida
 *
 * Requirements: 7.2, 7.3, 7.4, 7.5
 */
export async function updateStatus(
  id:        string,
  artistId:  string,
  newStatus: AppointmentStatus,
): Promise<Awaited<ReturnType<typeof repoUpdateStatus>>> {
  // 1. Buscar o appointment
  const appointment = await findById(id)

  if (!appointment) {
    throw new AppointmentServiceError('NOT_FOUND', 'Agendamento não encontrado')
  }

  // 2. Verificar ownership
  if (appointment.artistId !== artistId) {
    throw new AppointmentServiceError('FORBIDDEN', 'Acesso negado')
  }

  // 3. Validar transição de status
  const currentStatus = appointment.status
  const allowed       = VALID_TRANSITIONS[currentStatus] ?? []

  if (!allowed.includes(newStatus)) {
    throw new AppointmentServiceError(
      'INVALID_TRANSITION',
      `Transição de status inválida: ${currentStatus} → ${newStatus}`,
    )
  }

  // 4. Persistir
  return repoUpdateStatus(id, artistId, newStatus)
}
