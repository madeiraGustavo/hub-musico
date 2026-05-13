import { prisma } from '../../lib/prisma.js'

/**
 * Gera slug a partir do título do produto.
 * Transliteração para ASCII lowercase com hífens.
 */
export function generateSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Gera slug único para produto do artista.
 * Adiciona sufixo numérico sequencial se já existir.
 */
export async function generateProductSlug(artistId: string, title: string): Promise<string> {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let suffix = 2

  while (true) {
    const existing = await prisma.marketplaceProduct.findFirst({
      where: { artistId, slug },
      select: { id: true },
    })

    if (!existing) return slug

    slug = `${baseSlug}-${suffix}`
    suffix++
  }
}

/**
 * Remove tags HTML de uma string.
 */
export function sanitizeText(input: string): string {
  return input.replace(/<[^>]+>/g, '')
}

/**
 * Valida regras de tipo/preço do produto.
 * FIXED_PRICE requer basePrice > 0.
 */
export function validateProductType(type: string, basePrice?: number | null): string | null {
  if (type === 'FIXED_PRICE') {
    if (basePrice === undefined || basePrice === null || basePrice <= 0) {
      return 'Preço base é obrigatório para produtos com preço fixo'
    }
  }
  return null
}
