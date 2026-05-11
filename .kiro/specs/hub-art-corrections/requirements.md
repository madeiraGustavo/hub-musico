# Requirements Document

## Introduction

Este spec cobre um conjunto de correções e melhorias no projeto hub-art — um monorepo pnpm com `apps/api` (Fastify + Prisma + TypeScript) e `apps/web` (Next.js 14 + TypeScript). O objetivo é eliminar inconsistências de nomenclatura, atualizar documentação desatualizada, separar variáveis de ambiente por contexto, corrigir o rate limit global, alinhar a documentação de segurança sobre `artist_id`, migrar a verificação de sessão do dashboard para a API Fastify, criar um checklist de segurança de rotas, garantir scripts de validação no monorepo, corrigir endpoints e tipos ausentes, e gerar um relatório final de alterações. A arquitetura Fastify-first é preservada em todas as fases: nenhuma regra de negócio é movida para `apps/web`.

## Glossary

- **API**: O servidor `apps/api` — Fastify + Prisma + TypeScript. Única fonte de lógica de negócio.
- **Web**: O frontend `apps/web` — Next.js 14 + TypeScript. Exclusivamente UI.
- **Monorepo**: Repositório raiz gerenciado com pnpm workspaces.
- **AuthContext**: Objeto `{ userId, artistId, role }` injetado em `request.user` pelo hook `authenticate`.
- **artist_id**: Identificador UUID do artista, extraído do banco via `SELECT artist_id FROM users WHERE id = userId`. Nunca aceito do cliente.
- **JWT**: JSON Web Token emitido pela API Fastify. Access token (15 min) + refresh token (7 dias, cookie HttpOnly).
- **apiClient**: Utilitário de fetch em `apps/web` que envia o Bearer token e trata respostas da API.
- **hub-musico**: Nome antigo do projeto — deve ser completamente substituído por `hub-art`.
- **sort_order**: Nome do campo no banco de dados e no schema Zod da API (snake_case). O frontend deve usar este nome ao enviar dados.
- **Route Handler**: Arquivo `route.ts` do Next.js App Router. Usado apenas como proxy para a API Fastify.

---

## Requirements

### Requirement 1: Padronizar nomenclatura do projeto para hub-art

**User Story:** Como desenvolvedor, quero que todos os arquivos de configuração e código usem o nome `hub-art` de forma consistente, para que não haja confusão entre os nomes antigos (`hub-musico`) e o nome atual do projeto.

#### Acceptance Criteria

1. THE Monorepo SHALL ter o campo `name` do `package.json` raiz igual a `hub-art`.
2. THE Monorepo SHALL ter o campo `description` do `package.json` raiz atualizado para descrever a plataforma hub-art.
3. THE Web SHALL ter o campo `name` do `apps/web/package.json` igual a `@hub-art/web`.
4. THE Web SHALL ter a dependência `@hub-musico/types` substituída por `@hub-art/types` em `apps/web/package.json`.
5. THE API SHALL ter o campo `name` do `apps/api/package.json` igual a `@hub-art/api` (já correto — verificar e manter).
6. THE Monorepo SHALL ter o campo `name` do `packages/types/package.json` igual a `@hub-art/types`.
7. WHEN o comando `grep -R "hub-musico" .` for executado excluindo `.git` e `node_modules`, THE Monorepo SHALL retornar zero ocorrências em arquivos de código e configuração.
8. WHEN qualquer arquivo TypeScript importar tipos compartilhados, THE import SHALL referenciar `@hub-art/types` e não `@hub-musico/types`.

---

### Requirement 2: Atualizar README da API

**User Story:** Como desenvolvedor novo no projeto, quero que o `apps/api/README.md` descreva com precisão a API Fastify atual, para que eu não seja induzido a erro pela documentação desatualizada que ainda menciona Next.js como backend.

#### Acceptance Criteria

