# Multi-Tenant Auth — Technical Design

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                          │
│                                                                  │
│  /[siteSlug]/login  →  LoginForm + AuthLayout + SiteTheme       │
│  /login             →  redirect /platform/login                  │
│  /api/auth/*        →  proxy para Fastify (com X-Site-Id)       │
│  middleware.ts      →  resolveSite() → checkAuth()              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    X-Site-Id header + cookies
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                        Fastify API                               │
│                                                                  │
│  resolveSiteFromRequest(req) → valida contra SITES config       │
│  POST /auth/login     → siteId + email + password               │
│  POST /auth/register  → siteId + email + password + name        │
│  POST /auth/refresh   → cookie ah_{site}_refresh                │
│  authenticate hook    → valida siteId do user vs request        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                        PostgreSQL                                 │
│                                                                  │
│  users: @@unique([siteId, email])                                │
│  refresh_tokens: linked to user (que já tem siteId)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes Novos/Alterados

### Backend (apps/api)

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `prisma/schema.prisma` | ALTER | Adicionar `siteId`, `client` role, mudar unique |
| `migrations/012_add_site_id.sql` | CREATE | Migration para adicionar site_id |
| `src/lib/sites.ts` | CREATE | Config estática de sites + `resolveSiteFromRequest()` |
| `src/modules/auth/auth.schema.ts` | ALTER | Não precisa de siteId no schema (vem do resolver) |
| `src/modules/auth/auth.repository.ts` | ALTER | `findUserByEmailAndSite()`, `createUser()` |
| `src/modules/auth/auth.service.ts` | ALTER | `login(email, password, siteId)`, `register()` |
| `src/modules/auth/auth.controller.ts` | ALTER | Usar `resolveSiteFromRequest()`, cookies por tenant |
| `src/modules/auth/auth.routes.ts` | ALTER | Adicionar `POST /auth/register` |
| `src/hooks/authenticate.ts` | ALTER | Validar siteId (exceto admin) |

### Frontend (apps/web)

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/sites.ts` | CREATE | Config estática de sites (espelho do backend) |
| `src/components/auth/LoginForm.tsx` | CREATE | Formulário reutilizável |
| `src/components/auth/AuthLayout.tsx` | CREATE | Layout com branding dinâmico |
| `src/app/[siteSlug]/login/page.tsx` | CREATE | Página de login por site |
| `src/app/login/page.tsx` | ALTER | Redirect para `/platform/login` |
| `src/app/api/auth/login/route.ts` | ALTER | Adicionar header `X-Site-Id` |
| `src/app/api/auth/logout/route.ts` | ALTER | Limpar cookie correto por tenant |
| `src/app/api/auth/session/route.ts` | ALTER | Repassar `X-Site-Id` |
| `src/middleware.ts` | ALTER | Resolver site antes de auth check |
| `src/lib/api/client.ts` | ALTER | `redirectToLogin()` considerar site atual |

---

## Design Detalhado

### 1. Config Estática de Sites

```ts
// apps/api/src/lib/sites.ts (e espelho em apps/web/src/lib/sites.ts)

export interface SiteConfig {
  id: string
  slug: string
  displayName: string
  logo?: string
  theme: {
    primaryColor: string
    secondaryColor?: string
    backgroundColor?: string
    gradientMain?: string
  }
  authEnabled: boolean
  cookieName: string  // nome do cookie de refresh
}

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
    displayName: 'Arte Hub Marketplace',
    theme: {
      primaryColor: '#F97316',
      backgroundColor: '#0F0F0F',
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

export function getSiteBySlug(slug: string): SiteConfig | null {
  return SITES[slug] ?? null
}

export function getSiteById(id: string): SiteConfig | null {
  return SITES[id] ?? null
}
```

### 2. Resolução de Tenant no Backend

```ts
// apps/api/src/lib/sites.ts (adicionar)

import type { FastifyRequest } from 'fastify'

/**
 * Resolve o site da request. Ordem de prioridade:
 * 1. Header X-Site-Id (definido pelo proxy Next.js)
 * 2. Fallback para 'platform'
 *
 * NUNCA confiar em valor enviado no body pelo cliente.
 */
