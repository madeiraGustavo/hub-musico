# Design Document — api-architecture-migration

## Overview

O hub-musico migra de uma arquitetura **Supabase-first** (Next.js Route Handlers + Supabase Auth SSR) para uma arquitetura **Fastify-first** (API REST dedicada em `apps/api` com Fastify + Prisma + JWT próprio).

O Supabase permanece como infraestrutura de banco de dados PostgreSQL gerenciado e storage de arquivos. Apenas a camada de autenticação e os endpoints de negócio migram para o Fastify.

A migração acontece em **três fases** para garantir continuidade do serviço:

- **Fase 1** — Convivência: Route Handlers e API Fastify coexistem. Auth migra primeiro.
- **Fase 2** — Migração completa: Web chama exclusivamente a API Fastify.
- **Fase 3** — Limpeza: Route Handlers de negócio são removidos do Next.js.

---

## Architecture

### Visão geral por fase

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — Convivência                                           │
│                                                                 │
│  Browser → apps/web (Next.js)                                   │
│               ├── /dashboard/* → middleware (Supabase Auth)     │
│               ├── /api/auth/*  → Fastify API  (novo)            │
│               └── /api/dashboard/* → Route Handlers (existente) │
│                                                                 │
│  apps/api (Fastify) → Prisma → PostgreSQL (Supabase)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FASE 2 — Migração completa                                     │
│                                                                 │
│  Browser → apps/web (Next.js, apenas UI)                        │
│               └── fetch() → apps/api (Fastify)                  │
│                               └── Prisma → PostgreSQL (Supabase)│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FASE 3 — Estado final                                          │
│                                                                 │
│  Browser → apps/web (Next.js, UI pura)                          │
│               └── fetch() com Bearer JWT → apps/api (Fastify)   │
│                               └── Prisma → PostgreSQL (Supabase)│
│                               └── Supabase Storage (arquivos)   │
└─────────────────────────────────────────────────────────────────┘
```

### Camadas da API Fastify

```
Request
  └── Fastify plugins (cors, rate-limit, jwt)
        └── Auth hook (preHandler)
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

---

## Components and Interfaces

### Estrutura de diretórios de `apps/api`

```
apps/api/
├── migrations/                    # migrations SQL existentes (001-009)
├── src/
│   ├── server.ts                  # bootstrap Fastify + registro de plugins
│   ├── app.ts                     # factory da instância Fastify (testável)
│   ├── env.ts                     # validação de variáveis de ambiente com Zod
│   │
│   ├── plugins/
│   │   ├── cors.ts                # @fastify/cors — origens permitidas via env
│   │   ├── jwt.ts                 # @fastify/jwt — access + refresh token
│   │   ├── rateLimit.ts           # @fastify/rate-limit — proteção de auth
│   │   └── sensible.ts            # @fastify/sensible — helpers de erro HTTP
│   │
│   ├── hooks/
│   │   └── authenticate.ts        # preHandler: verifica Bearer JWT, injeta AuthContext
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.schema.ts     # schemas Zod para login/refresh
│   │   │   └── auth.routes.ts     # registra rotas /auth/*
│   │   │
│   │   ├── profile/
│   │   │   ├── profile.controller.ts
│   │   │   ├── profile.service.ts
│   │   │   ├── profile.repository.ts
│   │   │   ├── profile.schema.ts
│   │   │   └── profile.routes.ts
│   │   │
│   │   ├── tracks/
│   │   │   ├── tracks.controller.ts
│   │   │   ├── tracks.service.ts
│   │   │   ├── tracks.repository.ts
│   │   │   ├── tracks.schema.ts
│   │   │   └── tracks.routes.ts
│   │   │
│   │   ├── projects/
│   │   │   └── ...                # mesma estrutura
│   │   │
│   │   ├── services/
│   │   │   └── ...                # mesma estrutura
│   │   │
│   │   └── upload/
│   │       ├── upload.controller.ts
│   │       ├── upload.service.ts
│   │       ├── upload.schema.ts
│   │       └── upload.routes.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts              # singleton PrismaClient
│   │   ├── storage.ts             # cliente Supabase Storage (service_role)
│   │   └── password.ts            # bcrypt helpers
│   │
│   └── types/
│       └── fastify.d.ts           # augmentação: FastifyRequest.user (AuthContext)
│
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

### Plugin: JWT (`plugins/jwt.ts`)

```typescript
// Registra @fastify/jwt com dois segredos distintos
fastify.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: '15m' },
})

// Refresh token usa segredo separado — verificado manualmente no AuthService
// JWT_REFRESH_SECRET usado em auth.service.ts via fastify.jwt.verify(token, { key: env.JWT_REFRESH_SECRET })
```

### Hook: `authenticate.ts`

Equivalente ao `requireAuth()` atual, implementado como `preHandler` Fastify:

```typescript
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // 1. Extrai Bearer token do header Authorization
  // 2. Verifica assinatura JWT com JWT_SECRET
  // 3. Busca user + artist_id no banco via Prisma (nunca do token)
  // 4. Verifica role permitido para a rota
  // 5. Injeta AuthContext em request.user
  // Em caso de falha: reply.code(401).send({ error: 'Não autorizado' })
}
```

`AuthContext` injetado em `request.user`:

```typescript
interface AuthContext {
  userId:   string   // users.id
  artistId: string   // artists.id — extraído do banco
  role:     'admin' | 'artist' | 'editor'
}
```

### Rotas da API Fastify

| Método | Rota                        | Auth | Roles                    | Equivalente atual                        |
|--------|-----------------------------|------|--------------------------|------------------------------------------|
| POST   | `/auth/login`               | —    | —                        | `/api/auth/login`                        |
| POST   | `/auth/refresh`             | —    | —                        | —                                        |
| POST   | `/auth/logout`              | JWT  | todos                    | `/api/auth/logout`                       |
| GET    | `/auth/session`             | JWT  | todos                    | `/api/auth/session`                      |
| GET    | `/dashboard/profile`        | JWT  | admin, artist, editor    | `/api/dashboard/profile`                 |
| PATCH  | `/dashboard/profile`        | JWT  | admin, artist, editor    | `/api/dashboard/profile`                 |
| GET    | `/dashboard/tracks`         | JWT  | admin, artist, editor    | `/api/dashboard/tracks`                  |
| POST   | `/dashboard/tracks`         | JWT  | admin, artist, editor    | `/api/dashboard/tracks`                  |
| PATCH  | `/dashboard/tracks/:id`     | JWT  | admin, artist, editor    | `/api/dashboard/tracks/[id]`             |
| DELETE | `/dashboard/tracks/:id`     | JWT  | admin, artist            | `/api/dashboard/tracks/[id]`             |
| GET    | `/dashboard/projects`       | JWT  | admin, artist, editor    | `/api/dashboard/projects`                |
| POST   | `/dashboard/projects`       | JWT  | admin, artist, editor    | `/api/dashboard/projects`                |
| GET    | `/dashboard/services`       | JWT  | admin, artist, editor    | `/api/dashboard/services`                |
| POST   | `/dashboard/services`       | JWT  | admin, artist, editor    | `/api/dashboard/services`                |
| PATCH  | `/dashboard/services/:id`   | JWT  | admin, artist, editor    | `/api/dashboard/services/[id]`           |
| DELETE | `/dashboard/services/:id`   | JWT  | admin, artist            | `/api/dashboard/services/[id]`           |
| POST   | `/upload`                   | JWT  | admin, artist, editor    | `/api/upload`                            |

### Comunicação Web → API por fase

**Fase 1:**
```typescript
// apps/web — endpoints de auth já migrados chamam a API diretamente
const API_URL = process.env.NEXT_PUBLIC_API_URL // http://localhost:3001

// Login via API Fastify
await fetch(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify(creds) })

// Dashboard ainda usa Route Handlers existentes
await fetch('/api/dashboard/tracks')  // Route Handler local
```

**Fase 2 e 3:**
```typescript
// apps/web — todas as chamadas vão para a API Fastify
// Access token armazenado em memória (ou sessionStorage)
// Refresh token em cookie HttpOnly gerenciado pela API

const apiClient = {
  async get(path: string) {
    return fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',  // envia cookie de refresh
    })
  }
}
```

---

## Data Models

### Schema Prisma (`apps/api/prisma/schema.prisma`)

Derivado diretamente das migrations 001–009. O Prisma conecta ao PostgreSQL do Supabase via `DATABASE_URL` — sem Supabase client.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  admin
  artist
  editor

  @@map("user_role")
}

enum ArtistType {
  musician
  tattoo

  @@map("artist_type")
}

enum TrackGenre {
  piano
  jazz
  ambient
  orquestral
  rock
  demo
  outro

  @@map("track_genre")
}

enum ProjectPlatform {
  youtube
  spotify
  soundcloud
  outro

  @@map("project_platform")
}

enum ProjectStatus {
  draft
  active
  archived

  @@map("project_status")
}

enum ServiceIcon {
  drum
  mic
  music
  compose
  needle
  camera
  calendar
  star

  @@map("service_icon")
}

enum MediaType {
  audio
  image

  @@map("media_type")
}

// ── Models ───────────────────────────────────────────────────────────────────

/// Estende auth.users do Supabase (Fase 1) ou é autônomo (Fase 3)
model User {
  id        String    @id @db.Uuid
  email     String    @unique
  /// Gerenciado pela API Fastify — hash bcrypt. Null durante Fase 1 (auth via Supabase)
  password  String?
  role      UserRole  @default(artist)
  artistId  String?   @map("artist_id") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  artist        Artist?        @relation(fields: [artistId], references: [id], onDelete: SetNull)
  refreshTokens RefreshToken[]

  @@index([role])
  @@index([artistId])
  @@map("users")
}

model Artist {
  id          String     @id @default(uuid()) @db.Uuid
  userId      String     @unique @map("user_id") @db.Uuid
  name        String     @db.VarChar(100)
  slug        String     @unique @db.VarChar(100)
  profileType ArtistType @default(musician) @map("profile_type")
  tagline     String?    @db.Text
  bio         String[]
  location    String?    @db.VarChar(100)
  reach       String?    @db.VarChar(100)
  email       String?    @db.VarChar(255)
  whatsapp    String?    @db.VarChar(20)
  skills      String[]
  tools       String[]
  isActive    Boolean    @default(true) @map("is_active")
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks      Track[]
  projects    Project[]
  services    Service[]
  mediaAssets MediaAsset[]

  @@index([userId])
  @@index([slug])
  @@index([profileType])
  @@map("artists")
}

/// Refresh tokens para o JWT próprio da API Fastify
model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  tokenHash String   @map("token_hash") @db.VarChar(255)
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
  @@map("refresh_tokens")
}

model Track {
  id         String     @id @default(uuid()) @db.Uuid
  artistId   String     @map("artist_id") @db.Uuid
  title      String     @db.VarChar(100)
  genre      TrackGenre @default(outro)
  genreLabel String     @map("genre_label") @db.VarChar(50)
  duration   String?    @db.VarChar(10)
  key        String?    @db.VarChar(10)
  storageKey String?    @map("storage_key") @db.Text
  mimeType   String?    @map("mime_type") @db.VarChar(100)
  sizeBytes  Int?       @map("size_bytes")
  isPublic   Boolean    @default(true) @map("is_public")
  sortOrder  Int        @default(0) @map("sort_order")
  createdAt  DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  artist Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)

  @@index([artistId])
  @@index([genre])
  @@index([artistId, sortOrder])
  @@map("tracks")
}

model Project {
  id                 String          @id @default(uuid()) @db.Uuid
  artistId           String          @map("artist_id") @db.Uuid
  title              String          @db.VarChar(100)
  description        String?         @db.Text
  yearLabel          String?         @map("year_label") @db.VarChar(20)
  platform           ProjectPlatform @default(outro)
  tags               String[]
  href               String          @db.Text
  thumbnailUrl       String?         @map("thumbnail_url") @db.Text
  spotifyId          String?         @map("spotify_id") @db.VarChar(50)
  featured           Boolean         @default(false)
  backgroundStyle    String?         @map("background_style") @db.Text
  backgroundPosition String?         @map("background_position") @db.VarChar(50)
  backgroundSize     String?         @map("background_size") @db.VarChar(50)
  status             ProjectStatus   @default(active)
  sortOrder          Int             @default(0) @map("sort_order")
  createdAt          DateTime        @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime        @updatedAt @map("updated_at") @db.Timestamptz

  artist Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)

  @@index([artistId])
  @@index([status])
  @@index([artistId, sortOrder])
  // Índice parcial: apenas um featured=true por artista (migration 008)
  // Implementado via migration SQL — não suportado nativamente no Prisma schema
  @@map("projects")
}

model Service {
  id          String      @id @default(uuid()) @db.Uuid
  artistId    String      @map("artist_id") @db.Uuid
  icon        ServiceIcon @default(star)
  title       String      @db.VarChar(100)
  description String      @db.Text
  items       String[]
  price       String      @db.VarChar(100)
  highlight   Boolean     @default(false)
  sortOrder   Int         @default(0) @map("sort_order")
  active      Boolean     @default(true)
  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  artist Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)

  @@index([artistId])
  @@index([artistId, sortOrder])
  @@index([artistId, active])
  @@map("services")
}

model MediaAsset {
  id           String    @id @default(uuid()) @db.Uuid
  artistId     String    @map("artist_id") @db.Uuid
  entityType   String?   @map("entity_type") @db.VarChar(50)
  entityId     String?   @map("entity_id") @db.Uuid
  mediaType    MediaType @map("media_type")
  storageKey   String    @unique @map("storage_key") @db.Text
  originalName String?   @map("original_name") @db.VarChar(255)
  mimeType     String    @map("mime_type") @db.VarChar(100)
  sizeBytes    Int       @map("size_bytes")
  width        Int?
  height       Int?
  durationSec  Int?      @map("duration_sec")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz

  artist Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)

  @@index([artistId])
  @@index([entityType, entityId])
  @@index([storageKey])
  @@map("media_assets")
}
```

### Nota sobre `User.password` e Fase 1

Durante a Fase 1, a tabela `users` ainda referencia `auth.users` do Supabase (migration 001). O campo `password` é `null` para usuários existentes — a autenticação deles continua via Supabase Auth. Novos logins via API Fastify preenchem `password` com hash bcrypt.

Na Fase 3, a FK para `auth.users` é removida via migration e `password` passa a ser `NOT NULL`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: JWT round-trip preserva identidade do usuário

*Para qualquer* usuário válido que faz login com credenciais corretas, o access token emitido, quando verificado, deve retornar exatamente o `userId` e `role` do usuário que fez login.

**Validates: Requirements 3.1, 3.7**

### Property 2: Refresh token invalida após uso (rotação)

*Para qualquer* refresh token válido, após ser usado para emitir um novo access token, o token original deve ser marcado como `revoked = true` no banco e não deve mais ser aceito para emitir novos tokens.

**Validates: Requirements 3.1, 4.7**

### Property 3: `artist_id` nunca vem do token

*Para qualquer* request autenticado, o `artist_id` injetado no `AuthContext` deve ser igual ao valor retornado pela query `SELECT artist_id FROM users WHERE id = <userId_do_token>` — nunca igual a um valor arbitrário passado no body ou query string.

**Validates: Requirements 3.5**

### Property 4: Ownership impede acesso cruzado

*Para qualquer* par de artistas distintos A e B, uma operação de escrita (PATCH/DELETE) autenticada como A em um recurso pertencente a B deve retornar HTTP 403 — nunca HTTP 200 ou 204.

**Validates: Requirements 3.4, 3.7, 3.8**

### Property 5: Token expirado é rejeitado

*Para qualquer* access token com `exp` no passado, qualquer endpoint protegido deve retornar HTTP 401 com `{ "error": "Não autorizado" }`.

**Validates: Requirements 3.7**

### Property 6: Validação de input rejeita dados inválidos

*Para qualquer* payload que viole o schema Zod de um endpoint (campo obrigatório ausente, tipo errado, string fora dos limites), a API deve retornar HTTP 422 e o recurso no banco não deve ser criado ou modificado.

**Validates: Requirements 4.2, 4.3**

---

## Error Handling

### Padrão de resposta de erro

Todos os erros da API Fastify seguem o formato:

```json
{ "error": "Mensagem legível para o cliente" }
```

Erros de validação Zod retornam HTTP 422 com detalhes:

```json
{
  "error": "Dados inválidos",
  "details": { "fieldErrors": { "title": ["String must contain at least 2 character(s)"] } }
}
```

### Mapeamento de erros HTTP

| Situação                                      | HTTP | Corpo                                          |
|-----------------------------------------------|------|------------------------------------------------|
| Token ausente ou malformado                   | 401  | `{ "error": "Não autorizado" }`                |
| Token expirado                                | 401  | `{ "error": "Não autorizado" }`                |
| Token válido mas `artist_id` não existe       | 403  | `{ "error": "Perfil de artista não configurado" }` |
| Role insuficiente para a rota                 | 403  | `{ "error": "Permissão insuficiente" }`        |
| Recurso pertence a outro artista              | 403  | `{ "error": "Acesso negado" }`                 |
| Recurso não encontrado                        | 404  | `{ "error": "Não encontrado" }`                |
| Tipo de arquivo não permitido                 | 415  | `{ "error": "Tipo de arquivo não permitido" }` |
| Payload inválido (Zod)                        | 422  | `{ "error": "Dados inválidos", "details": … }` |
| Erro interno                                  | 500  | `{ "error": "Erro interno do servidor" }`      |

### Erros nunca expostos ao cliente

- Stack traces
- Mensagens de erro do Prisma (ex: constraint violations)
- Mensagens de erro do Supabase Storage
- Valores de tokens ou hashes

### Rollback de upload

Se o upload para o Supabase Storage for bem-sucedido mas o insert em `media_assets` falhar, o arquivo é removido do storage antes de retornar 500 — mantendo consistência entre banco e storage.

---

## Testing Strategy

### Avaliação de PBT para esta feature

Esta feature envolve principalmente:
- Lógica de autenticação JWT (geração, verificação, rotação de tokens)
- Validação de input com Zod
- Controle de acesso (ownership, roles)
- Migração de endpoints (comportamento equivalente)

PBT **é aplicável** para as propriedades de autenticação e controle de acesso, pois envolvem lógica pura testável com inputs gerados. As propriedades 1–6 acima são candidatas a property-based tests.

PBT **não é aplicável** para:
- Integração com Supabase Storage (custo alto, comportamento externo)
- Configuração de plugins Fastify (smoke tests)
- Fases de migração (testes de integração end-to-end)

### Testes unitários

Foco em casos específicos e condições de erro:

- `auth.service.ts`: login com credenciais corretas, login com senha errada, login com usuário inexistente
- `authenticate.ts` hook: token ausente, token expirado, token com userId inexistente no banco, role insuficiente
- Schemas Zod: payloads válidos e inválidos para cada endpoint
- `assertOwnership`: recurso do próprio artista, recurso de outro artista, admin bypassa ownership

### Testes de propriedade

Biblioteca: **fast-check** (TypeScript, compatível com Vitest)

Configuração mínima: 100 iterações por propriedade.

```typescript
// Exemplo — Property 4: Ownership impede acesso cruzado
// Feature: api-architecture-migration, Property 4: ownership prevents cross-artist access
it.prop([fc.uuid(), fc.uuid(), fc.uuid()])(
  'PATCH com artistId diferente retorna 403',
  async (userIdA, userIdB, resourceArtistId) => {
    fc.pre(userIdA !== userIdB && resourceArtistId !== userIdA)
    // gera AuthContext para userA, tenta acessar recurso de resourceArtistId
    // espera 403
  }
)
```

### Testes de integração

- Fluxo completo de login → uso de access token → refresh → logout
- Upload de arquivo: validação de MIME, rollback em falha de DB
- Proxy da Fase 1: Route Handler repassa request para API Fastify e retorna resposta equivalente

### Smoke tests

- API Fastify inicia com variáveis de ambiente válidas
- Prisma conecta ao banco na inicialização
- Plugins registrados: cors, jwt, rate-limit, sensible

### Estratégia de migração de testes

Durante a Fase 1, os testes dos Route Handlers existentes continuam passando. Novos testes são escritos para os endpoints Fastify equivalentes. Na Fase 3, os testes dos Route Handlers são removidos junto com os handlers.
