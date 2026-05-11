import { prisma } from '../../lib/prisma.js'
// Tipo local para o UserRole (Prisma client ainda não gerado)
type UserRole = 'admin' | 'artist' | 'editor'

export interface UserWithAuth {
  id:       string
  email:    string
  password: string | null
  role:     UserRole
  artistId: string | null
}

export interface RefreshTokenRow {
  id:        string
  userId:    string
  tokenHash: string
  expiresAt: Date
  revoked:   boolean
}

// ── User ──────────────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<UserWithAuth | null> {
  return prisma.user.findUnique({
    where:  { email: email.toLowerCase().trim() },
    select: { id: true, email: true, password: true, role: true, artistId: true },
  })
}

export async function findUserById(id: string): Promise<UserWithAuth | null> {
  return prisma.user.findUnique({
    where:  { id },
    select: { id: true, email: true, password: true, role: true, artistId: true },
  })
}

// ── Refresh tokens ────────────────────────────────────────────────────────────

export async function createRefreshToken(
  userId:    string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  return prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revoked:   false,
      expiresAt: { gt: new Date() },
    },
  })
}

export async function revokeRefreshToken(id: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { id },
    data:  { revoked: true },
  })
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data:  { revoked: true },
  })
}

// ── Artist ────────────────────────────────────────────────────────────────────

export async function findArtistById(id: string): Promise<{ id: string; slug: string } | null> {
  return prisma.artist.findUnique({
    where: { id },
    select: { id: true, slug: true },
  })
}
