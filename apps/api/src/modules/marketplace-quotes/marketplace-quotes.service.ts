/**
 * Valida transição de status de orçamento.
 * Transições válidas:
 * - PENDING → ANSWERED
 * - PENDING → REJECTED
 * - PENDING → EXPIRED
 * - ANSWERED → ACCEPTED
 * - ANSWERED → REJECTED
 */
export function validateQuoteStatusTransition(current: string, next: string): boolean {
  const validTransitions: Record<string, string[]> = {
    PENDING: ['ANSWERED', 'REJECTED', 'EXPIRED'],
    ANSWERED: ['ACCEPTED', 'REJECTED'],
  }

  return validTransitions[current]?.includes(next) ?? false
}

/**
 * Remove tags HTML de uma string.
 */
export function sanitizeText(input: string): string {
  return input.replace(/<[^>]+>/g, '')
}
