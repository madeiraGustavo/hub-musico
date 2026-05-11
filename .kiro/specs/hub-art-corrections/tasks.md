# Implementation Plan: hub-art-corrections

## Overview

Plano de implementação para as correções e melhorias do projeto hub-art, organizado em duas fases:

- **Fase 1** — Padronização, segurança da base e fechamento da API de auth (tasks 1–9)
- **Fase 2** — Domínio real, migração do frontend e limpeza (tasks 10–16)
- **Validação final** — Documentação, scripts e relatório (tasks 17–19)

Cada task é cirúrgica e limitada ao escopo do requisito correspondente. Linguagem de implementação: **TypeScript**.

---

## Tasks

---
### FASE 1 — Padronização, segurança da base e fechamento da API de auth
---

- [x] 1. Padronizar nomenclatura hub-art nos package.json e imports
  - [x] 1.1 Atualizar `package.json` raiz: `name` → `"hub-art"`, `description` → `"Plataforma de portfólio para artistas profissionais"`
    - Adicionar script `"test": "pnpm -r test"` (scripts `dev`, `build`, `lint`, `typecheck` já existem e estão corretos)
    - _Requirements: 1.1, 1.2, 8.1, 8.2_

  - [x] 1.2 Atualizar `packages/types/package.json`: `name` → `"@hub-art/types"`
    - _Requirements: 1.6_

  - [x] 1.3 Atualizar `apps/web/package.json`: `name` → `"@hub-art/web"`, substituir dependência `@hub-musico/types` por `@hub-art/types`
    - _Requirements: 1.3, 1.4_

  - [x] 1.4 Atualizar `apps/web/tsconfig.json`: substituir path alias `"@hub-musico/types"` por `"@hub-art/types"`
    - O alias aponta para `../../packages/types/src/index.ts` — manter o destino, apenas renomear a chave
    - _Requirements: 1.7, 1.8_

  - [x] 1.5 Substituir todos os imports `@hub-musico/types` por `@hub-art/types` nos arquivos TypeScript do `apps/web`
    - Arquivos afetados (confirmados via grep): `src/hooks/useFilter.ts`, `src/hooks/usePlayer.ts`, `src/services/artistService.ts`, `src/services/projectService.ts`, `src/services/trackService.ts`, `src/services/audio/AudioService.ts`, `src/services/audio/usePlayerStore.ts`, `src/lib/profile/profileConfig.ts`, `src/components/musician/Hero.tsx`, `src/components/musician/MusicaCard.tsx`, `src/components/musician/Musicas.tsx`, `src/components/musician/MusicianLayout.tsx`, `src/components/musician/Projetos.tsx`, `src/components/musician/Sobre.tsx`, `src/components/shared/Contato.tsx`, `src/components/shared/Depoimentos.tsx`, `src/components/shared/Servicos.tsx`, `src/components/tattoo/EstilosTattoo.tsx`, `src/components/tattoo/HeroTattoo.tsx`, `src/components/tattoo/InstagramCTA.tsx`, `src/components/tattoo/PortfolioTattoo.tsx`, `src/components/tattoo/SobreTattoo.tsx`, `src/components/tattoo/TattooLayout.tsx`
    - Substituição: `from '@hub-musico/types'` → `from '@hub-art/types'`
    - _Requirements: 1.7, 1.8_

  - [x] 1.6 Verificar ausência de `hub-musico` no repositório após todas as substituições
    - Comando: `grep -R "hub-musico" . --exclude-dir=.git --exclude-dir=node_modules --exclude="pnpm-lock.yaml"`
    - Resultado esperado: zero ocorrências em arquivos de código e configuração
    - Nota: `pnpm-lock.yaml` será atualizado automaticamente após `pnpm install`
    - _Requirements: 1.7, 1.8_

