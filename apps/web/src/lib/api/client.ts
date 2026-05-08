/**
 * API Client — cliente HTTP tipado para a API Fastify
 *
 * Segurança:
 * - accessToken armazenado em memória (variável de módulo) — nunca em localStorage
 * - credentials: 'include' envia o cookie HttpOnly de refresh automaticamente
 * - Interceptor de 401: tenta POST /auth/refresh uma vez antes de redirecionar para login
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

// Access token em memória — nunca persiste em localStorage ou sessionStorage
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

// Controle para evitar loop infinito de refresh
let isRefreshing = false

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing) return false
  isRefreshing = true

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      credentials: 'include', // envia cookie refreshToken HttpOnly
      headers:     { 'Content-Type': 'application/json' },
    })

    if (!res.ok) return false

    const json = await res.json() as { accessToken?: string }
    if (json.accessToken) {
      accessToken = json.accessToken
      return true
    }
    return false
  } catch {
    return false
  } finally {
    isRefreshing = false
  }
}

function redirectToLogin(): void {
  // Limpa o token em memória antes de redirecionar
  accessToken = null
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  // Interceptor de 401: tenta refresh uma vez
  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (!refreshed) {
      redirectToLogin()
      throw new Error('Sessão expirada')
    }

    // Retry com o novo token
    const retryHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }
    if (accessToken) {
      retryHeaders['Authorization'] = `Bearer ${accessToken}`
    }

    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers:     retryHeaders,
    })

    if (retryRes.status === 401) {
      redirectToLogin()
      throw new Error('Sessão expirada')
    }

    if (!retryRes.ok) {
      const err = await retryRes.json().catch(() => ({ error: 'Erro desconhecido' })) as { error?: string }
      throw new Error(err.error ?? `HTTP ${retryRes.status}`)
    }

    // 204 No Content não tem body
    if (retryRes.status === 204) return undefined as T
    return retryRes.json() as Promise<T>
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' })) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  // 204 No Content não tem body
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body:   body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body:   body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: 'DELETE' })
}
