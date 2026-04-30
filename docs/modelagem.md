# Modelagem de Dados

## Entidades Principais

### Artist
```
id          UUID        PK
name        VARCHAR(100)
email       VARCHAR(255) UNIQUE
password    VARCHAR(255) — hash bcrypt
bio         TEXT         nullable
location    VARCHAR(100) nullable
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### RefreshToken
```
id          UUID        PK
artist_id   UUID        FK → Artist
token_hash  VARCHAR(255) — hash do refresh token
expires_at  TIMESTAMP
revoked     BOOLEAN     default false
created_at  TIMESTAMP
```

### Media
```
id          UUID        PK
artist_id   UUID        FK → Artist
title       VARCHAR(100)
genre       VARCHAR(50)  nullable
duration    INTEGER      nullable — segundos
storage_key VARCHAR(500) — chave no bucket externo
mime_type   VARCHAR(100)
size_bytes  INTEGER
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Project
```
id          UUID        PK
artist_id   UUID        FK → Artist
title       VARCHAR(100)
description TEXT         nullable
status      ENUM        (draft, active, archived)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Service
```
id          UUID        PK
artist_id   UUID        FK → Artist
title       VARCHAR(100)
description TEXT
price       DECIMAL(10,2)
active      BOOLEAN     default true
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

## Relacionamentos

```
Artist 1──N Media
Artist 1──N Project
Artist 1──N Service
Artist 1──N RefreshToken
```

## Índices

```sql
-- Buscas frequentes por artista
CREATE INDEX idx_media_artist_id ON media(artist_id);
CREATE INDEX idx_project_artist_id ON project(artist_id);
CREATE INDEX idx_service_artist_id ON service(artist_id);

-- Lookup de refresh token
CREATE INDEX idx_refresh_token_hash ON refresh_token(token_hash);
CREATE INDEX idx_refresh_token_artist ON refresh_token(artist_id);
```

## Notas

- Todos os IDs são UUID v4 gerados pelo servidor
- `storage_key` nunca é exposto diretamente ao cliente — apenas URLs assinadas
- Soft delete não implementado na fase inicial — deleção é permanente com validação de dependências
