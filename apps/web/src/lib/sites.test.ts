/**
 * sites.test.ts
 *
 * Tests for site/tenant resolution logic.
 * Validates:
 * - resolveSiteFromPath resolves correctly
 * - getSiteBySlug returns correct config
 * - VALID_SITE_IDS contains all expected sites
 * - Branding data is correct per site
 */

import { describe, it, expect } from 'vitest'
import {
  SITES,
  VALID_SITE_IDS,
  getSiteBySlug,
  getSiteById,
  resolveSiteFromPath,
} from './sites'

describe('Site config', () => {
  it('contains all 4 expected sites', () => {
    expect(VALID_SITE_IDS).toContain('platform')
    expect(VALID_SITE_IDS).toContain('marketplace')
    expect(VALID_SITE_IDS).toContain('tattoo')
    expect(VALID_SITE_IDS).toContain('music')
    expect(VALID_SITE_IDS).toHaveLength(4)
  })

  it('each site has unique cookieName', () => {
    const cookieNames = Object.values(SITES).map(s => s.cookieName)
    const unique = new Set(cookieNames)
    expect(unique.size).toBe(cookieNames.length)
  })

  it('each site has authEnabled = true', () => {
    for (const site of Object.values(SITES)) {
      expect(site.authEnabled).toBe(true)
    }
  })

  it('marketplace and tattoo have different themes', () => {
    expect(SITES.marketplace!.theme.primaryColor).not.toBe(SITES.tattoo!.theme.primaryColor)
    expect(SITES.marketplace!.displayName).not.toBe(SITES.tattoo!.displayName)
  })
})

describe('getSiteBySlug', () => {
  it('returns correct site for valid slug', () => {
    expect(getSiteBySlug('marketplace')?.id).toBe('marketplace')
    expect(getSiteBySlug('tattoo')?.id).toBe('tattoo')
    expect(getSiteBySlug('platform')?.id).toBe('platform')
    expect(getSiteBySlug('music')?.id).toBe('music')
  })

  it('returns null for invalid slug', () => {
    expect(getSiteBySlug('invalid')).toBeNull()
    expect(getSiteBySlug('')).toBeNull()
    expect(getSiteBySlug('admin')).toBeNull()
  })

  it('returns null for artist slugs (not a site)', () => {
    expect(getSiteBySlug('max-souza')).toBeNull()
    expect(getSiteBySlug('lonas-premium')).toBeNull()
  })
})

describe('getSiteById', () => {
  it('returns correct site for valid id', () => {
    expect(getSiteById('marketplace')?.slug).toBe('marketplace')
    expect(getSiteById('platform')?.slug).toBe('platform')
  })

  it('returns null for invalid id', () => {
    expect(getSiteById('nonexistent')).toBeNull()
  })
})

describe('resolveSiteFromPath', () => {
  it('resolves /marketplace/login → marketplace', () => {
    expect(resolveSiteFromPath('/marketplace/login').id).toBe('marketplace')
  })

  it('resolves /tattoo/login → tattoo', () => {
    expect(resolveSiteFromPath('/tattoo/login').id).toBe('tattoo')
  })

  it('resolves /platform/login → platform', () => {
    expect(resolveSiteFromPath('/platform/login').id).toBe('platform')
  })

  it('resolves /music/login → music', () => {
    expect(resolveSiteFromPath('/music/login').id).toBe('music')
  })

  it('resolves /marketplace/checkout → marketplace', () => {
    expect(resolveSiteFromPath('/marketplace/checkout').id).toBe('marketplace')
  })

  it('resolves /dashboard → platform (no site prefix)', () => {
    expect(resolveSiteFromPath('/dashboard').id).toBe('platform')
  })

  it('resolves /login → platform (legacy route)', () => {
    expect(resolveSiteFromPath('/login').id).toBe('platform')
  })

  it('resolves / → platform (root)', () => {
    expect(resolveSiteFromPath('/').id).toBe('platform')
  })

  it('resolves /max-souza → platform (artist slug, not a site)', () => {
    expect(resolveSiteFromPath('/max-souza').id).toBe('platform')
  })

  it('does not resolve invalid sites', () => {
    expect(resolveSiteFromPath('/hacker-site/login').id).toBe('platform')
  })
})

describe('Branding: each site has correct display data', () => {
  it('platform has Arte Hub branding', () => {
    const site = SITES.platform!
    expect(site.displayName).toBe('Arte Hub')
    expect(site.theme.primaryColor).toBe('#6C63FF')
    expect(site.theme.gradientMain).toBeDefined()
  })

  it('marketplace has Arte Hub Marketplace branding', () => {
    const site = SITES.marketplace!
    expect(site.displayName).toBe('Arte Hub Marketplace')
    expect(site.theme.primaryColor).toBe('#F97316')
    expect(site.theme.backgroundColor).toBe('#0F0F0F')
  })

  it('tattoo has Studio Tattoo branding', () => {
    const site = SITES.tattoo!
    expect(site.displayName).toBe('Studio Tattoo')
    expect(site.theme.primaryColor).toBe('#111827')
    expect(site.theme.secondaryColor).toBe('#DC2626')
  })

  it('music has Arte Hub Music branding', () => {
    const site = SITES.music!
    expect(site.displayName).toBe('Arte Hub Music')
    expect(site.theme.primaryColor).toBe('#6C63FF')
  })
})
