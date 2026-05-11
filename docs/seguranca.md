# Segurança

## Modelo de Autenticação

A API Fastify usa **JWT próprio** — não depende do Supabase Auth para autenticar chamadas de API.

### Access Token

- Tipo: JWT assinado com `JWT_SECRET`
- Duração: 15 minutos
- Transporte: header `Authorization: Bearer <token>`
- Payload: `{ sub: userId, iat, exp }` — `role` e `artist_id` são sempre buscados no banco, nunca lidos do token

### Refresh Token

- Tipo: JWT assinado com `JWT_REFRESH_SECRET` (segredo separado do access token)
- Duração: 7 dias
- Transporte: cookie HttpOnly, `SameSite: Strict`, `Secure` em produção
- Armazenamento: apenas o hash SHA-256 é persistido na tabela `refresh_tokens` — o token em si nunca é salvo
- Rotação: após cada uso, o token é revogado (`revoked = true`) e um novo par é emitido

### Hook `authenticate`

Equivalente ao `requireAuth()` dos Route Handlers, implementado como `preHandler` Fastify:

```typescript
// apps/api/src/hooks/authenticate.ts
export async function authenticate(request, reply) {
  // 1. Extrai Bearer token do header Authorization
  // 2. Verifica assinatura JWT com JWT_SECRET
  // 3. Busca role e artist_id no banco via Prisma (NUNCA do token)
  // 4. Injeta AuthContext em request.user
  // Falha → 401 { error: 'Não autorizado' }
}
```

`AuthContext` injetado em `request.user`:
```typescript
interface AuthContext {
  userId:   string  // users.id
  artistId: string  // artists.id — extraído do banco, nunca do token
  role:     'admin' | 'artist' | 'editor'
}
```

**`artist_id` vem sempre do banco:** para qualquer request autenticado, o `artistId` em `request.user` é o valor retornado por `SELECT artist_id FROM users WHERE id = <userId_do_token>`. Valores de `artist_id` passados no body, query string ou no próprio token são ignorados.

### Respostas de erro de autenticação

| Situação                                        | HTTP | Corpo                                              |
|-------------------------------------------------|------|----------------------------------------------------|
| Token ausente ou malformado                     | 401  | `{ "error": "Não autorizado" }`                    |
| Token expirado                                  | 401  | `{ "error": "Não autorizado" }`                    |
| Token válido mas `artist_id` não existe no banco| 403  | `{ "error": "Perfil de artista não configurado" }` |
| Role insuficiente para a rota                   | 403  | `{ "error": "Permissão insuficiente" }`            |
| Recurso pertence a outro artista                | 403  | `{ "error": "Acesso negado" }`                     |

## Modelo de Sessão e Logout

### Payload do JWT

O access token emitido pela API Fastify contém **apenas** `{ sub: userId, iat, exp }`. Os campos `artistId` e `role` **nunca** são incluídos no payload do token — eles são sempre buscados no banco de dados pelo hook `authenticate` a cada requisição autenticada.

```typescript
// Payload do access token — apenas sub
{ sub: "uuid-do-usuario", iat: 1700000000, exp: 1700000900 }

// O hook authenticate faz:
// SELECT id, role, artist_id FROM users WHERE id = payload.sub
// e injeta { userId, artistId, role } em request.user
```

Isso garante que alterações de `role` ou `artistId` no banco têm efeito imediato — sem necessidade de revogar tokens existentes.

### Proteção de sessão em duas camadas

| Camada | Responsável | Mecanismo | Escopo |
|--------|-------------|-----------|--------|
| 1ª linha | `middleware.ts` (Next.js) | Verifica presença do cookie `refreshToken` | Protege a UI — impede renderização de páginas do dashboard sem cookie |
| Autoridade final | `GET /auth/session` (API Fastify) | Valida assinatura JWT, busca usuário no banco | Valida o token de fato — retorna 401 para tokens inválidos, expirados ou revogados |

O `middleware.ts` é uma defesa de primeira linha que verifica apenas a **presença** do cookie `refreshToken` — não valida o JWT. A validação real ocorre na API Fastify via `GET /auth/session`, que é a autoridade final sobre o estado da sessão.

### Modelo de logout

`POST /auth/logout` **não requer Bearer token**. A revogação é feita via cookie `refreshToken`:

```
Client → POST /auth/logout (cookie refreshToken enviado automaticamente)
       → API verifica assinatura do refreshToken com JWT_REFRESH_SECRET
       → extrai userId do payload (sub)
       → revoga todos os refresh tokens do usuário no banco
       → limpa o cookie refreshToken na resposta
       → retorna 204
```

**Justificativa:** o access token pode ter expirado (duração de 15 min), mas o usuário ainda precisa conseguir fazer logout. Exigir Bearer nesse endpoint criaria uma janela onde o usuário fica "preso" com sessão ativa após expiração do access token.

| Situação | Comportamento |
|----------|---------------|
| Cookie `refreshToken` presente e válido | 204 — **todos** os refresh tokens do usuário são revogados (todos os dispositivos), cookie limpo |
| Cookie `refreshToken` ausente ou inválido | 400 `{ "error": "Refresh token ausente ou inválido" }` |

**Decisão de escopo:** `logout` chama `revokeAllUserTokens(userId)`, que revoga **todos** os refresh tokens do usuário no banco — não apenas o token atual. Isso garante que um logout em qualquer dispositivo invalida todas as sessões ativas. Se no futuro for necessário logout apenas do dispositivo atual, substituir por `revokeRefreshToken(tokenId)`.

## Variáveis de Ambiente Obrigatórias

A API Fastify falha no startup se qualquer variável obrigatória estiver ausente (validação via Zod em `src/env.ts`).