1. THE API README SHALL descrever `@hub-art/api` como a API Fastify oficial do projeto.
2. THE API README SHALL listar as responsabilidades da API: autenticação JWT, acesso ao banco via Prisma, validação com Zod, regras de negócio e uploads para Supabase Storage.
3. THE API README SHALL documentar os scripts disponíveis: `dev`, `build`, `start`, `typecheck`, `test`, `prisma:migrate`, `prisma:generate`.
4. THE API README SHALL listar todas as variáveis de ambiente obrigatórias: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`, `STORAGE_BUCKET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`.
5. THE API README SHALL conter nota explícita de que `apps/web` não acessa o Prisma diretamente.
6. IF o `apps/api/README.md` contiver linguagem de "pendente", "planejado" ou referência ao Next.js como backend, THEN THE API README SHALL ter esse conteúdo removido ou corrigido.

---

### Requirement 3: Separar arquivos .env.example por contexto

**User Story:** Como desenvolvedor configurando o ambiente local, quero que cada `.env.example` contenha apenas as variáveis do seu contexto, para que eu saiba exatamente quais variáveis configurar em cada app sem misturar responsabilidades.

#### Acceptance Criteria

1. THE API SHALL ter `apps/api/.env.example` contendo exatamente as variáveis: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`, `STORAGE_BUCKET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT` — com valores de exemplo seguros (sem secrets reais).
2. THE Web SHALL ter `apps/web/.env.local.example` contendo exatamente a variável `NEXT_PUBLIC_API_URL` com valor de exemplo `http://localhost:3333`.
3. THE Monorepo SHALL ter o `.env.example` raiz substituído por um arquivo contendo apenas um comentário explicando que as variáveis de ambiente estão em `apps/api/.env.example` e `apps/web/.env.local.example`.
4. IF o `apps/web/.env.local.example` contiver variáveis do Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), THEN THE Web SHALL ter essas variáveis removidas do arquivo de exemplo.
5. IF o `.env.example` raiz contiver variáveis de backend ou Supabase misturadas, THEN THE Monorepo SHALL ter esse conteúdo substituído pelo comentário de redirecionamento.

---

### Requirement 4: Corrigir rate limit por grupo de rotas

**User Story:** Como usuário do dashboard, quero que a navegação normal não seja bloqueada pelo rate limit, para que eu possa usar o painel sem receber erros 429 durante uso legítimo.

#### Acceptance Criteria

1. THE API SHALL aplicar limite de 10 requisições por minuto para rotas do grupo `/auth/*`.
2. THE API SHALL aplicar limite de 100 requisições por minuto para rotas do grupo `/dashboard/*`.
3. THE API SHALL aplicar limite de 20 requisições por minuto para a rota `/upload`.
4. THE API SHALL aplicar limite de 60 requisições por minuto para todas as demais rotas não cobertas pelos grupos acima.
5. WHEN um cliente exceder o limite de `/auth/*`, THE API SHALL retornar HTTP 429 com mensagem de erro.
6. WHEN um cliente navegar normalmente no dashboard (até 100 req/min), THE API SHALL processar as requisições sem retornar HTTP 429.
7. THE API SHALL implementar os limites diferenciados em `apps/api/src/plugins/rateLimit.ts` sem remover o plugin `@fastify/rate-limit`.

---

### Requirement 5: Corrigir documentação sobre artist_id

**User Story:** Como desenvolvedor implementando novas rotas, quero que a documentação descreva com precisão como o `artist_id` é resolvido, para que eu não cometa o erro de aceitar `artist_id` vindo do cliente.

#### Acceptance Criteria

1. THE Monorepo SHALL ter `docs/regras-negocio.md` com a regra de `artist_id` corrigida: o `artist_id` é resolvido no banco via `SELECT artist_id FROM users WHERE id = userId` — nunca extraído do JWT diretamente nem aceito como parâmetro do cliente.
2. WHEN `grep -R "artist_id" docs/` for executado, THE Monorepo SHALL ter todas as ocorrências coerentes com a regra: `artist_id` vem do banco, não do token.
3. THE Monorepo SHALL ter `docs/seguranca.md` com a seção de `artist_id` alinhada à regra: o payload do JWT contém apenas `{ sub: userId }` e o `artistId` é sempre buscado no banco pelo hook `authenticate`.
4. IF `docs/arquitetura.md` contiver menção ambígua sugerindo que `artist_id` vem do JWT, THEN THE Monorepo SHALL ter essa menção corrigida para refletir a resolução via banco.

---

### Requirement 6: Migrar verificação de sessão do dashboard para a API Fastify

**User Story:** Como usuário do dashboard, quero que a proteção de rotas e a obtenção de dados do usuário usem exclusivamente a API Fastify, para que tokens inválidos ou expirados resultem em redirecionamento para login sem depender do Supabase Auth.

#### Acceptance Criteria

