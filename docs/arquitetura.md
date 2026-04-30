# Arquitetura do Sistema

## Visão Geral

Monorepo estruturado em camadas com separação clara de responsabilidades.
Cada aplicação e pacote tem escopo definido e não deve ultrapassar seus limites.

## Estrutura de Diretórios

```
/
├── apps/
│   ├── web/          # Frontend (Next.js + TypeScript)
│   └── api/          # Backend (Node.js + Fastify + TypeScript)
├── packages/
│   ├── ui/           # Componentes compartilhados
│   └── types/        # Tipos e interfaces TypeScript compartilhados
└── docs/
    ├── arquitetura.md
    ├── seguranca.md
    ├── regras-negocio.md
    ├── modelagem.md
    └── prompts/
        └── ai_rules.md
```

## Camadas da API

```
Request → Controller → Service → Repository → Database
```

- **Controller:** recebe a requisição, valida entrada, chama o service, retorna resposta
- **Service:** contém a lógica de negócio, orquestra repositórios
- **Repository:** única camada que acessa o banco de dados via ORM (nunca SQL bruto)

## Princípios

- **Separação de responsabilidades:** controller não acessa banco, repository não contém lógica de negócio
- **Tipagem estrita:** TypeScript `strict: true` em todos os pacotes
- **Validação em camadas:** entrada validada no controller (schema), regras de negócio no service
- **Autenticação obrigatória:** todo endpoint privado passa por middleware de autenticação antes do controller

## Stack Prevista

| Camada     | Tecnologia              |
|------------|-------------------------|
| Frontend   | Next.js + TypeScript    |
| Backend    | Fastify + TypeScript    |
| ORM        | Prisma                  |
| Banco      | PostgreSQL              |
| Auth       | JWT + refresh token     |
| Validação  | Zod                     |
| Monorepo   | pnpm workspaces         |

## Fluxo de Autenticação

```
Client → POST /auth/login → valida credenciais → retorna access_token + refresh_token
Client → request com Bearer token → middleware verifica JWT → controller executa
Client → POST /auth/refresh → valida refresh_token → retorna novo access_token
```
