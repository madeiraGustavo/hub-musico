import { prisma } from '../../lib/prisma.js'
import type { UpdateProfileBody } from './profile.schema.js'

/**
 * Retorna o perfil completo de um artista pelo seu ID.
 * Seleciona explicitamente todos os campos necessários para o dashboard.
 */
export async function findByArtistId(artistId: string) {
  return prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      id:        true,
      name:      true,
      slug:      true,
      tagline:   true,
      bio:       true,
      location:  true,
      reach:     true,
      email:     true,
      whatsapp:  true,
      skills:    true,
      tools:     true,
      isActive:  true,
      createdAt: true,
    },
  })
}

/**
 * Atualiza o perfil de um artista.
 * Campos sensíveis (email, whatsapp) são incluídos apenas quando presentes no payload —
 * a filtragem de permissão por role é responsabilidade do controller.
 */
export async function update(artistId: string, data: Partial<UpdateProfileBody>) {
  return prisma.artist.update({
    where: { id: artistId },
    data,
    select: {
      id:        true,
      name:      true,
      tagline:   true,
      updatedAt: true,
    },
  })
}
