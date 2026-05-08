# Plano de Implementação: api-architecture-migration

## Visão Geral

Migração do hub-art de Supabase-first para Fastify-first em três fases. Este plano cobre a **Fase 1 completa** (setup da API + módulo de auth) e a **estrutura base** para as Fases 2 e 3 (módulos de dashboard e upload). A implementação segue a ordem: infraestrutura → Prisma → plugins → libs JWT/password → hook de auth → módulo auth → checkpoint → esqueletos → wiring → documentação → checkpoint final.

---

## Tasks

- [x] 1. Inicializar o projeto `apps/api`
  - Criar `apps/api/package.json` com dependências: `fastify`, `@fastify/jwt`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/sensible`, `@fastify/cookie`, `@prisma/client`, `bcryptjs`, `zod`, `dotenv`; devDependencies: `typescript`, `tsx`, `vitest`, `@vitest/coverage-v8`, `fast-check`, `@types/bcryptjs`, `@types/node`, `prisma`
  - Criar `apps/api/tsconfig.json` com `target: ES2022`, `module: Node16`, `strict: true`, `outDir: dist`
  - Criar `apps/api/.env.example` com as variáveis: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`, `STORAGE_BUCKET`, `PORT`
  - Criar `apps/api/src/env.ts` com validação Zod das variáveis de ambiente obrigatórias — falha em startup se alguma estiver ausente
  - _Requirements: 3.2, 5.6_

- [x] 2. Configurar Prisma e schema do banco
  - Criar `apps/api/prisma/schema.prisma` com o schema completo derivado das migrations 001–009: enums (`UserRole`, `ArtistType`, `TrackGenre`, `ProjectPlatform`, `ProjectStatus`, `ServiceIcon`, `MediaType`) e models (`User`, `Artist`, `RefreshToken`, `Track`, `Project`, `Service`, `MediaAsset`) conforme definido no design
  - Criar `apps/api/src/lib/prisma.ts` com singleton `PrismaClient` — reutiliza instância entre hot-reloads em dev
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 5.6_

- [x] 3. Implementar factory Fastify e plugins
  - Criar `apps/api/src/app.ts` com a factory `buildApp()` que instancia o Fastify e registra todos os plugins — separado de `server.ts` para permitir testes sem bind de porta
  - Criar `apps/api/src/server.ts` que chama `buildApp()` e faz `listen` na porta definida em `env.PORT`
  - Criar `apps/api/src/plugins/cors.ts` registrando `@fastify/cors` com `origin` lido de `env.ALLOWED_ORIGINS` (split por vírgula)
  - Criar `apps/api/src/plugins/jwt.ts` registrando `@fastify/jwt` com `secret: env.JWT_SECRET` e `sign.expiresIn: '15m'`; registrar também `@fastify/cookie` para suporte ao cookie de refresh
  - Criar `apps/api/src/plugins/rateLimit.ts` registrando `@fastify/rate-limit` com limite de 10 req/min para rotas `/auth/*`
  - Criar `apps/api/src/plugins/sensible.ts` registrando `@fastify/sensible` para helpers de erro HTTP
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 4. Implementar libs JWT, password e tipos
  - Criar `apps/api/src/types/fastify.d.ts` com augmentação de `FastifyRequest` adicionando `user: AuthContext` onde `AuthContext = { userId: string; artistId: string; role: 'admin' | 'artist' | 'editor' }`
  - Criar `apps/api/src/lib/password.ts` com funções `hashPassword(plain: string)` e `verifyPassword(plain: string, hash: string)` usando `bcryptjs` com salt rounds 12
  - Criar `apps/api/src/lib/storage.ts` instanciando cliente Supabase com `service_role` key; exportar `uploadFile(bucket, key, buffer, mimeType)` e `deleteFile(bucket, key)`
  - _Requirements: 3.1, 3.2, 5.2_

