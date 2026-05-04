/**
 * cache.ts
 * Cache em memória com TTL.
 * Em serverless cada instância tem seu próprio cache — isso é esperado.
 * TTL evita dados antigos após deploy/update.
 */

interface CacheEntry<T> {
  value:     T
  expiresAt: number
}

const DEFAULT_TTL_MS = 60 * 1000 // 60 segundos

export class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private ttl:   number

  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttl = ttlMs
  }

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttl })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}