- [x] 2. Separar arquivos `.env.example` por contexto
  - [x] 2.1 Atualizar `apps/api/.env.example`: adicionar `NODE_ENV=development`, ajustar `PORT=3333`
    - O arquivo já existe com as 8 variáveis corretas — apenas adicionar `NODE_ENV` e corrigir `PORT` (estava `3001`)
    - Confirmar ausência de secrets reais
    - _Requirements: 3.1_

  - [x] 2.2 Reescrever `apps/web/.env.local.example` com apenas `NEXT_PUBLIC_API_URL=http://localhost:3333`
    - Conteúdo atual contém variáveis do Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`) — remover todas
    - _Requirements: 3.2, 3.4_

  - [x] 2.3 Substituir `.env.example` raiz por comentário de redirecionamento
    - Conteúdo novo: comentário explicando que as variáveis estão em `apps/api/.env.example` e `apps/web/.env.local.example`
    - _Requirements: 3.3, 3.5_

- [x] 3. Fortalecer segurança da API — env e authenticate
  - [x] 3.1 Fortalecer validação de `JWT_SECRET` e `JWT_REFRESH_SECRET` em `apps/api/src/env.ts`
    - Atualmente: `z.string().min(1)` — insuficiente para segurança
    - Novo: `z.string().min(32)` para ambos, com mensagem descritiva
    - Exemplo: `z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres (256 bits)')`
    - Justificativa: alinhado com `docs/seguranca.md` que exige "mínimo 256 bits"
    - _Requirements: (segurança de configuração)_

  - [x] 3.2 Remover `role` do tipo esperado no payload JWT em `apps/api/src/hooks/authenticate.ts`
    - Atualmente: `const payload = request.user as unknown as { sub: string; role: string }`
    - Correção: `const payload = request.user as unknown as { sub: string }` — remover `role` do tipo
    - O `role` do payload JWT deve ser completamente ignorado — apenas `payload.sub` é usado para buscar o usuário no banco
    - Confirmar que nenhuma lógica downstream usa `payload.role` — apenas `userData.role` (do banco) é utilizado
    - _Requirements: (alinhamento com regra de segurança — role sempre do banco)_

- [x] 4. Corrigir comentários do schema Prisma sobre fases de migração
  - [x] 4.1 Atualizar comentários do model `User` em `apps/api/prisma/schema.prisma`
    - Comentário atual: `/// Estende auth.users do Supabase (Fase 1) ou é autônomo (Fase 3)` — ambíguo
    - O projeto já usa JWT próprio e o modelo `User` já é autônomo
    - Novo comentário: `/// Usuário autônomo — autenticação gerenciada pela API Fastify via JWT próprio`
    - Campo `password`: remover referência à "Fase 1 (auth via Supabase)" — substituir por: `/// Hash bcrypt gerenciado pela API Fastify. Null para usuários migrados sem senha definida.`
    - Não alterar a estrutura do schema — apenas os comentários de documentação
    - _Requirements: (alinhamento documentação/código)_

