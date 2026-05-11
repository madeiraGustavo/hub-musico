# Relatório de Alterações — hub-art-corrections

**Data de conclusão:** 2026-05-11  
**Spec:** `hub-art-corrections`  
**Escopo:** Correções e melhorias no monorepo hub-art — padronização de nomenclatura, segurança da API, migração do frontend para Fastify-first, novos endpoints e documentação.

---

## 1. Arquivos Alterados

### Configuração e nomenclatura

| Arquivo | O que foi corrigido |
|---------|---------------------|
| `package.json` (raiz) | `name` → `"hub-art"`, `description` atualizada para "Plataforma de portfólio para artistas profissionais", adicionado script `"test": "pnpm -r test"` |
| `packages/types/package.json` | `name` → `"@hub-art/types"`, adicionado script `"test": "echo \"No tests yet\""` |
| `apps/web/package.json` | `name` → `"@hub-art/web"`, dependência `@hub-musico/types` substituída por `@hub-art/types` |
| `apps/web/tsconfig.json` | Path alias `"@hub-musico/types"` renomeado para `"@hub-art/types"` (destino mantido) |
| `apps/api/.env.example` | Adicionado `NODE_ENV=development`, corrigido `PORT=3333` (estava `3001`) |
| `apps/web/.env.local.example` | Reescrito com apenas `NEXT_PUBLIC_API_URL=http://localhost:3333` — removidas variáveis do Supabase |
| `.env.example` (raiz) | Substituído por comentário de redirecionamento para os `.env.example` de cada app |

### Imports TypeScript (apps/web)

Os seguintes arquivos tiveram `from '@hub-musico/types'` substituído por `from '@hub-art/types'`:

- `src/hooks/useFilter.ts`
- `src/hooks/usePlayer.ts`
- `src/services/artistService.ts`
- `src/services/projectService.ts`
- `src/services/trackService.ts`
- `src/services/audio/AudioService.ts`
- `src/services/audio/usePlayerStore.ts`
- `src/lib/profile/profileConfig.ts`
- `src/components/musician/Hero.tsx`
- `src/components/musician/MusicaCard.tsx`
- `src/components/musician/Musicas.tsx`
- `src/components/musician/MusicianLayout.tsx`
- `src/components/musician/Projetos.tsx`
- `src/components/musician/Sobre.tsx`
- `src/components/shared/Contato.tsx`
- `src/components/shared/Depoimentos.tsx`
- `src/components/shared/Servicos.tsx`
- `src/components/tattoo/EstilosTattoo.tsx`
- `src/components/tattoo/HeroTattoo.tsx`
- `src/components/tattoo/InstagramCTA.tsx`
- `src/components/tattoo/PortfolioTattoo.tsx`
- `src/components/tattoo/SobreTattoo.tsx`
- `src/components/tattoo/TattooLayout.tsx`

### API Fastify (apps/api)

