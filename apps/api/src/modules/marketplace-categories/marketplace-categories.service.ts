import { prisma } from '../../lib/prisma.js'

/**
 * Gera um slug a partir de uma string qualquer.
 * Transliteração para ASCII lowercase com hífens substituindo espaços.
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
 * Garante unicidade do slug para o artista.
 * Se já existir, adiciona sufixo numérico sequencial (-2, -3, ...).
 */
export async function ensureUniqueSlug(
  artistId: string,
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug
  let suffix = 2

  while (true) {
    const existing = await prisma.marketplaceCategory.findFirst({
      where: {
        artistId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })

    if (!existing) return slug

    slug = `${baseSlug}-${suffix}`
    suffix++
  }
}
