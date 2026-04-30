# Regras de Negócio

## Domínio: Artista (Artist)

- Todo recurso do sistema pertence a um `artist_id`
- Um artista só pode visualizar, criar, editar e deletar seus próprios recursos
- O `artist_id` é extraído do JWT autenticado — nunca aceito como parâmetro do cliente
- Artista não pode ser deletado se possuir recursos ativos vinculados

## Domínio: Mídia (Media)

- Upload permitido apenas para tipos: `audio/mpeg`, `audio/wav`, `audio/flac`, `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo de áudio: 50MB
- Tamanho máximo de imagem: 5MB
- Título da mídia: obrigatório, mínimo 2 caracteres, máximo 100
- Após upload, o arquivo original não é servido diretamente — apenas via URL assinada com expiração

## Domínio: Projeto (Project)

- Um projeto pertence a um artista
- Status possíveis: `draft`, `active`, `archived`
- Projeto `archived` não pode receber novas mídias
- Projeto só pode ser deletado se estiver em `draft`

## Domínio: Serviço (Service)

- Preço mínimo: R$ 0,00 (serviço gratuito permitido)
- Preço máximo: R$ 99.999,99
- Descrição: obrigatória, mínimo 10 caracteres, máximo 500
- Serviço inativo não aparece no portfólio público

## Validações Globais

- IDs sempre validados como UUID v4
- Datas sempre em ISO 8601 (UTC)
- Paginação: `page` mínimo 1, `limit` entre 1 e 100
- Campos de texto: trim aplicado antes de qualquer validação