| Arquivo | O que foi corrigido |
|---------|---------------------|
| `apps/api/src/env.ts` | `JWT_SECRET` e `JWT_REFRESH_SECRET` passaram de `z.string().min(1)` para `z.string().min(32)` com mensagem descritiva |
| `apps/api/src/hooks/authenticate.ts` | Removido `role` do tipo do payload JWT — apenas `payload.sub` é usado; `role` e `artistId` sempre buscados no banco |
| `apps/api/src/plugins/rateLimit.ts` | Reescrito com `keyGenerator` dinâmico por grupo e método; exportada função `resolveLimit(url, method)` para testes; limites: `POST /auth/login` → 5, `POST /auth/refresh` → 10, `/auth/*` → 20, `/dashboard/*` → 100, `/upload` → 20, demais → 60 |
| `apps/api/prisma/schema.prisma` | Comentários do model `User` atualizados para refletir autenticação autônoma via JWT próprio (sem referência ao Supabase Auth) |
| `apps/api/src/modules/auth/auth.routes.ts` | Removido `authenticate` preHandler do `POST /auth/logout` — rota pública, revogação via cookie |
| `apps/api/src/modules/auth/auth.controller.ts` | `logoutHandler` reescrito para ler `refreshToken` do cookie, verificar assinatura JWT, extrair `userId` e revogar; `sessionHandler` atualizado para retornar objeto direto sem wrapper `{ data }` |
| `apps/api/src/modules/auth/auth.repository.ts` | Adicionada função `findArtistById(id)` que retorna `{ id, slug } \| null` |
| `apps/api/src/modules/auth/auth.service.ts` | `getSession` atualizado para retornar `{ authenticated: true, user: { id, email, role }, artist: { id, slug } \| null }` |
| `apps/api/src/modules/projects/projects.repository.ts` | `findById` expandido para incluir `status`; adicionada função `remove(id, artistId)` |
| `apps/api/src/modules/projects/projects.controller.ts` | Adicionados `updateProjectHandler` e `deleteProjectHandler` com verificação de ownership e regra de status |
| `apps/api/src/modules/projects/projects.routes.ts` | Registradas rotas `PATCH /dashboard/projects/:id` e `DELETE /dashboard/projects/:id` com `authenticate` |
| `apps/api/src/modules/profile/profile.repository.ts` | `select` da função `update` expandido de 4 para 13 campos: `id`, `name`, `slug`, `tagline`, `bio`, `location`, `reach`, `email`, `whatsapp`, `skills`, `tools`, `isActive`, `updatedAt` |
| `apps/api/README.md` | Reescrito com documentação precisa da API Fastify — removidas referências ao Next.js como backend e ao Supabase BaaS |

### Frontend Next.js (apps/web)

| Arquivo | O que foi corrigido |
|---------|---------------------|
| `apps/web/src/app/dashboard/layout.tsx` | Convertido para Client Component (`'use client'`); `supabase.auth.getUser()` substituído por `apiGet('/auth/session')` em `useEffect`; removidos imports de Supabase |
| `apps/web/src/app/dashboard/page.tsx` | Convertido para Client Component; `createAdminClient()` substituído por `apiGet('/auth/session')`; removidas stats de tracks e imports de Supabase |
| `apps/web/src/app/api/auth/logout/route.ts` | Reescrito como proxy para `POST /auth/logout` na API Fastify; removido `supabase.auth.signOut()` |
| `apps/web/src/app/dashboard/services/page.tsx` | Interface `Service`: `sortOrder` → `sort_order`; objeto `body` no `handleSave`: `sortOrder` → `sort_order` |

### Tipos compartilhados (packages/types)

| Arquivo | O que foi corrigido |
|---------|---------------------|
| `packages/types/src/index.ts` | `Track.id`: `number` → `string` (UUID); `TrackGenre`: adicionado `'outro'`; `Project`: adicionados `status: 'draft' \| 'active' \| 'archived'` e `sortOrder: number` |

### Estrutura de diretórios

| Diretório removido | Motivo |
|--------------------|--------|
| `apps/web/src/app/api/dashboard/profile/` | Vazio — sem `route.ts` |
| `apps/web/src/app/api/dashboard/projects/` | Vazio — sem `route.ts` |
| `apps/web/src/app/api/dashboard/services/[id]/` | Vazio — sem `route.ts` |
| `apps/web/src/app/api/dashboard/tracks/` | Vazio — sem `route.ts` |

### Documentação (docs/)

| Arquivo | O que foi criado/atualizado |
|---------|------------------------------|
| `docs/regras-negocio.md` | Regra de `artist_id` corrigida: resolvido via banco, nunca do JWT nem do cliente |
| `docs/seguranca.md` | Seção de `artist_id` e `role` alinhada; modelo de sessão e logout documentados |
| `docs/security-checklist.md` | Criado com tabela de todas as rotas da API, indicando autenticação e justificativas para rotas públicas |

### Testes (apps/api)

