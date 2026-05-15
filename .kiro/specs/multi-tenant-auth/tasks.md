# Multi-Tenant Auth — Task Breakdown

## Wave 1 — Fundação (Schema + Config)

Zero breaking changes. Adiciona infraestrutura sem alterar comportamento existente.

---

### Task 1.1: Criar config estática de sites (backend)

**Arquivo**: `apps/api/src/lib/sites.ts`

**Ação**: CREATE

**Descrição**:
- Definir interface `SiteConfig`
- Criar objeto `SITES` com: platform, marketplace, tattoo, music
- Implementar `getSiteBySlug()`, `getSiteById()`
- Implementar `resolveSiteFromRequest(req)` — lê header `X-Site-Id`, valida contra SITES, fallback para `platform`

**Critério de aceite**:
- `resolveSiteFromRequest()` retorna site válido para header conhecido
- Retorna `platform` para header desconhecido ou ausente
- Nunca lança exceção

---

### Task 1.2: Criar config estática de sites (frontend)

**Arquivo**: `apps/web/src/lib/sites.ts`

**Ação**: CREATE

**Descrição**:
- Espelho da config do backend (sem `resolveSiteFromRequest`)
- Exportar `SITES`, `getSiteBySlug()`, `getSiteById()`
- Incluir dados de tema para renderização

**Critério de aceite**:
- Importável pelo frontend sem dependências do backend
- Contém todos os 4 sites com temas definidos

---

### Task 1.3: Migration 012 — adicionar site_id

**Arquivo**: `apps/api/migrations/012_add_site_id.sql`

**Ação**: CREATE

**Descrição**:
- Adicionar `'client'` ao enum `user_role`
- Adicionar coluna `site_id VARCHAR(50) NOT NULL DEFAULT 'platform'`
- Remover constraint `users_email_key` (unique em email)
- Criar unique index composto `(site_id, email)`
- Criar index `idx_users_site_id`

**Critério de aceite**:
- Usuários existentes recebem `site_id = 'platform'` automaticamente
- Unique constraint `(site_id, email)` funciona
- Inserir mesmo email com site_id diferente é permitido
- Inserir mesmo email com mesmo site_id é bloqueado

---

### Task 1.4: Atualizar Prisma schema

**Arquivo**: `apps/api/prisma/schema.prisma`

**Ação**: ALTER

**Mudanças**:
- Adicionar `client` ao enum `UserRole`
- Adicionar campo `siteId String @default("platform") @map("site_id") @db.VarChar(50)`
- Remover `@unique` do campo `email`
- Adicionar `@@unique([siteId, email])`
- Adicionar `@@index([siteId])`

**Critério de aceite**:
- `npx prisma generate` roda sem erros
- Schema reflete a migration 012

---

## Wave 2 — Backend Auth Multi-Tenant

Adapta o módulo de auth para usar siteId. Login existente continua funcionando (platform como default).

---

### Task 2.1: Atualizar auth.repository.ts

**Arquivo**: `apps/api/src/modules/auth/auth.repository.ts`

**Ação**: ALTER

**Mudanças**:
- Adicionar `siteId` ao `UserWithAuth` interface
- Criar `findUserByEmailAndSite(email, siteId)` — usa `@@unique([siteId, email])`
- Deprecar `findUserByEmail()` (manter temporariamente, marcar com `@deprecated`)
- Criar `createUser(siteId, email, passwordHash, role)` para signup
- Atualizar `findUserById()` para incluir `siteId` no select

**Critério de aceite**:
- `findUserByEmailAndSite('x@y.com', 'marketplace')` retorna user correto
- `findUserByEmailAndSite('x@y.com', 'tattoo')` retorna user diferente (ou null)
- `findUserById()` retorna `siteId` no resultado

---

### Task 2.2: Atualizar auth.service.ts

**Arquivo**: `apps/api/src/modules/auth/auth.service.ts`

**Ação**: ALTER

**Mudanças**:
- `login(email, password, siteId)` — usa `findUserByEmailAndSite`
- `register(email, password, name, siteId)` — cria user com siteId e role `client`
- `getSession(userId)` — incluir `siteId` no `SessionData.user`
- Manter `signAccessToken` com payload `{ sub: userId }` (sem siteId no JWT)

**Critério de aceite**:
- Login com siteId correto autentica
- Login com siteId errado falha
- Register cria user com siteId e role `client`
- Session retorna `siteId` no response

---