- [x] 5. Implementar hook `authenticate.ts`
  - Criar `apps/api/src/hooks/authenticate.ts` como `preHandler` que: (1) extrai Bearer token do header `Authorization`, (2) verifica assinatura com `JWT_SECRET` via `@fastify/jwt`, (3) busca `role` e `artist_id` no banco via Prisma — nunca do token, (4) retorna 401 se token ausente/inválido/expirado, (5) retorna 403 se `artist_id` não existir no banco, (6) injeta `AuthContext` em `request.user`
  - _Requirements: 3.1, 3.4, 3.5, 3.7, 3.8_

- [ ] 5.1 Escrever testes unitários para o hook `authenticate.ts`
  - Testar: token ausente → 401, token malformado → 401, token expirado → 401, token válido mas `artist_id` nulo → 403, token válido com `artist_id` → injeta `AuthContext` corretamente
  - _Requirements: 3.7, 3.8_

- [ ] 5.2 Escrever property test — Property 5: Token expirado é rejeitado
  - **Property 5: Token expirado é rejeitado**
  - Para qualquer access token com `exp` no passado, qualquer endpoint protegido deve retornar HTTP 401 com `{ "error": "Não autorizado" }`
  - Usar `fc.integer()` para gerar timestamps no passado; assinar tokens com `exp` expirado e verificar que `authenticate` retorna 401
  - **Validates: Requirements 3.7**

- [ ] 5.3 Escrever property test — Property 3: `artist_id` nunca vem do token
  - **Property 3: `artist_id` nunca vem do token**
  - Para qualquer request autenticado, o `artist_id` em `request.user` deve ser igual ao valor retornado pela query `SELECT artist_id FROM users WHERE id = <userId>` — nunca igual a um valor arbitrário passado no body ou query string
  - Usar `fc.uuid()` para gerar `artistId` arbitrários no body/query e verificar que o hook sempre usa o valor do banco
  - **Validates: Requirements 3.5**

- [x] 6. Implementar módulo de autenticação (Fase 1 — prioridade)
  - [x] 6.1 Criar `apps/api/src/modules/auth/auth.schema.ts`
    - Definir `LoginSchema` com Zod: `{ email: z.string().email(), password: z.string().min(6) }`
    - Definir `RefreshSchema` com Zod: `{ refreshToken: z.string().optional() }` (aceita cookie ou body)
    - _Requirements: 3.1, 4.2_

  - [x] 6.2 Criar `apps/api/src/modules/auth/auth.repository.ts`
    - `findUserByEmail(email: string)`: busca `User` com `password` e `role` pelo email
    - `findUserById(id: string)`: busca `User` com `artistId` e `role` pelo id
    - `createRefreshToken(userId, tokenHash, expiresAt)`: insere registro em `refresh_tokens`
    - `findRefreshToken(tokenHash)`: busca token não revogado e não expirado
    - `revokeRefreshToken(id)`: marca `revoked = true`
    - `revokeAllUserTokens(userId)`: revoga todos os tokens do usuário (logout)
    - _Requirements: 3.1, 4.7_

  - [x] 6.3 Criar `apps/api/src/modules/auth/auth.service.ts`
    - `login(email, password)`: valida credenciais com `verifyPassword`, emite access token (JWT, 15 min) e refresh token (JWT com `JWT_REFRESH_SECRET`, 7 dias), persiste hash do refresh token no banco, retorna `{ accessToken, refreshToken }`
    - `refresh(tokenFromCookieOrBody)`: verifica assinatura com `JWT_REFRESH_SECRET`, busca hash no banco, verifica `revoked` e `expiresAt`, revoga token atual, emite novo par de tokens (rotação), retorna `{ accessToken, refreshToken }`
    - `logout(userId)`: chama `revokeAllUserTokens(userId)`
    - `getSession(userId)`: retorna dados públicos do usuário via `findUserById`
    - _Requirements: 3.1, 4.7_

  - [ ] 6.4 Escrever testes unitários para `auth.service.ts`
    - Testar: login com credenciais corretas, login com senha errada → lança erro, login com email inexistente → lança erro, refresh com token revogado → lança erro, refresh com token expirado → lança erro
    - _Requirements: 3.1_

  - [ ] 6.5 Escrever property test — Property 1: JWT round-trip preserva identidade
    - **Property 1: JWT round-trip preserva identidade do usuário**
    - Para qualquer usuário válido que faz login, o access token emitido, quando verificado, deve retornar exatamente o `userId` e `role` do usuário que fez login — sem mutação
    - Usar `fc.record({ userId: fc.uuid(), role: fc.constantFrom('admin', 'artist', 'editor') })` para gerar contextos de usuário
    - **Validates: Requirements 3.1, 3.7**

  - [ ] 6.6 Escrever property test — Property 2: Refresh token invalida após uso
    - **Property 2: Refresh token invalida após uso (rotação)**
    - Para qualquer refresh token válido, após ser usado para emitir um novo access token, o token original deve ter `revoked = true` no banco e não deve mais ser aceito
    - Usar `fc.uuid()` para gerar `userId`s e simular ciclo completo de rotação
    - **Validates: Requirements 3.1, 4.7**

  - [x] 6.7 Criar `apps/api/src/modules/auth/auth.controller.ts`
    - `POST /auth/login`: valida body com `LoginSchema`, chama `auth.service.login`, define cookie HttpOnly `refreshToken` (7 dias, `sameSite: strict`), retorna `{ accessToken, user: { id, email } }`
    - `POST /auth/refresh`: lê refresh token do cookie `refreshToken` ou do body, chama `auth.service.refresh`, atualiza cookie, retorna `{ accessToken }`
    - `POST /auth/logout`: usa hook `authenticate`, chama `auth.service.logout`, limpa cookie, retorna 204
    - `GET /auth/session`: usa hook `authenticate`, chama `auth.service.getSession`, retorna dados do usuário
    - _Requirements: 3.1, 3.7_

  - [x] 6.8 Criar `apps/api/src/modules/auth/auth.routes.ts`
    - Registrar as 4 rotas de auth no Fastify com os schemas de validação e os preHandlers corretos
    - _Requirements: 3.1, 4.1_

