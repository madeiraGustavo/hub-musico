# Modelagem de Dados

Schema derivado das migrations `apps/api/migrations/001–009`. O Prisma conecta ao PostgreSQL do Supabase via `DATABASE_URL` — sem Supabase client.

## Enums

| Enum              | Valores                                                        | Migration |
|-------------------|----------------------------------------------------------------|-----------|
| `user_role`       | `admin`, `artist`, `editor`                                    | 006       |
| `artist_type`     | `musician`, `tattoo`                                           | 007       |
| `track_genre`     | `piano`, `jazz`, `ambient`, `orquestral`, `rock`, `demo`, `outro` | 003    |
| `project_platform`| `youtube`, `spotify`, `soundcloud`, `outro`                    | 004       |
| `project_status`  | `draft`, `active`, `archived`                                  | 004       |
| `service_icon`    | `drum`, `mic`, `music`, `compose`, `needle`, `camera`, `calendar`, `star` | 009 |
| `media_type`      | `audio`, `image`                                               | 005       |
| `appointment_status` | `PENDING`, `CONFIRMED`, `CANCELLED`, `REJECTED`            | 010       |

## Entidades

### User
Usuário autônomo — autenticação gerenciada exclusivamente pela API Fastify via JWT próprio. Não há dependência do Supabase Auth.

```
id          UUID        PK DEFAULT gen_random_uuid()
email       TEXT        UNIQUE NOT NULL
password    TEXT        nullable — hash bcrypt gerenciado pela API Fastify.
                        Null para usuários migrados sem senha definida.
role        user_role   NOT NULL DEFAULT 'artist'
artist_id   UUID        FK → artists(id) ON DELETE SET NULL, nullable
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**Gerenciamento de `password`:** o campo é preenchido com hash bcrypt pela API Fastify no momento do cadastro ou redefinição de senha. O Supabase Auth não tem acesso nem visibilidade sobre este campo.

### Artist
Perfil público do artista. Um `User` tem no máximo um `Artist` (relação 1:1 via `user_id`).

```
id            UUID        PK DEFAULT gen_random_uuid()
user_id       UUID        UNIQUE NOT NULL FK → users(id) ON DELETE CASCADE
name          VARCHAR(100) NOT NULL
slug          VARCHAR(100) UNIQUE NOT NULL
profile_type  artist_type NOT NULL DEFAULT 'musician'  — adicionado na migration 007
tagline       TEXT        nullable
bio           TEXT[]      nullable
location      VARCHAR(100) nullable
reach         VARCHAR(100) nullable
email         VARCHAR(255) nullable
whatsapp      VARCHAR(20)  nullable
skills        TEXT[]      NOT NULL DEFAULT '{}'
tools         TEXT[]      NOT NULL DEFAULT '{}'
is_active     BOOLEAN     NOT NULL DEFAULT TRUE
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

`profile_type` controla a renderização contextual no frontend (`musician` = perfil musical, `tattoo` = perfil de tatuador). Não altera a estrutura de dados — apenas semântica visual.

### RefreshToken
Gerenciado exclusivamente pela API Fastify. Não existe no Supabase Auth.

```
id          UUID        PK DEFAULT gen_random_uuid()
user_id     UUID        NOT NULL FK → users(id) ON DELETE CASCADE
token_hash  VARCHAR(255) NOT NULL — hash SHA-256 do refresh token JWT
expires_at  TIMESTAMPTZ NOT NULL
revoked     BOOLEAN     NOT NULL DEFAULT FALSE
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

O token JWT em si nunca é armazenado — apenas seu hash. Após uso (rotação), `revoked` é marcado como `true` e um novo par de tokens é emitido.

### Track
Faixas musicais do artista.

```
id           UUID        PK DEFAULT gen_random_uuid()
artist_id    UUID        NOT NULL FK → artists(id) ON DELETE CASCADE
title        VARCHAR(100) NOT NULL — CHECK: 2 ≤ length ≤ 100
genre        track_genre NOT NULL DEFAULT 'outro'
genre_label  VARCHAR(50)  NOT NULL
duration     VARCHAR(10)  nullable — ex: "3:42"
key          VARCHAR(10)  nullable — ex: "Am"
storage_key  TEXT         nullable — caminho no Supabase Storage, nunca exposto diretamente
mime_type    VARCHAR(100) nullable
size_bytes   INTEGER      nullable
is_public    BOOLEAN      NOT NULL DEFAULT TRUE
sort_order   INTEGER      NOT NULL DEFAULT 0
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Project
Projetos e trabalhos do artista.