export function resolveSiteFromRequest(req: FastifyRequest): SiteConfig {
  const headerSiteId = req.headers['x-site-id'] as string | undefined
  
  if (headerSiteId && SITES[headerSiteId]) {
    return SITES[headerSiteId]
  }
  
  // Fallback seguro
  return SITES.platform
}
```

### 3. Cookies por Tenant

```ts
// auth.controller.ts — cookie options por site

function getCookieOptions(site: SiteConfig) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}

// No login:
reply.setCookie(site.cookieName, refreshToken, getCookieOptions(site))

// No logout:
reply.clearCookie(site.cookieName, { path: '/' })

// No refresh — ler cookie correto:
const token = (request.cookies as Record<string, string | undefined>)[site.cookieName]
```

### 4. JWT Payload (sem mudança)

O JWT continua com payload mínimo `{ sub: userId }`. O `siteId` é derivado do banco via `user.siteId` no hook `authenticate`. Isso evita tokens inválidos se o user mudar de site.

### 5. Session Response (atualizado)

```ts
interface SessionData {
  authenticated: true
  user: {
    id: string
    email: string
    role: string
    siteId: string  // ← novo
  }
  artist: {
    id: string
    slug: string
  } | null
}
```

### 6. Hook Authenticate (atualizado)

```ts
// authenticate.ts — adicionar validação de site

// Após buscar userData do banco:
const requestSite = resolveSiteFromRequest(request)

// Admin bypassa isolamento
if (userData.role !== 'admin') {
  if (userData.siteId !== requestSite.id) {
    return reply.code(403).send({ error: 'Acesso negado: site incorreto' })
  }
}

// Injeta siteId no AuthContext
request.user = {
  userId: payload.sub,
  artistId: userData.artistId ?? '',
  role: userData.role,
  siteId: userData.siteId,  // ← novo
}
```

### 7. Frontend — Proxy com X-Site-Id

```ts
// apps/web/src/app/api/auth/login/route.ts

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Resolver site pelo pathname ou header
  const siteId = resolveSiteFromNextRequest(req) // ex: extrai do referer ou cookie
  
  const apiRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Site-Id': siteId,  // ← backend confia neste header (vem do proxy, não do cliente)
    },
    body: JSON.stringify(body),
  })
  // ...
}
```

### 8. Frontend — Middleware Atualizado

```ts
// middleware.ts

export function middleware(req: NextRequest) {
  const site = resolveSiteFromPath(req.nextUrl.pathname)
  
  // Redirect /login → /platform/login
  if (req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/platform/login', req.url))
  }
  
  // Verificar cookie correto por tenant
  const cookieName = site ? `ah_${site}_refresh` : 'ah_platform_refresh'
  const hasRefreshToken = req.cookies.has(cookieName)
  
  // ... resto da lógica
}
```

### 9. Frontend — Login Page Dinâmica

```tsx
// apps/web/src/app/[siteSlug]/login/page.tsx

export default function SiteLoginPage({ params }: { params: { siteSlug: string } }) {
  const site = getSiteBySlug(params.siteSlug)
  if (!site || !site.authEnabled) notFound()
  
  return (
    <AuthLayout site={site}>
      <LoginForm site={site} />
    </AuthLayout>
  )
}
```

---

## Migration SQL

```sql
-- 012_add_site_id.sql

-- 1. Adicionar role 'client' ao enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'client';

-- 2. Adicionar coluna site_id com default 'platform'
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) NOT NULL DEFAULT 'platform';

-- 3. Remover unique constraint de email
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- 4. Criar unique composto (siteId, email)
CREATE UNIQUE INDEX IF NOT EXISTS users_site_email_unique 
  ON public.users(site_id, email);

-- 5. Index para queries por site
CREATE INDEX IF NOT EXISTS idx_users_site_id ON public.users(site_id);
```

---

## Segurança

1. **Resolução de tenant**: sempre pelo backend, nunca confiar no frontend
2. **Cookies isolados**: cada tenant tem seu próprio cookie de refresh
3. **Admin bypass**: documentado e explícito
4. **Queries filtradas**: toda query de user inclui siteId
5. **Validação de site**: `resolveSiteFromRequest()` valida contra config conhecida
6. **Fallback seguro**: se site não reconhecido, usa `platform` (não expõe dados de outros tenants)
