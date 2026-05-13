# Arquitetura do Sistema

## Visão Geral

Monorepo estruturado em camadas com separação clara de responsabilidades. A arquitetura é **Fastify-first**: `apps/api` é o servidor responsável por toda lógica de negócio e autenticação; `apps/web` é exclusivamente frontend.

**Regra fundamental:** novos endpoints de negócio são criados na API Fastify (`apps/api`), nunca como Route Handlers no Next.js (`apps/web`).

## Estrutura de Diretórios

```
/
├── apps/
│   ├── web/          # Frontend exclusivo (Next.js + TypeScript)
│   └── api/          # Backend (Fastify + Prisma + TypeScript)
├── packages/
│   ├── ui/           # Componentes compartilhados
│   └── types/        # Tipos e interfaces TypeScript compartilhados
└── docs/
    ├── arquitetura.md
    ├── seguranca.md
    ├── regras-negocio.md
    ├── modelagem.md
    └── prompts/
```

## Stack Real

| Camada       | Tecnologia                              |
|--------------|-----------------------------------------|
| Frontend     | Next.js + TypeScript                    |
| Backend      | Fastify + TypeScript                    |
| ORM          | Prisma                                  |
| Banco        | PostgreSQL gerenciado via Supabase      |
| Storage      | Supabase Storage (arquivos de mídia)    |
| Auth         | JWT próprio (access token + refresh token) |
| Validação    | Zod                                     |
| Monorepo     | pnpm workspaces                         |

## Camadas da API Fastify

```
Request
  └── Plugins (cors, rate-limit, jwt, sensible)
        └── Hook authenticate (preHandler)
              └── Controller  ← valida input com Zod
                    └── Service  ← lógica de negócio
                          └── Repository  ← acesso ao banco via Prisma
                                └── PostgreSQL (Supabase)
```

**Regras de camada:**
- Controller não acessa Prisma diretamente — apenas chama Service
- Service não conhece `FastifyRequest`/`FastifyReply` — recebe DTOs tipados
- Repository não contém lógica de negócio — apenas queries Prisma
- `artist_id` é sempre extraído do banco via Prisma — nunca do token JWT ou do body

## Fluxo de Requisição

```
apps/web (Next.js)
  └── fetch() com Bearer JWT
        └── apps/api (Fastify)
              └── Prisma
                    └── PostgreSQL (Supabase)
```

## Fluxo de Autenticação JWT

```
1. Login
   Client → POST /auth/login { email, password }
         → API valida credenciais com bcrypt
         → emite access_token (JWT, 15 min) + refresh_token (JWT, 7 dias)
         → refresh_token salvo como hash no banco
         → retorna { accessToken } + cookie HttpOnly refreshToken

2. Uso do access token
   Client → GET /dashboard/... Authorization: Bearer <access_token>
         → hook authenticate verifica assinatura JWT
         → busca role e artist_id no banco (nunca do token)
         → injeta AuthContext em request.user
         → controller executa

3. Renovação
   Client → POST /auth/refresh (cookie refreshToken enviado automaticamente)
         → API verifica assinatura com JWT_REFRESH_SECRET
         → busca hash no banco, verifica revoked e expiresAt
         → revoga token atual, emite novo par (rotação)
         → retorna novo { accessToken } + novo cookie refreshToken

4. Logout
   Client → POST /auth/logout (cookie refreshToken enviado automaticamente — Bearer não obrigatório)
         → API verifica assinatura do refreshToken com JWT_REFRESH_SECRET
         → extrai userId do payload (sub)
         → revoga todos os refresh tokens do usuário no banco
         → limpa cookie refreshToken
```

## Fases de Migração

### Fase 1 — Convivência (estado atual)

Route Handlers existentes e API Fastify coexistem. Auth migra primeiro.

**Critério de entrada:** API Fastify inicializada com módulo de auth funcional.

**Critério de saída:** todos os endpoints de auth migrados e testados na API Fastify; fluxo login → refresh → logout funcionando end-to-end.

```
Browser → apps/web (Next.js)
            ├── /dashboard/*  → Middleware (Supabase Auth, proteção de UI)
            ├── /api/auth/*   → proxy → apps/api (Fastify) — MIGRADO
            └── /api/dashboard/* → Route Handlers existentes — ainda não migrados
```