- [x] 7. Checkpoint — Fase 1 funcional
  - Garantir que todos os testes não-opcionais passam, que a API inicia sem erros com variáveis de ambiente válidas, e que o fluxo login → refresh → logout funciona end-to-end
  - _Requirements: 4.1, 4.9_

- [ ] 7.1 Escrever property test — Property 4: Ownership impede acesso cruzado
  - **Property 4: Ownership impede acesso cruzado**
  - Para qualquer par de artistas distintos A e B, uma operação de escrita (PATCH/DELETE) autenticada como A em um recurso pertencente a B deve retornar HTTP 403 — nunca HTTP 200 ou 204
  - Usar `fc.uuid()` para gerar `userIdA`, `userIdB`, `resourceArtistId` com pré-condição `userIdA !== userIdB && resourceArtistId !== userIdA`
  - **Validates: Requirements 3.4, 3.7, 3.8**

- [ ] 7.2 Escrever property test — Property 6: Validação de input rejeita dados inválidos
  - **Property 6: Validação de input rejeita dados inválidos**
  - Para qualquer payload que viole o schema Zod de um endpoint (campo obrigatório ausente, tipo errado, string fora dos limites), a API deve retornar HTTP 422 e o recurso no banco não deve ser criado ou modificado
  - Usar `fc.record()` com campos intencionalmente inválidos (strings vazias, números negativos, tipos errados) para cada schema Zod definido
  - **Validates: Requirements 4.2, 4.3**

