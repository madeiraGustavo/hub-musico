/**
 * Valida transição de status de pedido.
 * Transições válidas:
 * - PENDING → CONFIRMED
 * - PENDING → CANCELLED
 * - CONFIRMED → SHIPPED
 * - CONFIRMED → CANCELLED
 * - SHIPPED → DELIVERED
 */
export function validateOrderStatusTransition(current: string, next: string): boolean {
  const validTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
  }

  return validTransitions[current]?.includes(next) ?? false
}

/**
 * Calcula o total do pedido a partir dos itens.
 */
export function calculateOrderTotal(items: Array<{ quantity: number; unitPrice: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}