1. THE API SHALL ter o endpoint `GET /auth/session` retornando o objeto `{ authenticated: true, user: { id, email, role }, artist: { id, slug } }` quando o token for válido.
2. THE Web SHALL ter `apps/web/src/app/dashboard/layout.tsx` substituindo `supabase.auth.getUser()` por chamada a `GET /auth/session` via `apiClient`.
3. WHEN `GET /auth/session` retornar HTTP 401, THE Web SHALL redirecionar o usuário para `/login` a partir do `dashboard/layout.tsx`.
4. THE Web SHALL ter `apps/web/src/app/dashboard/page.tsx` substituindo `createAdminClient()` por chamada a `GET /auth/session` para obter `role` e dados do usuário.
5. THE Web SHALL ter `apps/web/src/app/api/auth/logout/route.ts` substituindo `supabase.auth.signOut()` por proxy para `POST /auth/logout` na API Fastify, seguindo o mesmo padrão do Route Handler de login.
6. WHEN o token JWT estiver inválido ou expirado, THE Web SHALL redirecionar o usuário para `/login` sem expor detalhes do erro.
7. IF `dashboard/layout.tsx` ou `dashboard/page.tsx` importarem `createClient` ou `createAdminClient` do Supabase, THEN THE Web SHALL ter essas importações removidas após a migração.

---

### Requirement 7: Criar checklist de segurança de rotas

**User Story:** Como desenvolvedor responsável pela segurança, quero um documento que liste todas as rotas da API com seu estado de autenticação auditado, para que eu possa verificar rapidamente que nenhuma rota privada está exposta sem proteção.

#### Acceptance Criteria

1. THE Monorepo SHALL ter o arquivo `docs/security-checklist.md` criado com uma tabela de todas as rotas da API.
2. THE security-checklist SHALL listar para cada rota: método HTTP, caminho, módulo, se requer `authenticate`, e status de verificação.
3. THE security-checklist SHALL cobrir todos os módulos: `auth`, `profile`, `tracks`, `projects`, `services`, `upload`.
4. WHEN uma rota de escrita (POST, PATCH, DELETE) for listada, THE security-checklist SHALL confirmar que o hook `authenticate` está presente como `preHandler` no código.
5. THE security-checklist SHALL distinguir rotas públicas (sem `authenticate`) de rotas privadas (com `authenticate`), com justificativa para cada rota pública.

---

### Requirement 8: Garantir scripts de validação no monorepo

**User Story:** Como desenvolvedor, quero que `pnpm lint`, `pnpm typecheck` e `pnpm build` executem sem erro fatal a partir da raiz do monorepo, para que a validação do projeto inteiro seja possível com um único comando.

#### Acceptance Criteria

1. THE Monorepo SHALL ter o `package.json` raiz com os scripts `dev`, `build`, `lint`, `typecheck` usando `pnpm -r` ou `pnpm --recursive`.
2. THE Monorepo SHALL ter o `package.json` raiz com o script `test` usando `pnpm -r test` ou equivalente.
3. WHEN qualquer app não possuir o script `test` definido, THE app SHALL ter `"test": "echo \"No tests yet\""` como placeholder para não interromper o `pnpm -r test`.
4. WHEN `pnpm lint` for executado na raiz, THE Monorepo SHALL executar o lint de todos os apps sem erro fatal de configuração.
5. WHEN `pnpm typecheck` for executado na raiz, THE Monorepo SHALL executar o typecheck de todos os apps sem erro fatal de configuração.

---

### Requirement 9: Implementar endpoints PATCH e DELETE para projetos

**User Story:** Como artista autenticado, quero poder editar e deletar projetos pelo dashboard, para que eu possa manter meu portfólio atualizado sem precisar de acesso direto ao banco.

#### Acceptance Criteria

1. THE API SHALL ter o endpoint `PATCH /dashboard/projects/:id` protegido pelo hook `authenticate`.
2. THE API SHALL ter o endpoint `DELETE /dashboard/projects/:id` protegido pelo hook `authenticate`.
3. WHEN `PATCH /dashboard/projects/:id` for chamado, THE API SHALL validar o body com Zod usando um schema parcial dos campos editáveis do projeto.
4. WHEN `PATCH /dashboard/projects/:id` for chamado, THE API SHALL verificar que o projeto pertence ao `artistId` do `AuthContext` antes de atualizar.
5. WHEN `DELETE /dashboard/projects/:id` for chamado, THE API SHALL verificar que o projeto pertence ao `artistId` do `AuthContext` antes de deletar.
6. IF o projeto não pertencer ao artista autenticado, THEN THE API SHALL retornar HTTP 403 com `{ "error": "Acesso negado" }`.
7. IF o projeto não existir, THEN THE API SHALL retornar HTTP 404 com `{ "error": "Projeto não encontrado" }`.
8. IF o projeto estiver com status `active` ou `archived` e `DELETE` for chamado, THEN THE API SHALL retornar HTTP 422 com `{ "error": "Apenas projetos em rascunho podem ser deletados" }`.