### Task 2.3: Atualizar auth.controller.ts — cookies por tenant

**Arquivo**: `apps/api/src/modules/auth/auth.controller.ts`

**Ação**: ALTER

**Mudanças**:
- Importar `resolveSiteFromRequest` de `../../lib/sites.js`
- `loginHandler`: resolver site, usar `site.cookieName` para o cookie de refresh
- `refreshHandler`: ler cookie pelo nome do site (`ah_{siteId}_refresh`)
- `logoutHandler`: limpar cookie correto por tenant
- Criar `registerHandler` para signup

**Critério de aceite**:
- Login no marketplace seta cookie `ah_marketplace_refresh`
- Login no tattoo seta cookie `ah_tattoo_refresh`
- Refresh lê o cookie correto baseado no site da request
- Logout limpa apenas o cookie do site correto

---

### Task 2.4: Atualizar auth.routes.ts

**Arquivo**: `apps/api/src/modules/auth/auth.routes.ts`

**Ação**: ALTER

**Mudanças**:
- Adicionar `POST /auth/register` (público, sem autenticação)
- Importar `registerHandler`

**Critério de aceite**:
- `POST /auth/register` acessível sem token
- Retorna 201 com `{ accessToken }` em caso de sucesso
- Retorna 409 se email já existe no site

---

### Task 2.5: Atualizar authenticate.ts hook

**Arquivo**: `apps/api/src/hooks/authenticate.ts`

**Ação**: ALTER

**Mudanças**:
- Importar `resolveSiteFromRequest`
- Após buscar userData, validar `userData.siteId === requestSite.id`
- Admin bypassa validação de site
- Incluir `siteId` no `request.user` injetado

**Critério de aceite**:
- User do marketplace não acessa rotas com `X-Site-Id: tattoo`
- Admin acessa qualquer site
- `request.user.siteId` disponível em todos os handlers

---

## Wave 3 — Frontend Login Multi-Tenant

Cria páginas de login por site com branding dinâmico.

---

### Task 3.1: Criar componente LoginForm.tsx

**Arquivo**: `apps/web/src/components/auth/LoginForm.tsx`

**Ação**: CREATE

**Descrição**:
- Componente client-side com form de email + password
- Recebe `siteConfig: SiteConfig` como prop
- Aplica cores do tema no botão e focus states
- Envia POST para `/api/auth/login` com header indicando o site
- Redirect para dashboard/home do site após sucesso

**Critério de aceite**:
- Formulário funcional com validação client-side
- Cores aplicadas dinamicamente via CSS variables ou inline styles
- Mensagem de erro exibida em caso de falha

---

### Task 3.2: Criar componente AuthLayout.tsx

**Arquivo**: `apps/web/src/components/auth/AuthLayout.tsx`

**Ação**: CREATE

**Descrição**:
- Layout wrapper para páginas de auth
- Exibe logo/displayName do site
- Aplica backgroundColor do tema
- Responsivo (mobile-first)

**Critério de aceite**:
- Renderiza displayName do site
- Background e cores seguem o tema
- Funciona em mobile e desktop

---

### Task 3.3: Criar página /[siteSlug]/login

**Arquivo**: `apps/web/src/app/[siteSlug]/login/page.tsx`

**Ação**: CREATE

**Descrição**:
- Server component que lê `params.siteSlug`
- Busca config via `getSiteBySlug()`
- Retorna `notFound()` se site não existe ou `authEnabled = false`
- Renderiza `<AuthLayout>` + `<LoginForm>`

**Atenção**: Conflito potencial com `app/[slug]/page.tsx` (perfis de artista). Verificar se Next.js resolve corretamente ou se precisa de route group.

**Critério de aceite**:
- `/marketplace/login` renderiza login do marketplace
- `/tattoo/login` renderiza login do tattoo
- `/invalido/login` retorna 404
- Não conflita com `/[slug]` (perfis de artista)

---

### Task 3.4: Redirect /login → /platform/login

**Arquivo**: `apps/web/src/app/login/page.tsx`

**Ação**: ALTER

**Mudanças**:
- Substituir conteúdo por redirect para `/platform/login`
- Ou manter como alias que renderiza o login do platform

**Critério de aceite**:
- Acessar `/login` leva ao login do platform
- Backward compatibility mantida

---

### Task 3.5: Atualizar proxy /api/auth/login

**Arquivo**: `apps/web/src/app/api/auth/login/route.ts`

**Ação**: ALTER

