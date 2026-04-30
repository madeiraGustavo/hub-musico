# Segurança

## OWASP Top 10 — Checklist por Feature

Toda feature desenvolvida deve ser revisada contra os itens abaixo antes de merge.

### A01 — Broken Access Control
- [ ] Endpoints privados protegidos por middleware de autenticação
- [ ] Verificação de `artist_id` em toda operação que envolva dados do artista
- [ ] Usuário não pode acessar recursos de outro usuário
- [ ] Roles e permissões validadas no service, não apenas no frontend

### A02 — Cryptographic Failures
- [ ] Senhas armazenadas com bcrypt (custo mínimo 12)
- [ ] Tokens JWT assinados com chave secreta forte (mínimo 256 bits)
- [ ] Refresh tokens armazenados com hash no banco
- [ ] HTTPS obrigatório em produção
- [ ] Dados sensíveis nunca logados

### A03 — Injection
- [ ] Nunca usar SQL bruto — apenas ORM (Prisma)
- [ ] Nunca usar `innerHTML` — apenas `textContent` ou frameworks com escape automático
- [ ] Inputs validados com Zod antes de qualquer processamento
- [ ] Parâmetros de query sanitizados

### A04 — Insecure Design
- [ ] Rate limiting em endpoints de autenticação
- [ ] Limite de tamanho em uploads
- [ ] Paginação obrigatória em listagens

### A05 — Security Misconfiguration
- [ ] Variáveis de ambiente nunca commitadas
- [ ] `.env.example` com chaves sem valores reais
- [ ] Headers de segurança configurados (Helmet)
- [ ] CORS restrito a origens conhecidas

### A06 — Vulnerable Components
- [ ] Dependências auditadas com `pnpm audit` antes de cada release
- [ ] Versões fixadas no `package.json` (sem `^` em produção)

### A07 — Authentication Failures
- [ ] Bloqueio após N tentativas de login falhas
- [ ] Tokens com expiração curta (access: 15min, refresh: 7d)
- [ ] Logout invalida refresh token no banco

### A08 — Software and Data Integrity
- [ ] Uploads validados por MIME type real (magic bytes), não apenas extensão
- [ ] Arquivos enviados para storage externo (S3), nunca servidos diretamente

### A09 — Logging Failures
- [ ] Logs estruturados (JSON) com nível, timestamp e request_id
- [ ] Erros de autenticação logados
- [ ] Dados pessoais e tokens nunca aparecem em logs

### A10 — SSRF
- [ ] URLs externas nunca processadas sem whitelist
- [ ] Requisições a serviços internos não expostas via API pública

## Variáveis de Ambiente Obrigatórias

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
ALLOWED_ORIGINS=
STORAGE_BUCKET=
```

## Upload de Arquivos

- Validação de MIME type por magic bytes (não por extensão)
- Tipos permitidos definidos em whitelist explícita
- Tamanho máximo configurável por tipo
- Arquivos armazenados em bucket externo com URL assinada
- Nome do arquivo gerado pelo servidor (nunca usar nome enviado pelo cliente)