Durante a Fase 1, o Web usa os Route Handlers existentes para endpoints ainda não migrados e chama a API Fastify diretamente para auth.

### Fase 2 — Migração Completa

Todos os endpoints de negócio migrados para a API Fastify. Web chama exclusivamente a API.

**Critério de entrada:** Fase 1 concluída.

**Critério de saída:** todos os Route Handlers de dashboard e upload substituídos por chamadas diretas à API Fastify.

**Ordem de migração:** auth → profile → tracks → projects → services → upload.

```
Browser → apps/web (Next.js, apenas UI)
            └── fetch() com Bearer JWT → apps/api (Fastify)
                                           └── Prisma → PostgreSQL (Supabase)
                                           └── Supabase Storage (arquivos)
```

### Fase 3 — Limpeza

Route Handlers de negócio removidos do Next.js. Supabase Auth desativado.

**Critério de entrada:** Fase 2 concluída e estável em produção.

**Critério de saída:** `apps/web/src/app/api/dashboard/` e `apps/web/src/app/api/upload/` removidos; Middleware atualizado para validar JWT próprio.

```
Browser → apps/web (Next.js, UI pura)
            └── fetch() com Bearer JWT → apps/api (Fastify)
                                           └── Prisma → PostgreSQL (Supabase)
                                           └── Supabase Storage (arquivos)
```

## Comunicação Web → API por Fase

**Fase 1 — endpoints de auth já migrados:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL // ex: http://localhost:3001

// Auth via API Fastify
await fetch(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify(creds) })

// Dashboard ainda via Route Handlers locais
await fetch('/api/dashboard/tracks')
```

**Fase 2 e 3 — todas as chamadas via API Fastify:**
```typescript
// Access token em memória; refresh token em cookie HttpOnly gerenciado pela API
await fetch(`${API_URL}/dashboard/tracks`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include', // envia cookie de refresh automaticamente
})
```

## Princípios

- **Separação de responsabilidades:** controller não acessa banco, repository não contém lógica de negócio
- **Tipagem estrita:** TypeScript `strict: true` em todos os pacotes
- **Validação em camadas:** entrada validada no controller (Zod), regras de negócio no service
- **Autenticação obrigatória:** todo endpoint privado passa pelo hook `authenticate` antes do controller
- **`artist_id` sempre do banco:** nunca extraído do token JWT ou de parâmetros do cliente

## Módulo de Agendamento

### Rotas Públicas (sem autenticação)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/public/artists/:artistId/availability?from=&to=` | Consulta slots livres |
| POST | `/public/artists/:artistId/appointments` | Solicita agendamento (rate limit: 5 req/min) |
| GET | `/public/appointments/:requestCode` | Consulta status da solicitação |

### Rotas Privadas (com `authenticate`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/availability-rules` | Lista regras de disponibilidade |
| POST | `/availability-rules` | Cria regra |
| PATCH | `/availability-rules/:id` | Atualiza regra |
| DELETE | `/availability-rules/:id` | Remove regra |
| GET | `/availability-blocks` | Lista bloqueios |
| POST | `/availability-blocks` | Cria bloqueio |
| PATCH | `/availability-blocks/:id` | Atualiza bloqueio |
| DELETE | `/availability-blocks/:id` | Remove bloqueio |
| GET | `/appointments?from=&to=` | Calendário completo do artista |
| PATCH | `/appointments/:id/status` | Atualiza status (confirmar/rejeitar/cancelar) |
| DELETE | `/appointments/:id` | Remove appointment |

### Arquitetura do Cálculo de Disponibilidade

```
AvailabilityRules (ativas) → generateSlots(rules, from, to, timezone) → Slot[]
                                                                           ↓
Appointments (PENDING/CONFIRMED) + AvailabilityBlocks → filterConflicts(slots, occupied) → Slot[] (livres)
```

As funções `generateSlots` e `filterConflicts` são **puras** (sem I/O) — facilitam testes de propriedade.

### Concorrência na Criação de Appointments

```
1. Validar antecedência (24h mín, 60 dias máx)
2. Verificar idempotência (artistId + startAt + requesterEmail)
3. prisma.$transaction:
   a. findConflicts(artistId, startAt, endAt) — revalidação dentro da tx
   b. Se conflito → abort → HTTP 409
   c. Se livre → INSERT appointment com status PENDING
```
