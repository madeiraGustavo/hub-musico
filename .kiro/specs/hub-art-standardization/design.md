# Design Document -- hub-art-standardization

## Overview

Esta feature realiza a padronizacao e correcoes tecnicas do monorepo **hub-art**. O escopo e cirurgico: renomear pacotes de `hub-musico` para `hub-art`, atualizar documentacao, separar variaveis de ambiente, ajustar rate limiting por rota, corrigir documentacao de seguranca sobre `artist_id`, migrar verificacao de sessao no frontend para a API Fastify, auditar endpoints protegidos, implementar PATCH/DELETE de projetos, adicionar scripts de validacao e atualizar tipos compartilhados.

**Restricoes arquiteturais inviolaveis:**
- `apps/web` e exclusivamente UI -- nenhuma logica de negocio
- `apps/api` (Fastify + Prisma + Zod) e o unico servidor de negocio
- `artist_id` SEMPRE do banco via Prisma, nunca do token JWT ou do cliente
- Nao remover Fastify, Prisma ou Zod
- Mudancas sao cirurgicas -- sem refatoracao de arquitetura

**Fase de migracao atual:** Fase 1 (convivencia) -- auth migrado para Fastify, dashboard ainda usa Route Handlers locais para endpoints nao migrados.

---