- [x] 8. Criar esqueletos dos módulos de dashboard (estrutura para Fase 2)
  - [x] 8.1 Criar esqueleto do módulo `profile`
    - Criar `apps/api/src/modules/profile/profile.schema.ts` com `UpdateProfileSchema` Zod (campos opcionais: `name`, `tagline`, `bio`, `location`, `reach`, `email`, `whatsapp`, `skills`, `tools`)
    - Criar `apps/api/src/modules/profile/profile.repository.ts` com stubs: `findByArtistId(artistId)` e `update(artistId, data)`
    - Criar `apps/api/src/modules/profile/profile.controller.ts` com stubs para `GET /dashboard/profile` e `PATCH /dashboard/profile` — retornam 501 Not Implemented
    - Criar `apps/api/src/modules/profile/profile.routes.ts` registrando as rotas com hook `authenticate`
    - _Requirements: 4.6_

  - [x] 8.2 Criar esqueleto do módulo `tracks`
    - Criar `apps/api/src/modules/tracks/tracks.schema.ts` com `CreateTrackSchema` e `UpdateTrackSchema` Zod (espelha validação do Route Handler atual em `apps/web/src/app/api/dashboard/tracks/route.ts`)
    - Criar `apps/api/src/modules/tracks/tracks.repository.ts` com stubs: `findAllByArtist`, `findById`, `create`, `update`, `remove`
    - Criar `apps/api/src/modules/tracks/tracks.controller.ts` com stubs para GET, POST, PATCH `:id`, DELETE `:id` — retornam 501
    - Criar `apps/api/src/modules/tracks/tracks.routes.ts` registrando as rotas com hook `authenticate`
    - _Requirements: 4.6_

  - [x] 8.3 Criar esqueleto do módulo `projects`
    - Criar `apps/api/src/modules/projects/projects.schema.ts` com `CreateProjectSchema` e `UpdateProjectSchema` Zod
    - Criar `apps/api/src/modules/projects/projects.repository.ts` com stubs: `findAllByArtist`, `findById`, `create`, `update`
    - Criar `apps/api/src/modules/projects/projects.controller.ts` com stubs para GET, POST — retornam 501
    - Criar `apps/api/src/modules/projects/projects.routes.ts` registrando as rotas com hook `authenticate`
    - _Requirements: 4.6_

  - [x] 8.4 Criar esqueleto do módulo `services`
    - Criar `apps/api/src/modules/services/services.schema.ts` com `CreateServiceSchema`, `UpdateServiceSchema` Zod
    - Criar `apps/api/src/modules/services/services.repository.ts` com stubs: `findAllByArtist`, `findById`, `create`, `update`, `remove`
    - Criar `apps/api/src/modules/services/services.controller.ts` com stubs para GET, POST, PATCH `:id`, DELETE `:id` — retornam 501
    - Criar `apps/api/src/modules/services/services.routes.ts` registrando as rotas com hook `authenticate`
    - _Requirements: 4.6_

- [x] 9. Criar esqueleto do módulo `upload` (estrutura para Fase 2)
  - Criar `apps/api/src/modules/upload/upload.schema.ts` com validação Zod do multipart: `mimeType` deve ser `audio/mpeg`, `audio/wav`, `image/jpeg`, `image/png`, `image/webp`; `sizeBytes` máximo 50 MB para áudio e 5 MB para imagem
  - Criar `apps/api/src/modules/upload/upload.service.ts` com stub `uploadMedia(artistId, file)` — retorna 501; incluir comentário documentando a lógica de rollback (delete do storage se insert em `media_assets` falhar)
  - Criar `apps/api/src/modules/upload/upload.controller.ts` com stub para `POST /upload` — retorna 501
  - Criar `apps/api/src/modules/upload/upload.routes.ts` registrando a rota com hook `authenticate`
  - _Requirements: 4.6, 5.2_

- [x] 10. Wiring final — registrar todos os módulos no `app.ts`
  - Atualizar `apps/api/src/app.ts` para registrar os plugins e todas as rotas dos módulos (auth, profile, tracks, projects, services, upload) com prefixos corretos
  - Verificar que `GET /auth/session` retorna 200 com token válido e 401 sem token
  - Verificar que `POST /auth/login` com credenciais inválidas retorna 401
  - Verificar que rotas de dashboard retornam 501 (esqueletos prontos para Fase 2)
  - _Requirements: 4.1, 4.2, 4.9_

