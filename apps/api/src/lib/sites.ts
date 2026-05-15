/**
 * sites.ts
 *
 * Config estática de sites/tenants da plataforma Arte Hub.
 * Fonte da verdade para resolução de tenant no backend.
 *
 * Futuramente será migrada para tabela `sites` no banco.
 * A interface e funções públicas permanecerão as mesmas.
 */

import type { FastifyRequest } from 'fastify'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SiteTheme {
  primaryColor: string
  secondaryColor?: string
  backgroundColor?: string
  gradientMain?: string
}

export interface SiteConfig {
  id: string
  slug: string
  displayName: string
  logo?: string
  theme: SiteTheme
  authEnabled: boolean
  cookieName: string
}

// ── Config ────────────────────────────────────────────────────────────────────

export const SITES: Record<string, SiteConfig> = {
  platform: {
    id: 'platform',
    slug: 'platform',
    displayName: 'Arte Hub',
    theme: {
      primaryColor: '#6C63FF',
      gradientMain: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
    },
    authEnabled: true,
    cookieName: 'ah_platform_refresh',
  },
  marketplace: {
    id: 'marketplace',
    slug: 'marketplace',
    displayName: 'Toldos Colibri',
    theme: {
      primaryColor: '#D4A017',
      backgroundColor: '#1A1A1A',
    },
    authEnabled: true,
    cookieName: 'ah_marketplace_refresh',
  },
  tattoo: {
    id: 'tattoo',
    slug: 'tattoo',
    displayName: 'Studio Tattoo',
    theme: {
      primaryColor: '#111827',
      secondaryColor: '#DC2626',
    },
    authEnabled: true,
    cookieName: 'ah_tattoo_refresh',
  },
  music: {
    id: 'music',
    slug: 'music',
    displayName: 'Arte Hub Music',
    theme: {
      primaryColor: '#6C63FF',
      gradientMain: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
    },
    authEnabled: true,
    cookieName: 'ah_music_refresh',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getSiteBySlug(slug: string): SiteConfig | null {
  return SITES[slug] ?? null
}

export function getSiteById(id: string): SiteConfig | null {
  return SITES[id] ?? null
}

/** IDs válidos de site — útil para validação */
export const VALID_SITE_IDS = Object.keys(SITES)

/**
 * Resolve o site da request. Ordem de prioridade:
 * 1. Header X-Site-Id (definido pelo proxy Next.js — confiável)
 * 2. Fallback para 'platform'
 *
 * NUNCA confiar em valor enviado no body pelo cliente.
 * O header X-Site-Id é definido pelo proxy server-side do Next.js,
 * não pelo browser diretamente.
 */
export function resolveSiteFromRequest(req: FastifyRequest): SiteConfig {
  const headerSiteId = req.headers['x-site-id'] as string | undefined

  if (headerSiteId && SITES[headerSiteId]) {
    return SITES[headerSiteId]
  }

  // Fallback seguro — nunca expõe dados de outros tenants
  return SITES.platform
}
