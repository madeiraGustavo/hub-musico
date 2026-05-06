import { prisma } from '../../lib/prisma.js'
import type { UpdateProfileBody } from './profile.schema.js'

export async function findByArtistId(artistId: string) {
  return prisma.artist.findUnique({ where: { id: artistId } })
}

export async function update(artistId: string, data: UpdateProfileBody) {
  return prisma.artist.update({ where: { id: artistId }, data })
}