- [x] 11. Atualizar documentação (docs/)
  - Atualizar `docs/arquitetura.md`: descrever `apps/api` como servidor Fastify responsável por toda lógica de negócio e auth; descrever `apps/web` como frontend exclusivo; documentar stack real (Next.js, Fastify + Prisma, PostgreSQL via Supabase, Supabase Storage, JWT próprio); documentar fluxo `Web → API → Prisma → PostgreSQL`; documentar fluxo de auth JWT (login, Bearer header, refresh via cookie); documentar as três fases com critérios de entrada/saída; deixar explícito que novos endpoints de negócio vão na API Fastify
  - Atualizar `docs/modelagem.md`: documentar todas as entidades das migrations 001–009; documentar `RefreshToken`; incluir `profile_type` na entidade `Artist`; documentar que `password` e `RefreshToken` são gerenciados pela API Fastify; documentar índices existentes e novos; documentar relação `auth.users` ↔ `users` durante Fase 1
  - Atualizar `docs/seguranca.md`: documentar novo modelo de auth JWT (access token Bearer, refresh token cookie HttpOnly); documentar variáveis de ambiente obrigatórias; atualizar checklist OWASP Top 10 para o novo modelo; descrever padrão `authenticate` hook como equivalente ao `requireAuth()`; documentar que `artist_id` vem sempre do banco; documentar convivência Supabase Auth + JWT próprio na Fase 1; documentar que Middleware Next.js continua ativo na Fase 1
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 12. Checkpoint final
  - Garantir que todos os testes não-opcionais passam
  - Verificar que a documentação reflete o estado real da implementação
  - Confirmar que a API inicia com variáveis de ambiente válidas e o fluxo completo login → uso → refresh → logout funciona
  - _Requirements: 4.1, 4.9_

---

## Fase 2 — Migração completa dos módulos de negócio

A Fase 2 implementa a lógica real nos módulos que retornam 501 desde a Fase 1, migra o frontend para chamar exclusivamente a API Fastify, e remove os Route Handlers de negócio do Next.js. Ao final desta fase, `apps/web` é frontend puro.

- [x] 13. Implementar módulo `profile` (substituir stubs por lógica real)
  - [x] 13.1 Implementar `profile.repository.ts`
    - `findByArtistId(artistId)`: já implementado com Prisma — verificar que retorna todos os campos necessários: `id`, `name`, `slug`, `tagline`, `bio`, `location`, `reach`, `email`, `whatsapp`, `skills`, `tools`, `isActive`, `createdAt`
    - `update(artistId, data)`: já implementado — garantir que campos `email` e `whatsapp` são atualizados apenas quando presentes no payload (campos sensíveis)
    - _Requirements: 4.4, 4.6_

  - [x] 13.2 Implementar `profile.controller.ts`
    - `getProfileHandler`: chama `findByArtistId(request.user.artistId)`, retorna 404 se não encontrado, retorna 200 com `{ data }` espelhando o Route Handler atual
    - `updateProfileHandler`: valida body com `UpdateProfileSchema`, aplica restrição de campos sensíveis (`email`, `whatsapp`) apenas para roles `artist` e `admin` — `editor` recebe 403 se tentar alterar esses campos, chama `update(artistId, filteredData)`, retorna 200 com `{ data }`
    - _Requirements: 3.4, 4.4, 4.6_

  - [x] 13.3 Escrever testes unitários para `profile.controller.ts`
    - Testar: GET retorna perfil correto, GET retorna 404 se artista não existe, PATCH com role `editor` tentando alterar `email` → 403, PATCH com campos válidos → 200
    - _Requirements: 3.4, 4.4_