```
id                  UUID             PK DEFAULT gen_random_uuid()
artist_id           UUID             NOT NULL FK → artists(id) ON DELETE CASCADE
title               VARCHAR(100)     NOT NULL — CHECK: 2 ≤ length ≤ 100
description         TEXT             nullable
year_label          VARCHAR(20)      nullable — ex: "2024"
platform            project_platform NOT NULL DEFAULT 'outro'
tags                TEXT[]           NOT NULL DEFAULT '{}'
href                TEXT             NOT NULL
thumbnail_url       TEXT             nullable
spotify_id          VARCHAR(50)      nullable
featured            BOOLEAN          NOT NULL DEFAULT FALSE
background_style    TEXT             nullable
background_position VARCHAR(50)      nullable
background_size     VARCHAR(50)      nullable
status              project_status   NOT NULL DEFAULT 'active'
sort_order          INTEGER          NOT NULL DEFAULT 0
created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
```

**Constraint de featured:** no máximo um projeto com `featured = true` por artista, implementado via índice parcial (migration 008):
```sql
CREATE UNIQUE INDEX projects_one_featured_true ON public.projects (artist_id) WHERE featured = true;
```
Projetos com `featured = false` são ilimitados. A constraint anterior (`UNIQUE NULLS NOT DISTINCT`) foi removida na migration 008 por impedir múltiplos projetos não-destacados.

### Service
Serviços oferecidos pelo artista, visíveis no portfólio público.

```
id          UUID         PK DEFAULT gen_random_uuid()
artist_id   UUID         NOT NULL FK → artists(id) ON DELETE CASCADE
icon        service_icon NOT NULL DEFAULT 'star'
title       VARCHAR(100) NOT NULL — CHECK: 2 ≤ length ≤ 100
description TEXT         NOT NULL — CHECK: 10 ≤ length ≤ 500
items       TEXT[]       NOT NULL DEFAULT '{}'
price       VARCHAR(100) NOT NULL
highlight   BOOLEAN      NOT NULL DEFAULT FALSE
sort_order  INTEGER      NOT NULL DEFAULT 0
active      BOOLEAN      NOT NULL DEFAULT TRUE
created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```

### MediaAsset
Arquivos de mídia (áudio e imagem) vinculados ao artista.

```
id            UUID       PK DEFAULT gen_random_uuid()
artist_id     UUID       NOT NULL FK → artists(id) ON DELETE CASCADE
entity_type   VARCHAR(50) nullable — ex: 'track', 'project'
entity_id     UUID       nullable — ID da entidade vinculada
media_type    media_type NOT NULL
storage_key   TEXT       UNIQUE NOT NULL — caminho no Supabase Storage, nunca exposto diretamente
original_name VARCHAR(255) nullable — nome original sanitizado, apenas para log
mime_type     VARCHAR(100) NOT NULL
size_bytes    INTEGER    NOT NULL — CHECK: > 0
                         áudio: máx 50 MB (52.428.800 bytes)
                         imagem: máx 5 MB (5.242.880 bytes)
width         INTEGER    nullable — apenas para imagens
height        INTEGER    nullable — apenas para imagens
duration_sec  INTEGER    nullable — apenas para áudio
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

`storage_key` nunca é exposto diretamente ao cliente — apenas URLs assinadas geradas pelo Supabase Storage.

### AvailabilityRule
Regra recorrente semanal que define os horários de trabalho do artista.

```
id           UUID        PK DEFAULT gen_random_uuid()
artist_id    UUID        NOT NULL FK → artists(id) ON DELETE CASCADE
weekday      INTEGER     NOT NULL — 0=domingo, 6=sábado
start_time   VARCHAR(5)  NOT NULL — "HH:MM" em horário local do artista
end_time     VARCHAR(5)  NOT NULL — "HH:MM" em horário local do artista
slot_minutes INTEGER     NOT NULL DEFAULT 60 — duração de cada slot em minutos
active       BOOLEAN     NOT NULL DEFAULT TRUE
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### AvailabilityBlock
Bloqueio pontual de um intervalo de tempo na agenda do artista.