| Arquivo | O que foi criado |
|---------|-----------------|
| `apps/api/src/plugins/rateLimit.property.test.ts` | Property 2: mapeamento correto de rate limit por grupo de rotas e método |
| `apps/api/src/modules/auth/auth.service.property.test.ts` | Property 3: estrutura completa da resposta de sessão |
| `apps/api/src/modules/projects/projects.ownership.property.test.ts` | Property 5: ownership check para PATCH e DELETE de projetos |
| `apps/api/src/modules/projects/projects.controller.property.test.ts` | Property 4 (validação Zod) e Property 6 (regra de status para DELETE) |
| `apps/api/src/modules/profile/profile.repository.property.test.ts` | Property 7: completude dos campos retornados pelo profile update |
| `apps/api/src/modules/projects/projects.controller.test.ts` | Testes unitários para PATCH e DELETE de projetos |
| `apps/api/src/modules/auth/auth.service.test.ts` | Testes unitários para `getSession` com novo formato de resposta |
| `apps/api/src/modules/profile/profile.controller.test.ts` | Testes unitários para completude de campos no PATCH profile |

---

## 2. Arquivos Inspecionados e Não Alterados

| Arquivo | Motivo para não alterar |
|---------|------------------------|
| `apps/api/src/modules/auth/auth.schema.ts` | Schemas de login e refresh já corretos |
| `apps/api/src/modules/tracks/tracks.controller.ts` | Já implementava ownership check corretamente — serviu de modelo para projects |
| `apps/api/src/modules/tracks/tracks.repository.ts` | Já correto — serviu de modelo para `remove` em projects |
| `apps/api/src/modules/services/services.controller.ts` | Já correto para o escopo deste spec |
| `apps/api/src/modules/services/services.schema.ts` | Já usa `sort_order` (snake_case) corretamente |
| `apps/api/src/lib/prisma.ts` | Sem alterações necessárias |
| `apps/api/src/lib/password.ts` | Sem alterações necessárias |
| `apps/api/src/lib/storage.ts` | Sem alterações necessárias |
| `apps/api/src/lib/validateMime.ts` | Sem alterações necessárias |
| `apps/api/src/app.ts` | Sem alterações necessárias |
| `apps/api/src/server.ts` | Sem alterações necessárias |
| `apps/api/src/types/fastify.d.ts` | Tipos de `AuthContext` já corretos |
| `apps/api/prisma/schema.prisma` | Estrutura de dados mantida — apenas comentários alterados |
| `apps/web/src/middleware.ts` | Já verifica presença do cookie `refreshToken` corretamente |
| `apps/web/src/app/api/auth/login/route.ts` | Já correto — serviu de modelo para o proxy de logout |
| `apps/web/src/app/api/auth/session/route.ts` | Já correto como proxy para `GET /auth/session` |
| `apps/web/next.config.mjs` | Sem alterações necessárias |
| `apps/web/src/lib/apiClient.ts` | Já trata 401 com `redirectToLogin()` corretamente |
| `docs/arquitetura.md` | Inspecionado — sem menções ambíguas sobre `artist_id` que precisassem de correção |
| `docs/modelagem.md` | Sem alterações necessárias |
| `apps/api/migrations/*.sql` | Sem alterações — estrutura de banco não foi modificada |

---

## 3. Scripts Executados e Resultados

| Comando | Resultado |
|---------|-----------|
| `npx pnpm --filter @hub-art/api typecheck` | ✅ Zero erros — saída limpa |
| `npx pnpm --filter @hub-art/web typecheck` | ✅ Zero erros — saída limpa |
| `npx pnpm --filter @hub-art/api test` | ✅ 14 arquivos de teste, 180 testes passando |
| `grep -R "hub-musico" . --include="*.ts,*.tsx,*.json,*.md" --exclude-dir=node_modules --exclude-dir=.git` | ✅ Zero ocorrências em código de produção — ocorrências encontradas apenas em arquivos de spec (`.kiro/specs/`) e documentação histórica, que são registros imutáveis do processo |

**Resumo dos testes:**

```
Test Files  14 passed (14)
     Tests  180 passed (180)
  Duration  9.31s
```