- [x] 14. Implementar módulo `tracks` (substituir stubs por lógica real)
  - [x] 14.1 Implementar `tracks.repository.ts`
    - `findAllByArtist(artistId)`: `prisma.track.findMany({ where: { artistId }, orderBy: { sortOrder: 'asc' }, select: { id, title, genre, genreLabel, duration, key, isPublic, sortOrder, createdAt } })`
    - `findById(id)`: `prisma.track.findUnique({ where: { id }, select: { id, artistId } })` — usado para verificação de ownership
    - `create(artistId, data)`: `prisma.track.create({ data: { ...data, artistId } })` — `artistId` vem do `AuthContext`, nunca do body
    - `update(id, artistId, data)`: `prisma.track.update({ where: { id, artistId }, data })` — double-check de ownership na query
    - `remove(id, artistId)`: `prisma.track.delete({ where: { id, artistId } })` — double-check de ownership na query
    - _Requirements: 3.4, 3.5, 4.6_

  - [x] 14.2 Implementar `tracks.controller.ts`
    - `getTracksHandler`: chama `findAllByArtist(request.user.artistId)`, retorna 200 com `{ data }`
    - `createTrackHandler`: valida body com `CreateTrackSchema`, chama `create(artistId, parsed.data)`, retorna 201 com `{ data }`
    - `updateTrackHandler`: busca track via `findById(params.id)`, verifica ownership (track.artistId === request.user.artistId ou role === 'admin'), valida body com `UpdateTrackSchema`, chama `update(id, artistId, parsed.data)`, retorna 200 com `{ data }`
    - `deleteTrackHandler`: busca track via `findById(params.id)`, verifica ownership, chama `remove(id, artistId)`, retorna 204
    - _Requirements: 3.4, 3.5, 4.3, 4.6_

  - [x] 14.3 Escrever testes unitários para `tracks.controller.ts`
    - Testar: GET lista tracks do artista correto, POST cria track com `artistId` do JWT (não do body), PATCH em track de outro artista → 403, DELETE com role `editor` → 403, PATCH em track inexistente → 404
    - _Requirements: 3.4, 3.5, 4.3_

- [x] 15. Implementar módulo `projects` (substituir stubs por lógica real)
  - [x] 15.1 Implementar `projects.repository.ts`
    - `findAllByArtist(artistId)`: `prisma.project.findMany({ where: { artistId }, orderBy: { sortOrder: 'asc' }, select: { id, title, platform, tags, href, featured, status, sortOrder, createdAt } })`
    - `findById(id)`: `prisma.project.findUnique({ where: { id }, select: { id, artistId } })` — para verificação de ownership
    - `create(artistId, data)`: `prisma.project.create({ data: { ...data, artistId } })`
    - `update(id, artistId, data)`: `prisma.project.update({ where: { id, artistId }, data })`
    - _Requirements: 3.4, 3.5, 4.6_

  - [x] 15.2 Implementar `projects.controller.ts`
    - `getProjectsHandler`: chama `findAllByArtist(request.user.artistId)`, retorna 200 com `{ data }`
    - `createProjectHandler`: valida body com `CreateProjectSchema`, chama `create(artistId, parsed.data)`, retorna 201 com `{ data }`
    - _Requirements: 3.4, 4.3, 4.6_

  - [x] 15.3 Escrever testes unitários para `projects.controller.ts`
    - Testar: GET lista projetos do artista correto, POST cria projeto com `artistId` do JWT, POST com `href` inválida → 422
    - _Requirements: 3.4, 4.3_

- [x] 16. Implementar módulo `services` (substituir stubs por lógica real)
  - [x] 16.1 Implementar `services.repository.ts`
    - `findAllByArtist(artistId)`: `prisma.service.findMany({ where: { artistId }, orderBy: { sortOrder: 'asc' }, select: { id, icon, title, description, items, price, highlight, sortOrder, active, createdAt } })`
    - `findById(id)`: `prisma.service.findUnique({ where: { id }, select: { id, artistId } })` — para verificação de ownership
    - `create(artistId, data)`: `prisma.service.create({ data: { ...data, artistId } })`
    - `update(id, artistId, data)`: `prisma.service.update({ where: { id, artistId }, data })`
    - `remove(id, artistId)`: `prisma.service.delete({ where: { id, artistId } })`
    - _Requirements: 3.4, 3.5, 4.6_

  - [x] 16.2 Implementar `services.controller.ts`
    - `getServicesHandler`: chama `findAllByArtist(request.user.artistId)`, retorna 200 com `{ data }`
    - `createServiceHandler`: valida body com `CreateServiceSchema`, chama `create(artistId, parsed.data)`, retorna 201 com `{ data }`
    - `updateServiceHandler`: busca service via `findById(params.id)`, verifica ownership, valida body com `UpdateServiceSchema`, chama `update(id, artistId, parsed.data)`, retorna 200 com `{ data }`
    - `deleteServiceHandler`: busca service via `findById(params.id)`, verifica ownership (apenas roles `artist` e `admin`), chama `remove(id, artistId)`, retorna 204
    - _Requirements: 3.4, 3.5, 4.3, 4.6_

  - [x] 16.3 Escrever testes unitários para `services.controller.ts`
    - Testar: GET lista serviços do artista correto, POST cria serviço com `artistId` do JWT, PATCH em serviço de outro artista → 403, DELETE com role `editor` → 403
    - _Requirements: 3.4, 3.5, 4.3_

