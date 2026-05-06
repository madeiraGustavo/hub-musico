# Requirements Document

## Introduction

O hub-musico está migrando de uma arquitetura Supabase-first (Next.js Route Handlers + Supabase Auth SSR + Supabase Admin client) para uma arquitetura Fastify-first, onde `apps/api` passa a ser uma API REST dedicada com Fastify + Prisma. O Next.js (`apps/web`) passa a ser exclusivamente frontend, sem Route Handlers de negócio.

Esta migração acontece em fases para garantir continuidade do serviço. O Supabase continua sendo usado como banco de dados PostgreSQL e storage de arquivos — apenas a camada de autenticação e os endpoints de negócio migram para o Fastify.

O escopo deste spec é:
1. Atualizar a documentação de arquitetura (`docs/arquitetura.md`) para refletir a decisão Fastify-first
2. Atualizar a modelagem de dados (`docs/modelagem.md`) para alinhar com o schema real do banco
3. Atualizar a documentação de segurança (`docs/seguranca.md`) para o novo modelo de auth com JWT próprio
4. Definir as fases de migração do backend atual (Route Handlers) para Fastify
5. Definir a convivência entre Supabase (banco/storage) e Fastify (API/auth) durante a transição

## Glossary

- **API**: O servidor Fastify em `apps/api`, responsável por toda lógica de negócio e autenticação
- **Web**: O frontend Next.js em `apps/web`, responsável exclusivamente por renderização e UX
- **Route_Handler**: Endpoint de API implementado como Next.js Route Handler em `apps/web/src/app/api/`
- **Supabase**: Plataforma BaaS usada como PostgreSQL gerenciado e storage de arquivos
- **Supabase_Auth**: Sistema de autenticação do Supabase, atualmente em uso via cookies HttpOnly
- **Prisma**: ORM TypeScript usado pela API Fastify para acesso ao banco
- **JWT**: JSON Web Token emitido pela API Fastify para autenticação stateless
- **Access_Token**: JWT de curta duração (15 min) emitido pela API após login
- **Refresh_Token**: Token de longa duração (7 dias) armazenado em cookie HttpOnly, usado para renovar o Access_Token
- **RLS**: Row Level Security — políticas de acesso por linha no PostgreSQL/Supabase
- **requireAuth**: Helper atual em `apps/web/src/lib/auth/requireAuth.ts` que valida sessão Supabase nos Route Handlers
- **Middleware**: `apps/web/src/middleware.ts` — camada de defesa que bloqueia requests não autenticados no Next.js
- **Artist**: Entidade principal do sistema, representa um perfil de artista (músico ou tatuador)
- **artist_id**: Identificador do perfil de artista, extraído do banco — nunca do token ou do frontend
- **Fase_1**: Período de convivência onde Route Handlers e API Fastify coexistem
- **Fase_2**: Período onde todos os endpoints de negócio foram migrados para a API Fastify
- **Fase_3**: Estado final onde os Route Handlers de negócio são removidos do Next.js

---

## Requirements

### Requirement 1: Atualizar documentação de arquitetura

**User Story:** Como desenvolvedor do projeto, quero que `docs/arquitetura.md` reflita a arquitetura Fastify-first decidida, para que novos contribuidores entendam a estrutura real do sistema e não implementem novos endpoints no lugar errado.

#### Acceptance Criteria

