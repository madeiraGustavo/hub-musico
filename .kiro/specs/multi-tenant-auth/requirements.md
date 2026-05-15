# Multi-Tenant Auth — Requirements

## Visão Geral

Implementar autenticação multi-tenant real na plataforma Arte Hub, onde cada site (marketplace, tattoo, music, platform) possui:

- Login visual próprio (branding, cores, logo)
- Isolamento completo de contas no banco (`unique(siteId, email)`)
- Sessão/JWT com `siteId` obrigatório
- Cookies de sessão isolados por tenant (sem compartilhamento)
- Resolução de tenant pelo backend (nunca confiar no frontend)

---

## Decisões de Produto (Aprovadas)

### 1. Tenants Definidos

| siteId | displayName | Descrição |
|--------|-------------|-----------|
| `platform` | Arte Hub | Painel interno (artistas, admins, editores) |
| `marketplace` | Arte Hub Marketplace | Loja pública para clientes |
| `tattoo` | Studio Tattoo | Site público do tatuador |
| `music` | Arte Hub Music | Site público do músico |

- Usuários existentes migram para `siteId = 'platform'`
- **Não usar** `main` como tenant genérico

### 2. Roles

**Roles internas (platform):**
- `admin` — acesso cross-site, bypass de isolamento
- `artist` — dono do perfil/site
- `editor` — colaborador do artista

**Role cliente (marketplace/tattoo/music):**
- `client` — cliente final do site público

Não substituir roles existentes. Adicionar `client` ao enum.

### 3. Admin Cross-Site

```ts
if (user.role === 'admin') {
  bypassSiteIsolation = true
}
```

Necessário para: suporte, CMS central, auditoria, dashboards cross-tenant.

### 4. Resolução de Tenant pelo Backend

O frontend pode enviar `siteId` no body, mas o backend **DEVE** derivar/confirmar por:
- Hostname
- Slug da rota
- Header interno (`X-Site-Id`)
- Config do proxy

```ts
const site = resolveSiteFromRequest(req)
// Ignora valor arbitrário enviado pelo cliente
```

### 5. Cookies Isolados por Tenant

Cada tenant tem seu próprio cookie de refresh:
- `ah_platform_refresh`
- `ah_marketplace_refresh`
- `ah_tattoo_refresh`
- `ah_music_refresh`

Evita: overwrite de sessão, logout cruzado, refresh token errado.

### 6. Fluxo de Middleware

```
request → resolveSite() → auth() → authorize() → route
```

Tenant é resolvido ANTES da autenticação.

### 7. Backward Compatibility

- `/login` → redirect para `/platform/login`
- Usuários existentes continuam funcionando com `siteId = 'platform'`
- Supabase legado: não mexer agora (wave futura)

---

## Requisitos Funcionais

### RF-01: Login por Site

Cada site deve ter sua própria página de login com rota dinâmica:

```
/[siteSlug]/login
```

Exemplos:
- `/marketplace/login`
- `/tattoo/login`
- `/platform/login`

A rota identifica o site atual pelo `siteSlug` e carrega branding correspondente.

### RF-02: Branding Dinâmico

A tela de login carrega dados do site atual:

```ts
interface SiteConfig {
  id: string
  slug: string
  displayName: string
  logo?: string
  theme: {
    primaryColor: string
    secondaryColor?: string
    backgroundColor?: string
  }
  authEnabled: boolean
}
```

A página altera: título, logo/nome, botão principal, cores de destaque, textos de apoio.
Estrutura do formulário é reutilizada via componente compartilhado.

### RF-03: Isolamento de Conta

O mesmo email pode existir em sites diferentes como contas separadas:

```
siteId: marketplace, email: cliente@email.com  → conta A
siteId: tattoo,      email: cliente@email.com  → conta B
```

Essas contas NÃO compartilham: senha, perfil, pedidos, agendamentos, sessão, histórico.

### RF-04: Signup Multi-Tenant

Endpoint `POST /auth/register`:

```json
{
  "email": "cliente@email.com",
  "password": "senha123",
  "name": "João"
}
```

O `siteId` é derivado pelo backend via `resolveSiteFromRequest(req)`, não enviado pelo cliente.

### RF-05: Sessão com siteId

O token JWT e session response incluem obrigatoriamente:

```json
{
  "userId": "uuid",
  "siteId": "marketplace",
  "email": "cliente@email.com",
  "role": "client"
}
```

Toda rota protegida valida: `session.siteId === currentSite.id`
Se não bater, negar acesso (exceto admin).

### RF-06: Segurança de Queries

Nenhuma busca de usuário deve ser feita apenas por email:

```ts
// ❌ Errado
findUserByEmail(email)

// ✅ Correto
findUserByEmailAndSite(email, siteId)
```

Toda query relacionada a usuário filtra por `siteId`.

### RF-07: Config Estática de Sites

Criar config estática que será migrada para tabela futuramente:

```ts
export const SITES: Record<string, SiteConfig> = {
  platform: { id: 'platform', displayName: 'Arte Hub', ... },
  marketplace: { id: 'marketplace', displayName: 'Arte Hub Marketplace', ... },
  tattoo: { id: 'tattoo', displayName: 'Studio Tattoo', ... },
  music: { id: 'music', displayName: 'Arte Hub Music', ... },
}
```

---

## Modelo de Dados

### User (atualizado)

```prisma
model User {
  id        String   @id @db.Uuid
  siteId    String   @default("platform") @map("site_id") @db.VarChar(50)
  email     String
  password  String?
  role      UserRole @default(artist)
  artistId  String?  @map("artist_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  artist        Artist?
  refreshTokens RefreshToken[]

  @@unique([siteId, email])
  @@index([siteId])
  @@index([role])
  @@index([artistId])
  @@map("users")
}
```

### UserRole (atualizado)

```prisma
enum UserRole {
  admin
  artist
  editor
  client

  @@map("user_role")
}
```

---

## Critérios de Aceite

1. ✅ Marketplace tem login com nome e cores próprios
2. ✅ Tattoo tem login com nome e cores próprios
3. ✅ Mesmo email pode se cadastrar nos dois sites
4. ✅ Login no marketplace não autentica no tattoo
5. ✅ Sessão de um site não libera acesso ao outro
6. ✅ Todas as queries de usuário usam siteId
7. ✅ Existe índice único composto (siteId, email)
8. ✅ Cookies de refresh são isolados por tenant
9. ✅ Backend resolve tenant pela request, não pelo body do cliente
10. ✅ Admin bypassa isolamento de site
11. ✅ `/login` redireciona para `/platform/login`
12. ✅ Usuários existentes migrados para `siteId = 'platform'`

---

## Testes Obrigatórios

### Cadastro
- Deve permitir mesmo email em sites diferentes
- Deve bloquear email duplicado dentro do mesmo site

### Login
- Deve autenticar usuário correto usando siteId + email
- Não deve autenticar usuário de outro site com mesmo email
- Backend deve ignorar siteId enviado pelo frontend

### Sessão
- Deve negar acesso quando session.siteId for diferente do site atual
- Admin deve ter acesso cross-site
- Cookies de refresh não devem colidir entre sites

### Tema
- Deve renderizar displayName e cores do site atual
- `/login` deve redirecionar para `/platform/login`

### Segurança
- Nenhuma query de usuário sem filtro por siteId
- Resolução de tenant vem do backend, não do cliente