---

### Requirement 10: Corrigir campo sortOrder no frontend de serviços

**User Story:** Como artista autenticado, quero que a criação e edição de serviços funcione sem erros de validação, para que eu possa gerenciar meus serviços pelo dashboard sem receber erros 422.

#### Acceptance Criteria

1. THE Web SHALL ter `apps/web/src/app/dashboard/services/page.tsx` enviando o campo como `sort_order` (snake_case) no body das requisições POST e PATCH para `/dashboard/services`.
2. WHEN o body de criação ou edição de serviço for enviado, THE Web SHALL incluir `sort_order` em vez de `sortOrder` para corresponder ao schema Zod da API.
3. THE Web SHALL ter a interface `Service` em `services/page.tsx` com o campo renomeado para `sort_order` para consistência com a API.

---

### Requirement 11: Atualizar tipos compartilhados em packages/types

**User Story:** Como desenvolvedor TypeScript, quero que os tipos em `packages/types` reflitam o schema Prisma atual, para que não haja divergência entre os tipos usados no frontend e a estrutura real do banco de dados.

#### Acceptance Criteria

1. THE Monorepo SHALL ter `packages/types/src/index.ts` com a interface `Track` usando `id: string` (UUID) em vez de `id: number`.
2. THE Monorepo SHALL ter `packages/types/src/index.ts` com a interface `Project` incluindo os campos `status: 'draft' | 'active' | 'archived'` e `sortOrder: number`.
3. WHEN novos campos forem adicionados à interface `Project`, THE Monorepo SHALL manter os campos existentes sem alteração para não quebrar código que já os usa.
4. THE Monorepo SHALL ter `packages/types/src/index.ts` com o enum `TrackGenre` incluindo o valor `'outro'` para corresponder ao schema Prisma.

---

### Requirement 12: Expandir campos retornados pelo profile.repository update

**User Story:** Como desenvolvedor do frontend, quero que o endpoint de atualização de perfil retorne campos suficientes para atualizar o estado local da UI, para que não seja necessário fazer uma segunda requisição GET após cada PATCH.

#### Acceptance Criteria

1. THE API SHALL ter `apps/api/src/modules/profile/profile.repository.ts` com a função `update` retornando os campos: `id`, `name`, `slug`, `tagline`, `bio`, `location`, `reach`, `email`, `whatsapp`, `skills`, `tools`, `isActive`, `updatedAt`.
2. WHEN `PATCH /dashboard/profile` for chamado com sucesso, THE API SHALL retornar o perfil atualizado com todos os campos listados no critério anterior.

---

### Requirement 13: Remover diretórios vazios de Route Handlers do dashboard

**User Story:** Como desenvolvedor, quero que a estrutura de `apps/web/src/app/api/dashboard/` não contenha diretórios sem `route.ts`, para que a estrutura de arquivos reflita apenas o que está implementado.

#### Acceptance Criteria

1. THE Web SHALL ter os subdiretórios vazios de `apps/web/src/app/api/dashboard/` removidos: `profile/`, `projects/`, `tracks/` e quaisquer outros sem `route.ts`.
2. IF um subdiretório de `apps/web/src/app/api/dashboard/` não contiver um arquivo `route.ts`, THEN THE Web SHALL ter esse diretório removido.
3. THE Web SHALL manter o subdiretório `services/` e seus arquivos `route.ts` existentes intactos, se houver.

---

### Requirement 14: Gerar relatório final de alterações

**User Story:** Como desenvolvedor responsável pelo projeto, quero um documento que registre todas as alterações feitas por este spec, para que eu tenha rastreabilidade do que foi corrigido, o que não foi alterado e quais são os próximos passos recomendados.

#### Acceptance Criteria

1. THE Monorepo SHALL ter o arquivo `docs/relatorio-alteracoes.md` criado ao final da implementação.
2. THE relatorio-alteracoes SHALL listar todos os arquivos alterados com uma descrição do que foi corrigido em cada um.
3. THE relatorio-alteracoes SHALL listar os arquivos que não foram alterados e o motivo.
4. THE relatorio-alteracoes SHALL listar os scripts executados durante a implementação e seus resultados.
5. THE relatorio-alteracoes SHALL listar erros encontrados durante a implementação, se houver.
6. THE relatorio-alteracoes SHALL listar os próximos passos recomendados após a conclusão deste spec.
