# @hub-art/api

API Fastify oficial do projeto Hub Art — responsável por toda a lógica de negócio, autenticação e acesso ao banco de dados.

## Responsabilidades

- Autenticação JWT própria (access token 15 min + refresh token 7 dias via cookie HttpOnly)
- Acesso ao banco de dados via Prisma + PostgreSQL (hospedado no Supabase)
- Validação de entrada com Zod
- Regras de negócio (ownership, RBAC, status de projetos)
- Uploads para Supabase Storage

> `apps/web` não acessa o Prisma diretamente — toda lógica de dados passa pela API Fastify.

## Scripts

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Inicia o servidor em modo desenvolvimento com hot-reload |
| `pnpm build` | Compila TypeScript para `dist/` |
| `pnpm start` | Inicia o servidor compilado |
| `pnpm typecheck` | Verifica tipos sem emitir arquivos |
| `pnpm test` | Executa todos os testes com Vitest |
| `pnpm prisma:migrate` | Aplica migrations pendentes |
| `pnpm prisma:generate` | Regenera o Prisma Client |

## Variáveis de ambiente

Copie `apps/api/.env.example` para `apps/api/.env` e preencha:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL (Supabase) |
| `JWT_SECRET` | Segredo para assinar access tokens (mínimo 32 caracteres) |
| `JWT_REFRESH_SECRET` | Segredo para assinar refresh tokens (mínimo 32 caracteres) |
| `ALLOWED_ORIGINS` | Origens permitidas pelo CORS (ex: `http://localhost:3000`) |
| `STORAGE_BUCKET` | Nome do bucket no Supabase Storage |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (para uploads) |
| `PORT` | Porta do servidor (padrão: `3333`) |

## Migrations

As migrations SQL estão em `apps/api/migrations/` e são aplicadas via Prisma:

```bash
pnpm prisma:migrate
```