- [x] 5. Corrigir rate limit por grupo de rotas na API
  - [x] 5.1 Reescrever `apps/api/src/plugins/rateLimit.ts` com `keyGenerator` dinâmico por grupo e método
    - Exportar a função `resolveLimit(url: string, method: string): number` para permitir testes unitários diretos
    - Grupos por URL + método:
      - `POST /auth/login` → 5 req/min (mais restrito — endpoint de credenciais)
      - `POST /auth/refresh` → 10 req/min
      - demais `/auth/*` → 20 req/min
      - `/dashboard/*` → 100 req/min
      - `/upload` → 20 req/min
      - demais → 60 req/min
    - Justificativa: `POST /auth/login` é o endpoint mais sensível a brute force — merece limite mais restrito que `GET /auth/session`
    - Manter o plugin `@fastify/rate-limit` sem removê-lo
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 5.2 Escrever property test para `resolveLimit` em `apps/api/src/plugins/rateLimit.property.test.ts`
    - **Property 2: Mapeamento correto de rate limit por grupo de rotas e método**
    - Gerar combinações de URL + método e verificar que `resolveLimit(url, method)` retorna o valor exato
    - Casos obrigatórios: `POST /auth/login` → 5, `POST /auth/refresh` → 10, `GET /auth/session` → 20, `GET /dashboard/tracks` → 100, `POST /upload` → 20
    - Mínimo 100 iterações com fast-check
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 6. Corrigir `POST /auth/logout` para aceitar revogação via cookie refreshToken
  - [x] 6.1 Remover `authenticate` preHandler do `logoutHandler` em `apps/api/src/modules/auth/auth.routes.ts`
    - Atualmente: `fastify.post('/auth/logout', { preHandler: authenticate }, logoutHandler)`
    - Novo: `fastify.post('/auth/logout', logoutHandler)` — rota pública, sem Bearer obrigatório
    - Justificativa: o access token pode ter expirado, mas o usuário ainda precisa conseguir fazer logout
    - _Requirements: (decisão de sessão/logout — Opção A confirmada)_

  - [x] 6.2 Atualizar `logoutHandler` em `apps/api/src/modules/auth/auth.controller.ts`
    - Remover dependência de `request.user.userId` (que vinha do `authenticate` hook)
    - Nova lógica: ler o cookie `refreshToken` da requisição, verificar assinatura com `JWT_REFRESH_SECRET`, extrair `userId` do payload (`sub`), chamar `authService.logout(userId)`
    - Se o cookie `refreshToken` estiver ausente ou inválido → retornar 400 com `{ error: 'Refresh token ausente ou inválido' }`
    - Limpar o cookie `refreshToken` na resposta independentemente do resultado
    - Retornar 204 em caso de sucesso
    - _Requirements: (decisão de sessão/logout — Opção A confirmada)_

- [x] 7. Expandir `GET /auth/session` para retornar estrutura completa
  - [x] 7.1 Adicionar `findArtistById(id: string)` em `apps/api/src/modules/auth/auth.repository.ts`
    - Retorna `{ id: string; slug: string } | null` via `prisma.artist.findUnique`
    - Adicionar ao final do arquivo, após as funções de refresh token existentes
    - _Requirements: 6.1_

  - [x] 7.2 Atualizar `getSession` em `apps/api/src/modules/auth/auth.service.ts`
    - Importar `findArtistById` do repository
    - Novo tipo `SessionData`: `{ authenticated: true, user: { id, email, role }, artist: { id, slug } | null }`
    - Quando `user.artistId` não for null, chamar `findArtistById(user.artistId)` para obter o `slug`
    - Substituir o tipo `SessionData` existente (que retorna `{ id, email, role, artistId }`) pelo novo formato
    - _Requirements: 6.1_

  - [x] 7.3 Atualizar `sessionHandler` em `apps/api/src/modules/auth/auth.controller.ts`
    - Atualmente retorna `reply.code(200).send({ data: session })` — remover o wrapper `{ data: ... }`
    - Novo retorno: `reply.code(200).send(session)` — o objeto `SessionData` já contém `authenticated: true` como discriminador
    - **Decisão de padronização:** `GET /auth/session` passa a ser exceção documentada — retorna objeto direto sem `{ data }`. Todos os demais endpoints continuam com `{ data }`. Documentar essa exceção em `docs/security-checklist.md` (task 17.3)
    - Verificar se `apps/web/src/app/api/auth/session/route.ts` precisa ser ajustado para o novo formato
    - _Requirements: 6.1_

  - [x] 7.4 Escrever property test para `getSession` em `apps/api/src/modules/auth/auth.service.property.test.ts`
    - **Property 3: Estrutura completa da resposta de sessão**
    - Gerar usuários com diferentes roles e com/sem `artistId`
    - Verificar que `getSession` retorna sempre `{ authenticated: true, user: { id, email, role }, artist: { id, slug } | null }`
    - Mínimo 100 iterações com fast-check
    - **Validates: Requirements 6.1**