1. THE `docs/arquitetura.md` SHALL descrever `apps/api` como o servidor Fastify responsável por toda lógica de negócio e autenticação
2. THE `docs/arquitetura.md` SHALL descrever `apps/web` como frontend exclusivo, sem Route Handlers de negócio
3. THE `docs/arquitetura.md` SHALL documentar a stack atual com as tecnologias reais: Next.js (frontend), Fastify + Prisma (backend), PostgreSQL via Supabase (banco), Supabase Storage (arquivos), JWT próprio (auth)
4. THE `docs/arquitetura.md` SHALL documentar o fluxo de requisição: `Web → API (Fastify) → Prisma → PostgreSQL`
5. THE `docs/arquitetura.md` SHALL documentar o fluxo de autenticação com JWT próprio: login, uso do Access_Token em Bearer header, renovação via Refresh_Token em cookie HttpOnly
6. THE `docs/arquitetura.md` SHALL documentar as três fases de migração com critérios de entrada e saída para cada fase
7. WHEN um desenvolvedor ler `docs/arquitetura.md`, THE documento SHALL deixar claro que novos endpoints de negócio devem ser criados na API Fastify, não como Route Handlers no Next.js
8. THE `docs/arquitetura.md` SHALL documentar como o Web se comunica com a API durante cada fase (proxy via Next.js na Fase_1, chamada direta na Fase_2 e Fase_3)

### Requirement 2: Atualizar documentação de modelagem de dados

**User Story:** Como desenvolvedor do projeto, quero que `docs/modelagem.md` reflita o schema real do banco de dados (incluindo as migrations já executadas), para que a documentação seja fonte confiável de verdade sobre a estrutura de dados.

#### Acceptance Criteria

1. THE `docs/modelagem.md` SHALL documentar todas as entidades presentes nas migrations de `apps/api/migrations/` (users, artists, tracks, projects, media_assets, services, roles/RBAC, profile_type)
2. THE `docs/modelagem.md` SHALL documentar a entidade `RefreshToken` necessária para o novo modelo de auth JWT próprio
3. WHEN a entidade `Artist` for documentada, THE `docs/modelagem.md` SHALL incluir o campo `profile_type` adicionado pela migration `007_add_profile_type.sql`
4. THE `docs/modelagem.md` SHALL documentar que `password` e `Refresh_Token` são gerenciados pela API Fastify, não pelo Supabase_Auth
5. THE `docs/modelagem.md` SHALL documentar os índices existentes e os novos índices necessários para o modelo de auth JWT
6. THE `docs/modelagem.md` SHALL documentar a relação entre `auth.users` do Supabase e a tabela `users` do sistema durante a Fase_1 (convivência)

### Requirement 3: Atualizar documentação de segurança

**User Story:** Como desenvolvedor do projeto, quero que `docs/seguranca.md` descreva o modelo de segurança do novo sistema Fastify + JWT, para que implementações de auth e proteção de endpoints sigam o padrão correto.

#### Acceptance Criteria