```
id         UUID        PK DEFAULT gen_random_uuid()
artist_id  UUID        NOT NULL FK → artists(id) ON DELETE CASCADE
start_at   TIMESTAMPTZ NOT NULL
end_at     TIMESTAMPTZ NOT NULL
reason     TEXT        nullable
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Appointment
Solicitação de atendimento criada por um usuário público.

```
id              UUID               PK DEFAULT gen_random_uuid()
artist_id       UUID               NOT NULL FK → artists(id) ON DELETE CASCADE
requester_name  VARCHAR(100)       NOT NULL
requester_email VARCHAR(255)       NOT NULL
requester_phone VARCHAR(20)        nullable
service_id      UUID               nullable FK → services(id) ON DELETE SET NULL
start_at        TIMESTAMPTZ        NOT NULL
end_at          TIMESTAMPTZ        NOT NULL
status          appointment_status NOT NULL DEFAULT 'PENDING'
notes           TEXT               nullable
request_code    UUID               UNIQUE NOT NULL DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
```

**Chave de idempotência:** `UNIQUE(artist_id, start_at, requester_email)` — impede duplicação de solicitações.

**Transições de status válidas:**
- `PENDING → CONFIRMED`
- `PENDING → REJECTED`
- `PENDING → CANCELLED`
- `CONFIRMED → CANCELLED`

### Campo `timezone` em Artist

Adicionado na migration 010:
```
timezone  VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo' — timezone IANA do artista
```

## Relacionamentos

```
User     1──1  Artist
User     1──N  RefreshToken
Artist   1──N  Track
Artist   1──N  Project
Artist   1──N  Service
Artist   1──N  MediaAsset
Artist   1──N  AvailabilityRule
Artist   1──N  AvailabilityBlock
Artist   1──N  Appointment
Service  1──N  Appointment (opcional)
```

## Índices

### Índices existentes (migrations 001–009)

```sql
-- users (migration 006)
idx_users_role                ON users(role)
idx_users_artist_id           ON users(artist_id)

-- artists (migration 002, 007)
idx_artists_user_id           ON artists(user_id)
idx_artists_slug              ON artists(slug)
idx_artists_profile_type      ON artists(profile_type)

-- tracks (migration 003)
idx_tracks_artist_id          ON tracks(artist_id)
idx_tracks_genre              ON tracks(genre)
idx_tracks_sort_order         ON tracks(artist_id, sort_order)

-- projects (migration 004, 008)
idx_projects_artist_id        ON projects(artist_id)
idx_projects_status           ON projects(status)
idx_projects_sort_order       ON projects(artist_id, sort_order)
projects_one_featured_true    ON projects(artist_id) WHERE featured = true  -- índice parcial único

-- services (migration 009)
idx_services_artist_id        ON services(artist_id)
idx_services_sort_order       ON services(artist_id, sort_order)
idx_services_active           ON services(artist_id, active)

-- media_assets (migration 005)
idx_media_assets_artist_id    ON media_assets(artist_id)
idx_media_assets_entity       ON media_assets(entity_type, entity_id)
idx_media_assets_storage_key  ON media_assets(storage_key)
```

### Índices para o modelo de auth JWT

```sql
-- refresh_tokens
idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)  -- lookup por hash no refresh
idx_refresh_tokens_user_id    ON refresh_tokens(user_id)     -- revogação em massa no logout
```

## Notas

- Todos os IDs são UUID v4 gerados pelo servidor (`gen_random_uuid()`)
- `storage_key` nunca é exposto diretamente ao cliente — apenas URLs assinadas
- `password` e `RefreshToken` são gerenciados exclusivamente pela API Fastify — o Supabase Auth não tem acesso a esses dados
- Soft delete não implementado — deleção é permanente com validação de dependências
- `updated_at` é atualizado automaticamente via trigger `set_updated_at()` (definido na migration 001)
- RLS está habilitado em todas as tabelas; pode ser desabilitado gradualmente nas tabelas à medida que a API Fastify assume o controle de acesso via Prisma
