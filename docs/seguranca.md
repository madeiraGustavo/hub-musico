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

## Convivência Supabase Auth + JWT Próprio (Fase 1)

Durante a Fase 1, os dois sistemas de auth coexistem:

- **Sessões existentes:** continuam autenticadas via Supabase Auth (cookie de sessão SSR)
- **Novos logins via API Fastify:** usam JWT próprio (access token Bearer + refresh token cookie)
- **Middleware Next.js (`apps/web/src/middleware.ts`):** continua ativo para proteger rotas de UI (`/dashboard/*`) usando Supabase Auth — não é responsável por autenticar chamadas à API Fastify
- **Route Handlers existentes:** continuam usando `requireAuth()` com Supabase Admin client até serem migrados

A partir da Fase 2, todos os novos logins usam JWT próprio. Na Fase 3, o Supabase Auth é desativado e o Middleware é atualizado para validar o JWT próprio em vez de usar `supabase.auth.getUser()`.

## Variáveis de Ambiente Obrigatórias

A API Fastify falha no startup se qualquer variável obrigatória estiver ausente (validação via Zod em `src/env.ts`).

```env
# Banco de dados
DATABASE_URL=          # connection string direta ao PostgreSQL do Supabase

# JWT
JWT_SECRET=            # segredo para access tokens (mínimo 256 bits)
JWT_REFRESH_SECRET=    # segredo separado para refresh tokens (mínimo 256 bits)

# CORS
ALLOWED_ORIGINS=       # origens permitidas separadas por vírgula (ex: http://localhost:3000)

# Storage
STORAGE_BUCKET=        # nome do bucket no Supabase Storage
```

Variáveis adicionais necessárias no `apps/web` durante a Fase 1:
```env
NEXT_PUBLIC_SUPABASE_URL=       # necessário para o Middleware (Fase 1 e 2)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # necessário para o Middleware (Fase 1 e 2) — removido na Fase 3
NEXT_PUBLIC_API_URL=            # URL da API Fastify
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
- [ ] Rate limiting em endpoints de autenticação (`/auth/*`): 10 req/min via `@fastify/rate-limit`
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