1. THE `docs/seguranca.md` SHALL documentar o novo modelo de autenticação: JWT emitido pela API Fastify, Access_Token em Bearer header, Refresh_Token em cookie HttpOnly
2. THE `docs/seguranca.md` SHALL documentar as variáveis de ambiente obrigatórias para o novo modelo: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`, `STORAGE_BUCKET`
3. THE `docs/seguranca.md` SHALL manter o checklist OWASP Top 10 atualizado para o novo modelo (ex: A07 agora descreve JWT próprio, não Supabase_Auth)
4. WHEN um Route_Handler for migrado para a API Fastify, THE `docs/seguranca.md` SHALL descrever o padrão de proteção equivalente ao `requireAuth()` atual, implementado como plugin Fastify de autenticação
5. THE `docs/seguranca.md` SHALL documentar que `artist_id` continua sendo extraído do banco via Prisma — nunca do token JWT ou do frontend
6. THE `docs/seguranca.md` SHALL documentar a estratégia de convivência de auth durante a Fase_1: Supabase_Auth para sessões existentes, JWT próprio para novos logins via API Fastify
7. IF um request chegar à API Fastify sem Access_Token válido, THEN THE API SHALL retornar HTTP 401 com corpo `{ "error": "Não autorizado" }`
8. IF um Access_Token válido for apresentado mas o `artist_id` não existir no banco, THEN THE API SHALL retornar HTTP 403 com corpo `{ "error": "Perfil de artista não configurado" }`
9. THE `docs/seguranca.md` SHALL documentar que o Middleware do Next.js (`apps/web/src/middleware.ts`) continua ativo durante a Fase_1 para proteger rotas de UI, mas não é responsável por autenticar chamadas à API Fastify

### Requirement 4: Definir fases de migração do backend

**User Story:** Como desenvolvedor do projeto, quero um plano de migração em fases claramente definido, para que a transição de Route Handlers para Fastify aconteça sem interrupção do serviço e com critérios objetivos de progresso.

#### Acceptance Criteria

1. THE plano de migração SHALL definir exatamente três fases: Fase_1 (convivência), Fase_2 (migração completa), Fase_3 (limpeza)
2. WHEN a Fase_1 estiver ativa, THE sistema SHALL manter todos os Route Handlers existentes funcionando enquanto a API Fastify é construída em paralelo
3. WHEN a Fase_1 estiver ativa, THE Web SHALL usar os Route Handlers existentes para endpoints ainda não migrados e a API Fastify para endpoints já migrados
4. WHEN a Fase_2 estiver ativa, THE Web SHALL chamar exclusivamente a API Fastify para todos os endpoints de negócio
5. WHEN a Fase_3 estiver ativa, THE Route_Handlers de negócio SHALL ser removidos de `apps/web/src/app/api/dashboard/` e `apps/web/src/app/api/upload/`
6. THE plano de migração SHALL definir a ordem de migração dos endpoints: auth primeiro, depois dashboard (profile, tracks, projects, services), depois upload
7. THE plano de migração SHALL especificar que os Route Handlers de auth (`/api/auth/login`, `/api/auth/logout`, `/api/auth/session`) são os primeiros a serem migrados, pois bloqueiam a migração dos demais
8. IF um endpoint for migrado para a API Fastify, THEN o Route_Handler correspondente SHALL ser mantido como proxy temporário durante a Fase_1 para não quebrar clientes existentes
9. THE plano de migração SHALL definir critérios de conclusão da Fase_1: todos os endpoints de auth migrados e testados na API Fastify

### Requirement 5: Definir convivência Supabase + Fastify

**User Story:** Como desenvolvedor do projeto, quero que a documentação descreva claramente como Supabase e Fastify coexistem durante e após a migração, para que não haja ambiguidade sobre qual sistema é responsável por cada função.

#### Acceptance Criteria

1. THE documentação SHALL definir que o Supabase continua sendo o banco de dados PostgreSQL gerenciado durante todas as fases
2. THE documentação SHALL definir que o Supabase Storage continua sendo usado para armazenamento de arquivos de mídia durante todas as fases
3. THE documentação SHALL definir que o Supabase_Auth é substituído pelo JWT próprio da API Fastify a partir da Fase_2
4. WHEN a Fase_1 estiver ativa, THE documentação SHALL descrever que Supabase_Auth e JWT próprio coexistem: sessões existentes usam Supabase_Auth, novos logins via API Fastify usam JWT próprio
5. THE documentação SHALL especificar que o RLS do Supabase pode ser desabilitado gradualmente nas tabelas à medida que a API Fastify assume o controle de acesso via Prisma
6. THE documentação SHALL especificar que o Prisma se conecta ao PostgreSQL do Supabase via `DATABASE_URL` com a connection string direta (não via Supabase client)
7. THE documentação SHALL especificar que o Supabase Admin client (`service_role`) usado atualmente no `requireAuth()` é substituído pelo Prisma na API Fastify
8. WHEN o Supabase_Auth for desativado na Fase_3, THE `apps/web/src/middleware.ts` SHALL ser atualizado para validar o JWT próprio em vez de usar `supabase.auth.getUser()`
9. THE documentação SHALL especificar que o `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SUPABASE_URL` continuam necessários no Web durante a Fase_1 para o Middleware, mas são removidos na Fase_3
