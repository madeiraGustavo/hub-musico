# apps/api

## Estado atual

Esta pasta contém apenas as **migrations SQL** do banco de dados (Supabase/PostgreSQL).

A lógica de backend está implementada como **Next.js Route Handlers** em `apps/web/src/app/api/`,
usando o Supabase como BaaS (Backend as a Service).

## Migrations

Execute no **SQL Editor** do painel Supabase, em ordem:

| Arquivo | Descrição |
|---|---|
| `001_create_users.sql` | Tabela de usuários (estende auth.users) |
| `002_create_artists.sql` | Perfis públicos de artistas |
| `003_create_tracks.sql` | Faixas musicais / itens de portfólio |
| `004_create_projects.sql` | Projetos / trabalhos |
| `005_create_media_assets.sql` | Arquivos de mídia (áudio e imagem) |
| `006_rbac.sql` | Roles e políticas de acesso (admin/artist/editor) |
| `007_add_profile_type.sql` | Suporte a múltiplos tipos de perfil (musician/tattoo) |

## FASE 6 (planejado)

Quando a API REST dedicada for necessária, esta pasta receberá:
- Fastify ou Hono como servidor HTTP
- Controllers, Services e Repositories separados
- Validação com Zod
- Autenticação via JWT do Supabase
