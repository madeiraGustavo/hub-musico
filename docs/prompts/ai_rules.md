# Regras para IA — Desenvolvimento Assistido

Este arquivo define restrições absolutas para geração de código neste projeto.
Toda IA assistindo o desenvolvimento deve seguir estas regras sem exceção.

## Regras de Segurança

### SQL
- **NUNCA** usar SQL bruto (`db.query`, `$queryRaw` sem parametrização, template strings com SQL)
- **SEMPRE** usar o ORM (Prisma) para todas as operações de banco de dados
- Exceção única: migrations escritas manualmente e revisadas por humano

### HTML / DOM
- **NUNCA** usar `innerHTML`, `outerHTML` ou `document.write`
- **SEMPRE** usar `textContent`, `createElement` ou framework com escape automático (React, etc.)
- Conteúdo dinâmico inserido no DOM deve ser tratado como não confiável

### Autenticação e Autorização
- **NUNCA** gerar endpoint sem middleware de autenticação (exceto rotas públicas explicitamente documentadas)
- **SEMPRE** validar `artist_id` extraído do JWT — nunca aceitar `artist_id` como parâmetro do cliente
- **NUNCA** expor dados de outro artista, mesmo que o ID seja fornecido

### Upload de Arquivos
- **NUNCA** gerar lógica de upload sem validação de MIME type por magic bytes
- **NUNCA** usar o nome de arquivo enviado pelo cliente — sempre gerar nome no servidor
- **NUNCA** servir arquivos diretamente — sempre usar URLs assinadas com expiração
- **SEMPRE** validar tamanho antes de processar o arquivo

## Regras de Arquitetura

### Separação de Camadas
- **SEMPRE** separar em controller / service / repository
- Controller: apenas recebe request, valida schema, chama service, retorna response
- Service: lógica de negócio, orquestra repositórios, lança erros de domínio
- Repository: única camada que acessa o banco, sem lógica de negócio

### TypeScript
- **SEMPRE** usar TypeScript estrito (`strict: true`)
- **NUNCA** usar `any` sem justificativa explícita em comentário
- **SEMPRE** tipar retornos de funções assíncronas
- **SEMPRE** usar tipos do pacote `/packages/types` para entidades compartilhadas

### Validação
- **SEMPRE** validar entrada com Zod no controller antes de passar ao service
- **NUNCA** confiar em dados vindos do cliente sem validação de schema
- **SEMPRE** validar UUIDs antes de usar como parâmetro de banco

## Checklist Antes de Gerar Código

Antes de gerar qualquer endpoint ou feature, responder:

1. Este endpoint precisa de autenticação? Se sim, o middleware está aplicado?
2. O `artist_id` está sendo extraído do JWT ou do body/params?
3. Existe validação Zod para todos os inputs?
4. O repository usa ORM ou SQL bruto?
5. Existe algum `innerHTML` ou interpolação de string no DOM?
6. Se há upload, o MIME type está sendo validado por magic bytes?
7. Os tipos estão definidos em `/packages/types`?
8. A separação controller/service/repository está respeitada?

## Rotas Públicas Permitidas (sem autenticação)

Documentar aqui toda rota que não requer autenticação:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /portfolio/:artist_id` — portfólio público do artista
