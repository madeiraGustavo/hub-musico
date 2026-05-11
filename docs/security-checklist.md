# Security Checklist — Rotas da API

Tabela de todas as rotas registradas na API Fastify, com status de autenticação e notas de segurança.

**Legenda:**
- ✅ `authenticate` — `preHandler: authenticate` presente na rota
- ❌ Pública — rota sem `preHandler: authenticate` (acesso livre)

---

## Módulo: `auth`

| Método | Caminho | Módulo | Requer `authenticate` | Notas |
|--------|---------|--------|-----------------------|-------|
| `POST` | `/auth/login` | `auth` | ❌ Pública | Endpoint de credenciais — rate limit mais restrito (5 req/min) |
| `POST` | `/auth/refresh` | `auth` | ❌ Pública | Renovação de tokens via cookie `refreshToken` |
| `POST` | `/auth/logout` | `auth` | ❌ Pública | **Decisão documentada:** revogação via cookie `refreshToken` — Bearer não obrigatório pois o access token pode ter expirado. O handler lê e invalida o `refreshToken` do cookie diretamente. |
| `GET` | `/auth/session` | `auth` | ✅ Sim | **Exceção de formato:** retorna objeto direto `{ authenticated, user, artist }` sem wrapper `{ data }`. Todos os demais endpoints usam `{ data }`. Autoridade final de validação de sessão — retorna 401 para tokens inválidos, expirados ou revogados. |

---

## Módulo: `profile`

| Método | Caminho | Módulo | Requer `authenticate` | Notas |
|--------|---------|--------|-----------------------|-------|
| `GET` | `/dashboard/profile` | `profile` | ✅ Sim | Retorna perfil do artista autenticado |
| `PATCH` | `/dashboard/profile` | `profile` | ✅ Sim | Atualiza campos do perfil — `artistId` resolvido via banco, nunca do JWT |

---

## Módulo: `tracks`

| Método | Caminho | Módulo | Requer `authenticate` | Notas |
|--------|---------|--------|-----------------------|-------|
| `GET` | `/dashboard/tracks` | `tracks` | ✅ Sim | Lista tracks do artista autenticado |
| `POST` | `/dashboard/tracks` | `tracks` | ✅ Sim | Cria nova track — `artistId` resolvido via banco |
| `PATCH` | `/dashboard/tracks/:id` | `tracks` | ✅ Sim | Atualiza track — verifica ownership (403 se não for dono) |
| `DELETE` | `/dashboard/tracks/:id` | `tracks` | ✅ Sim | Remove track — verifica ownership (403 se não for dono) |

---

## Módulo: `projects`

| Método | Caminho | Módulo | Requer `authenticate` | Notas |
|--------|---------|--------|-----------------------|-------|
| `GET` | `/dashboard/projects` | `projects` | ✅ Sim | Lista projetos do artista autenticado |
| `POST` | `/dashboard/projects` | `projects` | ✅ Sim | Cria novo projeto — `artistId` resolvido via banco |
| `PATCH` | `/dashboard/projects/:id` | `projects` | ✅ Sim | Atualiza projeto — verifica ownership (403 se não for dono) |
| `DELETE` | `/dashboard/projects/:id` | `projects` | ✅ Sim | Remove projeto — verifica ownership (403); apenas projetos com `status: 'draft'` podem ser removidos (422 caso contrário) |

---

## Módulo: `services`

| Método | Caminho | Módulo | Requer `authenticate` | Notas |
|--------|---------|--------|-----------------------|-------|
| `GET` | `/dashboard/services` | `services` | ✅ Sim | Lista serviços do artista autenticado |
| `POST` | `/dashboard/services` | `services` | ✅ Sim | Cria novo serviço — `artistId` resolvido via banco |
| `PATCH` | `/dashboard/services/:id` | `services` | ✅ Sim | Atualiza serviço — verifica ownership (403 se não for dono) |
| `DELETE` | `/dashboard/services/:id` | `services` | ✅ Sim | Remove serviço — verifica ownership (403 se não for dono) |

---

## Módulo: `upload`

| Método | Caminho | Módulo | Requer `authenticate` | Notas |
|--------|---------|--------|-----------------------|-------|
| `POST` | `/upload` | `upload` | ✅ Sim | Upload de arquivo para Supabase Storage — rate limit 20 req/min |

---

## Resumo de Verificação

| Critério | Status |
|----------|--------|
| Todas as rotas de escrita (`POST`, `PATCH`, `DELETE`) têm `authenticate` | ✅ Sim — exceto `POST /auth/logout` (decisão documentada) |
| Todas as rotas `GET` de dados protegidos têm `authenticate` | ✅ Sim |
| `POST /auth/login` e `POST /auth/refresh` são públicas por design | ✅ Correto |
| `POST /auth/logout` é pública por decisão explícita | ✅ Documentado |
| `GET /auth/session` retorna objeto direto sem `{ data }` | ✅ Exceção documentada |
| `artistId` e `role` nunca vêm do JWT — sempre do banco via `authenticate` hook | ✅ Verificado em `hooks/authenticate.ts` |

---

## Exceções Documentadas

### `POST /auth/logout` — Rota pública por design

O logout aceita revogação via cookie `refreshToken` sem exigir Bearer token no header `Authorization`. Isso é intencional: o access token pode ter expirado, mas o usuário ainda precisa conseguir fazer logout. O handler lê o cookie `refreshToken`, verifica a assinatura com `JWT_REFRESH_SECRET`, extrai o `userId` e invalida a sessão no banco. O cookie é limpo na resposta independentemente do resultado.

### `GET /auth/session` — Exceção de formato de resposta

Esta é a única rota que retorna o objeto de resposta diretamente, sem o wrapper `{ data: ... }` usado por todos os demais endpoints. O objeto `SessionData` já contém `authenticated: true` como discriminador, tornando o wrapper redundante. Todos os outros endpoints continuam usando `{ data }`.