Arquivos de teste executados:
- `src/hooks/authenticate.test.ts` (12 testes)
- `src/modules/auth/auth.service.test.ts` (8 testes)
- `src/modules/auth/auth.service.property.test.ts` (4 testes)
- `src/modules/profile/profile.controller.test.ts` (15 testes)
- `src/modules/profile/profile.repository.property.test.ts` (2 testes)
- `src/modules/projects/projects.controller.test.ts` (12 testes)
- `src/modules/projects/projects.controller.property.test.ts` (14 testes)
- `src/modules/projects/projects.ownership.property.test.ts` (6 testes)
- `src/modules/services/services.controller.test.ts` (22 testes)
- `src/modules/tracks/tracks.controller.test.ts` (20 testes)
- `src/modules/tracks/tracks.ownership.property.test.ts` (6 testes)
- `src/modules/upload/upload.service.test.ts` (8 testes)
- `src/modules/validation.property.test.ts` (39 testes)
- `src/plugins/rateLimit.property.test.ts` (12 testes)

---

## 4. Erros Encontrados Durante a Implementação

Nenhum erro crítico foi encontrado. Observações menores:

- **`pnpm` não disponível globalmente** no ambiente de execução — todos os comandos foram executados via `npx pnpm`, que resolveu automaticamente a versão correta (9.15.9) definida no `packageManager` do `package.json` raiz.
- **Ocorrências de "hub-musico" em arquivos de spec** (`.kiro/specs/`) são esperadas e corretas — esses arquivos documentam o histórico de migração e não são código de produção. O critério de aceitação (zero ocorrências em código e configuração) foi atendido.

---

## 5. Próximos Passos Recomendados

Os itens abaixo estão fora do escopo deste spec e representam melhorias futuras:

### Segurança e autenticação

1. **Migrar `dashboard/layout.tsx` de volta para Server Component** — a conversão para Client Component (task 13.1) foi aceita como risco documentado. A alternativa mais robusta é implementar um Server Action de session guard que mantém a proteção SSR sem depender do Supabase. Isso elimina a janela de tempo entre o carregamento do componente e a verificação de sessão no cliente.

2. **Implementar rotação automática de access token** — quando o access token expira, o frontend deve chamar `POST /auth/refresh` automaticamente antes de redirecionar para login. O `apiClient` atual não implementa esse retry automático.

3. **Adicionar `NODE_ENV` ao schema Zod de `env.ts`** — atualmente `NODE_ENV` é lido diretamente via `process.env.NODE_ENV` no `auth.controller.ts` para configurar o cookie `secure`. Centralizar no schema garante validação consistente.

### API e endpoints

4. **Implementar endpoint `GET /dashboard/projects`** — atualmente não há endpoint para listar projetos do artista autenticado. O frontend usa dados estáticos de `public/data/projects.json`.

5. **Implementar endpoint `GET /dashboard/tracks`** — mesma situação dos projetos. Necessário para remover a dependência de `public/data/tracks.json`.

6. **Adicionar paginação aos endpoints de listagem** — `GET /dashboard/projects`, `GET /dashboard/tracks` e `GET /dashboard/services` devem suportar `page` e `pageSize` para escalar com o crescimento do portfólio.

7. **Implementar upload de imagem de perfil** — o endpoint `POST /upload` existe mas não há integração com o campo `avatarUrl` do artista no dashboard.

### Frontend

8. **Remover dependências do Supabase Auth do `apps/web`** — `@supabase/ssr` e `@supabase/supabase-js` ainda estão em `apps/web/package.json`. Após a migração completa para Fastify-first, essas dependências podem ser removidas (mantendo apenas o Supabase Storage se necessário).

9. **Implementar refresh automático de token no `apiClient`** — interceptar respostas 401 e tentar `POST /auth/refresh` antes de redirecionar para login, melhorando a experiência do usuário com tokens próximos da expiração.

10. **Adicionar testes ao `apps/web`** — o script `"test": "vitest --run"` existe mas não há arquivos de teste. Prioridade: testes para `apiClient`, hooks de estado e componentes críticos do dashboard.

### Infraestrutura

11. **Configurar CI/CD** — o workflow em `.github/workflows/static.yml` é apenas para GitHub Pages. Adicionar pipeline de CI que execute `typecheck`, `lint` e `test` em pull requests.

12. **Documentar processo de migration do banco** — `apps/api/migrations/` contém 9 arquivos SQL mas não há documentação sobre como aplicá-los em ambiente de produção. Criar `docs/deploy.md` com instruções.