- [x] 17. Implementar módulo `upload` (substituir stub por lógica real)
  - [x] 17.1 Criar `apps/api/src/lib/validateMime.ts`
    - Portar a lógica de `apps/web/src/lib/upload/validateMime.ts` para a API Fastify
    - `validateMime(buffer: ArrayBuffer, declaredMime: string): Promise<{ valid: boolean; error?: string }>` — valida por magic bytes, não apenas pelo Content-Type declarado
    - `getMediaCategory(mimeType: string): 'audio' | 'image' | null` — retorna categoria ou null se MIME não permitido
    - Bloquear SVG e tipos não listados em `ALLOWED_MIMES` explicitamente
    - _Requirements: 4.5, 5.2_

  - [x] 17.2 Implementar `upload.service.ts`
    - `uploadMedia(artistId, file: { buffer: Buffer; mimeType: string; size: number })`:
      1. Chama `getMediaCategory(mimeType)` — retorna 415 se não permitido
      2. Verifica `size` contra `SIZE_LIMITS[category]` — retorna 413 se exceder
      3. Chama `validateMime(buffer, mimeType)` — retorna 415 se magic bytes inválidos
      4. Gera `storageKey = \`${artistId}/${category}/${randomUUID()}.${ext}\`` — nunca usa nome do cliente
      5. Chama `storage.uploadFile(env.STORAGE_BUCKET, storageKey, buffer, mimeType)`
      6. Insere registro em `media_assets` via `prisma.mediaAsset.create()`
      7. **Rollback**: se o insert falhar, chama `storage.deleteFile(env.STORAGE_BUCKET, storageKey)` antes de lançar erro
      8. Retorna URL assinada via `supabase.storage.createSignedUrl(storageKey, 3600)` — nunca a `storageKey` direta
    - _Requirements: 4.5, 5.2, 5.3_

  - [x] 17.3 Implementar `upload.controller.ts`
    - `uploadHandler`: lê multipart via `request.file()` (requer `@fastify/multipart`), extrai `buffer`, `mimeType` e `size`, chama `uploadMedia(request.user.artistId, file)`, retorna 201 com `{ id, url, mimeType, sizeBytes, createdAt }`
    - Adicionar `@fastify/multipart` como dependência em `apps/api/package.json`
    - Registrar plugin `@fastify/multipart` em `apps/api/src/app.ts` com limite de `fileSize: 50 * 1024 * 1024`
    - _Requirements: 4.5, 5.2_

  - [x] 17.4 Escrever testes unitários para `upload.service.ts`
    - Testar: MIME não permitido → lança erro 415, arquivo acima do limite → lança erro 413, magic bytes inválidos → lança erro 415, falha no insert após upload → rollback chama `deleteFile`, upload bem-sucedido → retorna URL assinada
    - _Requirements: 4.5, 5.2, 5.3_

- [x] 18. Checkpoint — todos os endpoints da API Fastify funcionais
  - Verificar que todos os módulos retornam respostas corretas (não mais 501)
  - Verificar que ownership é aplicado em todos os endpoints de escrita (PATCH/DELETE)
  - Verificar que `artist_id` nunca vem do body — sempre do `AuthContext`
  - Verificar que upload faz rollback correto em caso de falha no banco
  - _Requirements: 3.4, 3.5, 4.3, 4.5, 4.6_