- [x] 8. Garantir scripts de validação no monorepo
  - [x] 8.1 Verificar e completar scripts no monorepo
    - `package.json` raiz: `"test": "pnpm -r test"` — adicionado na task 1.1, confirmar
    - `packages/types/package.json`: adicionar `"test": "echo \"No tests yet\""` se ausente
    - `apps/api/package.json`: `"test": "vitest --run"` — já existe, confirmar
    - `apps/web/package.json`: `"test": "vitest --run"` — já existe, confirmar
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Atualizar README da API
  - [x] 9.1 Reescrever `apps/api/README.md` com documentação precisa da API Fastify
    - Estado atual: descreve a pasta como contendo apenas migrations SQL e diz que o backend real está em Next.js Route Handlers com Supabase BaaS — completamente obsoleto
    - Novo conteúdo mínimo:
      - Título: `# @hub-art/api`
      - Descrição: API Fastify oficial do projeto Hub Art
      - Responsabilidades: autenticação JWT, Prisma + PostgreSQL/Supabase, validação Zod, regras de negócio, uploads Supabase Storage
      - Scripts: `dev`, `build`, `start`, `typecheck`, `test`, `prisma:migrate`, `prisma:generate`
      - Variáveis de ambiente: listar as 8 variáveis obrigatórias do `env.ts`
      - Nota explícita: `apps/web` não acessa o Prisma diretamente
    - Remover toda referência ao Next.js como backend, ao Supabase BaaS e à linguagem "planejado/FASE 6"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 10. Checkpoint Fase 1 — Validar API de auth fechada
  - Confirmar que as 4 rotas de auth estão funcionais: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/session`
  - Confirmar que `POST /auth/logout` funciona **sem** Bearer token, usando apenas o cookie `refreshToken`
  - Confirmar que `GET /auth/session` é a autoridade final de validação de sessão — retorna 401 para tokens inválidos/expirados/revogados
  - Executar `pnpm --filter @hub-art/api typecheck` — zero erros fatais
  - Executar `pnpm --filter @hub-art/api test` — todos os testes passam
  - Verificar que `env.ts` rejeita `JWT_SECRET` com menos de 32 caracteres no startup
  - Verificar que `authenticate.ts` não usa `payload.role` em nenhuma lógica

---
### FASE 2 — Domínio real, migração do frontend e limpeza
---

- [x] 11. Implementar endpoints PATCH e DELETE para projetos na API
  - [x] 11.1 Atualizar `findById` em `apps/api/src/modules/projects/projects.repository.ts` para incluir `status`
    - Adicionar `status: true` ao `select` de `findById` — necessário para a regra de negócio do DELETE
    - _Requirements: 9.8_

  - [x] 11.2 Adicionar função `remove(id: string, artistId: string)` em `apps/api/src/modules/projects/projects.repository.ts`
    - Usar `prisma.project.delete({ where: { id, artistId } })` — double-check de ownership na query, igual ao padrão de `tracks.repository.ts`
    - _Requirements: 9.2, 9.5_

  - [x] 11.3 Adicionar `updateProjectHandler` e `deleteProjectHandler` em `apps/api/src/modules/projects/projects.controller.ts`
    - Importar `UpdateProjectSchema` do schema (já existe), `findById`, `update`, `remove` do repository
    - `updateProjectHandler`: busca via `findById`, retorna 404 se não existir, verifica ownership (403), valida body com `UpdateProjectSchema`, chama `update`, retorna 200 com `{ data }`
    - `deleteProjectHandler`: busca via `findById`, retorna 404 se não existir, verifica ownership (403), verifica `status !== 'draft'` → 422, chama `remove`, retorna 204
    - Seguir o padrão exato de `tracks.controller.ts` para ownership e admin bypass
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 11.4 Registrar as novas rotas em `apps/api/src/modules/projects/projects.routes.ts`
    - `fastify.patch('/dashboard/projects/:id', { preHandler: authenticate }, updateProjectHandler)`
    - `fastify.delete('/dashboard/projects/:id', { preHandler: authenticate }, deleteProjectHandler)`
    - _Requirements: 9.1, 9.2_

  - [x] 11.5 Escrever property test de ownership em `apps/api/src/modules/projects/projects.ownership.property.test.ts`
    - **Property 5: Ownership check para operações de escrita em projetos**
    - Seguir o padrão de `tracks.ownership.property.test.ts` já existente no projeto
    - Mínimo 100 iterações com fast-check
    - **Validates: Requirements 9.4, 9.5, 9.6**

  - [x] 11.6 Escrever property tests de validação Zod e regra de status em `apps/api/src/modules/projects/projects.controller.property.test.ts`
    - **Property 4**: `UpdateProjectSchema` aceita válidos e rejeita inválidos
    - **Property 6**: DELETE com `status` `'active'` ou `'archived'` retorna 422
    - Seguir o padrão de `validation.property.test.ts` já existente no projeto
    - Mínimo 100 iterações com fast-check
    - **Validates: Requirements 9.3, 9.8**

- [x] 12. Expandir campos retornados pelo `profile.repository.update`
  - [x] 12.1 Atualizar o `select` da função `update` em `apps/api/src/modules/profile/profile.repository.ts`
    - Expandir de `{ id, name, tagline, updatedAt }` para todos os campos editáveis: `id`, `name`, `slug`, `tagline`, `bio`, `location`, `reach`, `email`, `whatsapp`, `skills`, `tools`, `isActive`, `updatedAt`
    - _Requirements: 12.1, 12.2_

  - [x] 12.2 Escrever property test para completude de campos em `apps/api/src/modules/profile/profile.repository.property.test.ts`
    - **Property 7: Completude dos campos retornados pelo profile update**
    - Verificar que todos os 13 campos esperados estão presentes na resposta
    - Mínimo 100 iterações com fast-check
    - **Validates: Requirements 12.1, 12.2**

- [x] 13. Migrar verificação de sessão do dashboard para a API Fastify (frontend)
  - [x] 13.1 Converter `apps/web/src/app/dashboard/layout.tsx` para Client Component
    - Adicionar `'use client'` no topo
    - Substituir `supabase.auth.getUser()` por `apiGet<SessionData>('/auth/session')` em `useEffect`
    - O `apiClient` já trata 401 com `redirectToLogin()` — não duplicar o tratamento
    - Renderizar `children` apenas após confirmar sessão válida (estado `loading` enquanto aguarda)
    - Remover imports de `createClient`, `redirect` e `@/lib/supabase/server`
    - Manter `DashboardNav` sem alteração
    - **Risco aceito e documentado:** converter para Client Component reduz proteção SSR. A defesa fica em duas camadas: (1) `middleware.ts` verifica presença do cookie `refreshToken` antes de renderizar qualquer página do dashboard; (2) `GET /auth/session` é a autoridade final — valida o JWT na API. Alternativa mais robusta (manter SSR com session guard via Server Action) fica como melhoria futura fora do escopo deste spec.
    - _Requirements: 6.2, 6.3, 6.7_

  - [x] 13.2 Converter `apps/web/src/app/dashboard/page.tsx` para Client Component
    - Adicionar `'use client'` no topo
    - Substituir `createClient()` e `createAdminClient()` por `apiGet<SessionData>('/auth/session')`
    - Exibir `user.email` e `user.role` vindos da resposta de sessão
    - Remover stats de tracks (sem endpoint equivalente no escopo deste spec)
    - Remover imports de `createClient`, `createAdminClient` e `@/lib/supabase/*`
    - _Requirements: 6.4, 6.6, 6.7_

  - [x] 13.3 Reescrever `apps/web/src/app/api/auth/logout/route.ts` como proxy para `POST /auth/logout`
    - Seguir o padrão exato do `login/route.ts`: repassar cookies `Set-Cookie` da resposta
    - **Sem Bearer obrigatório:** repassar o cookie `refreshToken` via `credentials: 'include'` — a API revoga via cookie (task 6.2 já implementa isso na API)
    - Repassar o header `Authorization` se disponível (opcional — para compatibilidade)
    - Retornar `{ error: 'Serviço indisponível' }` com status 503 em caso de erro de rede
    - Remover `supabase.auth.signOut()` e import de `createClient`
    - _Requirements: 6.5, 6.6_

- [x] 14. Corrigir campo `sort_order` no frontend de serviços
  - [x] 14.1 Corrigir `apps/web/src/app/dashboard/services/page.tsx`
    - Interface `Service`: `sortOrder: number` → `sort_order: number`
    - Constante `EMPTY`: `Omit<Service, 'id' | 'active' | 'sort_order'>`, renomear campo
    - Função `openNew`: `sortOrder: services.length` → `sort_order: services.length`
    - Objeto `body` em `handleSave`: `sortOrder: editing.sortOrder` → `sort_order: editing.sort_order`
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 15. Atualizar tipos compartilhados em `packages/types`
  - [x] 15.1 Atualizar `packages/types/src/index.ts`
    - `Track.id`: `number` → `string` (UUID)
    - `TrackGenre`: adicionar `'outro'` para corresponder ao schema Prisma
    - `Project`: adicionar `status: 'draft' | 'active' | 'archived'` e `sortOrder: number`
    - Manter todos os campos existentes sem alteração
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 16. Remover diretórios vazios de Route Handlers do dashboard
  - [x] 16.1 Remover subdiretórios sem `route.ts` em `apps/web/src/app/api/dashboard/`
    - Estado confirmado via inspeção:
      - `profile/` — vazio → **remover**
      - `projects/` — vazio → **remover**
      - `services/[id]/` — vazio → **remover `[id]/`** (manter `services/` se tiver `route.ts`)
      - `tracks/[id]/` — vazio → **remover `[id]/`** e `tracks/` se não houver `route.ts`
    - Verificar cada diretório antes de remover
    - Após limpeza, `apps/web/src/app/api/` deve conter apenas: `auth/login/route.ts`, `auth/logout/route.ts`, `auth/session/route.ts` (proxies documentados)
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 17. Checkpoint Fase 2 — Validar frontend
  - Executar `pnpm --filter @hub-art/web typecheck` — zero erros fatais
  - Executar `pnpm --filter @hub-art/web lint` — zero erros fatais
  - Confirmar que `apps/web/src/app/api/` contém apenas os 3 proxies de auth documentados

---
### VALIDAÇÃO FINAL — Documentação, segurança e relatório
---

- [x] 18. Criar documentação de segurança e regras de negócio
  - [x] 18.1 Atualizar `docs/regras-negocio.md` com a regra correta de `artist_id`
    - Regra: `artist_id` é resolvido via `SELECT artist_id FROM users WHERE id = userId` — nunca do JWT nem do cliente
    - _Requirements: 5.1, 5.2_

  - [x] 18.2 Atualizar `docs/seguranca.md` com seção de `artist_id` e `role` alinhados à regra
    - Payload do JWT contém apenas `{ sub: userId }` — `artistId` e `role` são sempre buscados no banco pelo hook `authenticate`
    - Documentar o modelo de sessão: `middleware.ts` protege UI, `GET /auth/session` é a autoridade final
    - Documentar o modelo de logout: `POST /auth/logout` aceita revogação via cookie `refreshToken` sem Bearer obrigatório
    - Corrigir qualquer menção ambígua em `docs/arquitetura.md`
    - _Requirements: 5.3, 5.4_

  - [x] 18.3 Criar `docs/security-checklist.md` com tabela de todas as rotas da API
    - Colunas: Método HTTP, Caminho, Módulo, Requer `authenticate`, Status de verificação
    - Cobrir todos os módulos: `auth`, `profile`, `tracks`, `projects`, `services`, `upload`
    - Confirmar que rotas de escrita (POST, PATCH, DELETE) têm `authenticate` como `preHandler` — exceto `POST /auth/logout` (decisão documentada: revogação via cookie)
    - Documentar `GET /auth/session` como exceção de formato: retorna objeto direto sem wrapper `{ data }`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 19. Checkpoint final — Validar monorepo completo
  - Executar `pnpm typecheck` na raiz — zero erros fatais
  - Executar `pnpm lint` na raiz — zero erros fatais
  - Executar `pnpm test` na raiz — todos os testes passam
  - Executar `grep -R "hub-musico" . --exclude-dir=.git --exclude-dir=node_modules --exclude="pnpm-lock.yaml"` — zero ocorrências

- [x] 20. Gerar relatório final de alterações
  - [x] 20.1 Criar `docs/relatorio-alteracoes.md`
    - Listar todos os arquivos alterados com descrição do que foi corrigido
    - Listar arquivos não alterados e o motivo
    - Listar scripts executados e seus resultados
    - Listar erros encontrados, se houver
    - Listar próximos passos recomendados
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

---

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- Os checkpoints (tasks 10, 17, 19) garantem validação incremental antes de avançar
- Property tests usam **fast-check** (já presente em `apps/api/devDependencies`)
- Cada property test deve rodar com mínimo de 100 iterações (`{ numRuns: 100 }`)
- A função `resolveLimit` deve ser exportada de `rateLimit.ts` — assinatura: `resolveLimit(url: string, method: string): number`
- `dashboard/layout.tsx` e `dashboard/page.tsx` devem ser convertidos para Client Components (`'use client'`) — risco aceito e documentado na task 13.1
- Nenhuma regra de negócio deve ser movida para `apps/web` — arquitetura Fastify-first preservada
- Task 4 (schema Prisma) altera apenas comentários — não altera estrutura de dados nem migrations

### Modelo de sessão e logout (decisão fechada)

- `middleware.ts` protege a UI verificando presença do cookie `refreshToken` — defesa de primeira linha
- `GET /auth/session` é a autoridade final — valida o JWT na API e retorna 401 para tokens inválidos/expirados/revogados
- `POST /auth/logout` aceita revogação via cookie `refreshToken` **sem Bearer obrigatório** (tasks 6.1 e 6.2) — funciona mesmo com access token expirado

### Risco: backend duplo durante Fase 2

Durante a Fase 2, podem coexistir Route Handlers em `apps/web/src/app/api/*` e endpoints equivalentes em `apps/api` (Fastify). Para mitigar:

- Todo Route Handler restante em `apps/web` deve ser explicitamente classificado como **proxy temporário** (com comentário no arquivo) ou **removido**
- Após a Fase 2, `apps/web/src/app/api/` deve conter apenas: `auth/login/route.ts`, `auth/logout/route.ts`, `auth/session/route.ts` (proxies documentados)

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "label": "Fase 1 — W0: Configuração base",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "2.3"]
    },
    {
      "id": 1,
      "label": "Fase 1 — W1: Imports, segurança, logout e auth",
      "tasks": ["1.5", "3.1", "3.2", "4.1", "5.1", "6.1", "6.2", "7.1"]
    },
    {
      "id": 2,
      "label": "Fase 1 — W2: Session service, rate limit e property tests",
      "tasks": ["1.6", "5.2", "7.2", "7.3"]
    },
    {
      "id": 3,
      "label": "Fase 1 — W3: README, scripts e property test de session",
      "tasks": ["7.4", "8.1", "9.1"]
    },
    {
      "id": 4,
      "label": "Fase 1 — W4: Checkpoint Fase 1",
      "tasks": ["10"]
    },
    {
      "id": 5,
      "label": "Fase 2 — W5: Domínio e frontend",
      "tasks": ["11.1", "11.2", "11.3", "11.4", "12.1", "13.1", "13.2", "13.3", "14.1", "15.1", "16.1"]
    },
    {
      "id": 6,
      "label": "Fase 2 — W6: Property tests de projetos e profile",
      "tasks": ["11.5", "11.6", "12.2"]
    },
    {
      "id": 7,
      "label": "Fase 2 — W7: Checkpoint Fase 2",
      "tasks": ["17"]
    },
    {
      "id": 8,
      "label": "Validação — W8: Documentação",
      "tasks": ["18.1", "18.2", "18.3"]
    },
    {
      "id": 9,
      "label": "Validação — W9: Checkpoint final",
      "tasks": ["19"]
    },
    {
      "id": 10,
      "label": "Validação — W10: Relatório",
      "tasks": ["20.1"]
    }
  ]
}
```