**Mudanças**:
- Extrair `siteId` do header `X-Site-Id` (enviado pelo LoginForm)
- Repassar como header `X-Site-Id` para a API Fastify
- Repassar cookies de resposta (agora com nome por tenant)

**Critério de aceite**:
- Header `X-Site-Id` é repassado para a API
- Cookie de resposta (com nome por tenant) é repassado ao browser

---

### Task 3.6: Atualizar middleware.ts

**Arquivo**: `apps/web/src/middleware.ts`

**Ação**: ALTER

**Mudanças**:
- Redirect `/login` → `/platform/login`
- Para rotas protegidas, verificar cookie correto por tenant
- Resolver site pelo pathname (ex: `/dashboard` → platform, `/marketplace/*` → marketplace)
- Redirect para `/[siteSlug]/login` correto quando não autenticado

**Critério de aceite**:
- `/dashboard` sem cookie `ah_platform_refresh` → redirect `/platform/login`
- `/marketplace/checkout` sem cookie `ah_marketplace_refresh` → redirect `/marketplace/login`
- `/login` → redirect `/platform/login`

---

### Task 3.7: Atualizar client.ts — redirectToLogin()

**Arquivo**: `apps/web/src/lib/api/client.ts`

**Ação**: ALTER

**Mudanças**:
- `redirectToLogin()` deve considerar o site atual
- Extrair site do pathname atual (`window.location.pathname`)
- Redirect para `/[siteSlug]/login` correto

**Critério de aceite**:
- 401 no marketplace redireciona para `/marketplace/login`
- 401 no dashboard redireciona para `/platform/login`

---

## Wave 4 — Testes e Validação

---

### Task 4.1: Testes de isolamento (backend)

**Arquivo**: `apps/api/src/modules/auth/auth.multi-tenant.test.ts`

**Ação**: CREATE

**Testes**:
- Mesmo email em sites diferentes → contas separadas
- Login com siteId errado → falha
- findUserByEmailAndSite retorna user correto
- Admin bypassa isolamento
- Register bloqueia duplicata no mesmo site

---

### Task 4.2: Testes de cookies isolados

**Arquivo**: `apps/api/src/modules/auth/auth.cookies.test.ts`

**Ação**: CREATE

**Testes**:
- Login marketplace → cookie `ah_marketplace_refresh`
- Login tattoo → cookie `ah_tattoo_refresh`
- Refresh lê cookie correto por site
- Logout limpa apenas cookie do site

---

### Task 4.3: Testes de branding (frontend)

**Arquivo**: `apps/web/src/components/auth/__tests__/LoginForm.test.tsx`

**Ação**: CREATE

**Testes**:
- Renderiza displayName do site
- Aplica primaryColor no botão
- Exibe erro em caso de falha
- Envia request com header X-Site-Id correto

---

### Task 4.4: Testes de segurança

**Arquivo**: `apps/api/src/modules/auth/auth.security.test.ts`

**Ação**: CREATE

**Testes**:
- Backend ignora siteId enviado no body
- resolveSiteFromRequest usa header, não body
- Site inválido no header → fallback para platform
- User de um site não acessa rotas de outro site

---

## Wave 5 — Cleanup (Futura, não implementar agora)

- Remover `findUserByEmail()` deprecated
- Remover Supabase legado (`lib/supabase/`, `requireAuth.ts`)
- Migrar config estática para tabela `sites`
- Implementar signup UI por site
- Dashboard admin cross-tenant

---

## Dependências entre Tasks

```
Wave 1: 1.1 → 1.3 → 1.4 (1.2 paralelo)
Wave 2: 2.1 → 2.2 → 2.3 → 2.4 (2.5 após 2.1)
Wave 3: 3.1 + 3.2 (paralelo) → 3.3 → 3.4 + 3.5 + 3.6 + 3.7 (paralelo)
Wave 4: todas paralelas (após Wave 2 e 3)
```

---

## Notas de Implementação

1. **Conflito de rotas**: `app/[siteSlug]/login` pode conflitar com `app/[slug]` (perfis). Solução: usar route group `(auth)` ou verificar se Next.js prioriza rotas mais específicas.

2. **Seed atualizado**: após migration, atualizar seed para incluir `siteId: 'platform'` explicitamente.

3. **Prisma generate**: rodar após alterar schema para regenerar client.

4. **Testes existentes**: verificar se testes de auth existentes (`auth.service.test.ts`, `auth.service.property.test.ts`) precisam de ajuste para passar siteId.