```env
# Banco de dados
DATABASE_URL=          # connection string direta ao PostgreSQL do Supabase

# JWT (mínimo 32 caracteres / 256 bits cada)
JWT_SECRET=            # segredo para access tokens
JWT_REFRESH_SECRET=    # segredo separado para refresh tokens

# CORS
ALLOWED_ORIGINS=       # origens permitidas separadas por vírgula (ex: http://localhost:3000)

# Storage
STORAGE_BUCKET=        # nome do bucket no Supabase Storage
SUPABASE_URL=          # URL do projeto Supabase (para Storage)
SUPABASE_SERVICE_ROLE_KEY= # chave de serviço do Supabase (para Storage)

# Servidor
PORT=3333              # porta da API (padrão: 3333)
```

Variável necessária no `apps/web`:
```env
NEXT_PUBLIC_API_URL=   # URL da API Fastify (ex: http://localhost:3333)
```

## OWASP Top 10 — Checklist por Feature

Toda feature desenvolvida deve ser revisada contra os itens abaixo antes de merge.

### A01 — Broken Access Control
- [ ] Endpoints privados protegidos pelo hook `authenticate` (equivalente ao `requireAuth()`)
- [ ] `artist_id` extraído do banco via Prisma — nunca do token JWT ou do body
- [ ] Verificação de ownership: operações de escrita validam que o recurso pertence ao `artistId` do `AuthContext`
- [ ] Roles validadas no service: `admin` bypassa ownership, `artist` e `editor` têm acesso apenas ao próprio artista, apenas `artist` e `admin` podem deletar

### A02 — Cryptographic Failures
- [ ] Senhas armazenadas com bcrypt (salt rounds 12)
- [ ] Access tokens JWT assinados com `JWT_SECRET` (mínimo 256 bits)
- [ ] Refresh tokens JWT assinados com `JWT_REFRESH_SECRET` separado
- [ ] Apenas o hash do refresh token é persistido no banco — nunca o token em si
- [ ] HTTPS obrigatório em produção
- [ ] Dados sensíveis (tokens, hashes, stack traces) nunca logados

### A03 — Injection
- [ ] Nunca usar SQL bruto — apenas Prisma ORM
- [ ] Nunca usar `innerHTML` — apenas `textContent` ou JSX com escape automático
- [ ] Inputs validados com Zod antes de qualquer processamento
- [ ] Parâmetros de rota e query sanitizados pelo Fastify

### A04 — Insecure Design
- [ ] Rate limiting por grupo de rotas via `@fastify/rate-limit` (`resolveLimit(url, method)`):
  - `POST /auth/login` → 5 req/min (endpoint de credenciais — mais restrito)
  - `POST /auth/refresh` → 10 req/min
  - demais `/auth/*` → 20 req/min
  - `/dashboard/*` → 100 req/min
  - `/upload` → 20 req/min
  - demais → 60 req/min
- [ ] Limite de tamanho em uploads: áudio máx 50 MB, imagem máx 5 MB
- [ ] Paginação obrigatória em listagens
- [ ] Rollback de upload: se insert em `media_assets` falhar após upload no Storage, o arquivo é removido do Storage

### A05 — Security Misconfiguration
- [ ] Variáveis de ambiente nunca commitadas
- [ ] `.env.example` com chaves sem valores reais
- [ ] CORS restrito a origens em `ALLOWED_ORIGINS`
- [ ] Cookie de refresh token: `HttpOnly`, `SameSite: Strict`, `Secure` em produção

### A06 — Vulnerable Components
- [ ] Dependências auditadas com `pnpm audit` antes de cada release
- [ ] Versões fixadas no `package.json` (sem `^` em produção)

### A07 — Authentication Failures
- [ ] JWT próprio emitido pela API Fastify — não depende do Supabase Auth para endpoints de API
- [ ] Access token com expiração curta (15 min)
- [ ] Refresh token com rotação: após uso, token original é revogado e novo par é emitido
- [ ] Logout revoga todos os refresh tokens do usuário no banco (`revokeAllUserTokens`)
- [ ] Token expirado → 401 `{ "error": "Não autorizado" }`
- [ ] `artist_id` inexistente no banco → 403 `{ "error": "Perfil de artista não configurado" }`

### A08 — Software and Data Integrity
- [ ] Uploads validados por MIME type (whitelist: `audio/mpeg`, `audio/wav`, `image/jpeg`, `image/png`, `image/webp`)
- [ ] Nome do arquivo gerado pelo servidor — nunca usar nome enviado pelo cliente
- [ ] Arquivos armazenados no Supabase Storage via `service_role` key — nunca servidos diretamente

### A09 — Logging Failures
- [ ] Logs estruturados (JSON) com nível, timestamp e request_id
- [ ] Erros de autenticação logados
- [ ] Tokens, hashes, senhas e stack traces nunca aparecem em logs
- [ ] Mensagens de erro do Prisma e do Supabase Storage nunca expostas ao cliente

### A10 — SSRF
- [ ] URLs externas nunca processadas sem whitelist
- [ ] Requisições a serviços internos não expostas via API pública

## Upload de Arquivos

- Tipos permitidos (whitelist explícita): `audio/mpeg`, `audio/wav`, `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: 50 MB para áudio, 5 MB para imagem
- Nome do arquivo gerado pelo servidor (UUID) — nome original sanitizado apenas para log
- Arquivos armazenados no Supabase Storage com `service_role` key
- `storage_key` nunca exposto diretamente — apenas URLs assinadas
- Rollback: se o insert em `media_assets` falhar após upload bem-sucedido no Storage, o arquivo é removido do Storage antes de retornar 500