- [x] 19. Migrar o frontend (`apps/web`) para chamar a API Fastify
  - [x] 19.1 Criar `apps/web/src/lib/api/client.ts`
    - Criar cliente HTTP tipado com `baseUrl = process.env.NEXT_PUBLIC_API_URL`
    - Implementar `apiGet<T>(path)` e `apiPost<T>(path, body)`, `apiPatch<T>(path, body)`, `apiDelete(path)` — todos injetam `Authorization: Bearer <accessToken>` e `credentials: 'include'` para o cookie de refresh
    - Implementar interceptor de 401: tenta `POST /auth/refresh` automaticamente uma vez, se falhar redireciona para login
    - Armazenar `accessToken` em memória (variável de módulo) — nunca em `localStorage`
    - _Requirements: 4.1, 4.8_

  - [x] 19.2 Migrar chamadas de auth no frontend
    - Atualizar `apps/web/src/app/api/auth/login/route.ts` para fazer proxy para `POST ${API_URL}/auth/login` — repassa body e cookies de resposta
    - Atualizar `apps/web/src/app/api/auth/session/route.ts` para fazer proxy para `GET ${API_URL}/auth/session` com Bearer token
    - Manter os Route Handlers de auth como proxies temporários durante a Fase 2 para não quebrar o Middleware do Next.js
    - _Requirements: 4.1, 4.8_

  - [x] 19.3 Migrar chamadas de dashboard no frontend
    - Atualizar todos os `fetch('/api/dashboard/...')` nos componentes e pages de `apps/web/src/app/dashboard/` para usar o `apiClient` apontando para `${API_URL}/dashboard/...`
    - Atualizar chamadas de upload de `fetch('/api/upload')` para `${API_URL}/upload`
    - Garantir que o `accessToken` é enviado em todas as chamadas autenticadas
    - _Requirements: 4.1, 4.8_

  - [x] 19.4 Escrever testes de integração para o fluxo Web → API
    - Testar fluxo completo: login via proxy → recebe `accessToken` → chama `/dashboard/tracks` com Bearer → recebe dados
    - Testar refresh automático: simular 401 em chamada de dashboard → interceptor faz refresh → retry bem-sucedido
    - _Requirements: 4.1, 4.8, 4.9_

- [x] 20. Remover Route Handlers de negócio do Next.js (Fase 3 — limpeza)
  - Remover `apps/web/src/app/api/dashboard/tracks/route.ts` e `apps/web/src/app/api/dashboard/tracks/[id]/route.ts`
  - Remover `apps/web/src/app/api/dashboard/profile/route.ts`
  - Remover `apps/web/src/app/api/dashboard/projects/route.ts`
  - Remover `apps/web/src/app/api/dashboard/services/route.ts` e `apps/web/src/app/api/dashboard/services/[id]/route.ts`
  - Remover `apps/web/src/app/api/upload/route.ts`
  - Verificar que nenhum componente do `apps/web` ainda importa ou chama esses endpoints diretamente
  - _Requirements: 4.1, 4.9_

- [x] 21. Atualizar Middleware do Next.js para JWT próprio
  - Atualizar `apps/web/src/middleware.ts` para validar o JWT próprio da API Fastify em vez de usar `supabase.auth.getUser()`
  - O Middleware deve verificar a presença do cookie `refreshToken` ou do `accessToken` em memória para decidir se redireciona para login
  - Remover dependências de `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SUPABASE_URL` do Middleware
  - _Requirements: 4.1, 5.3, 5.8_

- [x] 22. Checkpoint final — Fase 2 completa
  - Verificar que todos os testes não-opcionais passam
  - Verificar que `apps/web` não contém mais Route Handlers de negócio
  - Confirmar que o fluxo completo login → dashboard → upload → logout funciona end-to-end via API Fastify
  - Confirmar que o Middleware do Next.js valida JWT próprio corretamente
  - _Requirements: 4.1, 4.9, 5.3, 5.8_

---

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- Os esqueletos das tasks 8 e 9 retornam 501 intencionalmente — serão implementados na Fase 2
- Property tests usam `fast-check` com mínimo de 100 iterações por propriedade
- O campo `User.password` é `null` durante a Fase 1 para usuários existentes (auth via Supabase); novos logins via API Fastify preenchem o hash bcrypt
- A task 20 (remoção dos Route Handlers) só deve ser executada após a task 19 estar completa e validada em ambiente de staging
