# Requirements Document

## Introduction

Sistema de marketplace para produtos de lona e cobertura (toldos, capotas, capas de mesa, coberturas, lonas industriais) no Arte Hub. O sistema funciona como um catálogo profissional com geração de orçamentos personalizados e vendas simples. Produtos de lona frequentemente não possuem preço fixo — dependem de largura, altura, material e instalação — portanto o sistema permite que clientes solicitem orçamentos que o artista responde manualmente. O marketplace segue a arquitetura existente do Arte Hub: Next.js (frontend), Fastify (backend), Prisma/PostgreSQL (banco) e Supabase Storage (imagens).

## Glossary

- **Marketplace_API**: Endpoints do backend Fastify responsáveis por toda lógica de negócio do marketplace de lonas
- **Public_Marketplace_API**: Endpoints sem autenticação para navegação do catálogo, criação de orçamentos e pedidos
- **Private_Marketplace_API**: Endpoints protegidos pelo hook `authenticate`, acessíveis apenas pelo artista dono dos produtos
- **Marketplace_Web**: Interface frontend Next.js para exibição do catálogo e interação do cliente
- **Dashboard_Marketplace**: Interface frontend Next.js para gerenciamento de produtos, orçamentos e pedidos pelo artista
- **Artist**: Usuário autenticado com `role = artist` ou `admin`, dono dos produtos do marketplace
- **Customer**: Usuário público (não autenticado) que navega o catálogo, solicita orçamentos ou realiza pedidos
- **MarketplaceCategory**: Categoria de produtos (ex: toldos, capotas, coberturas) com nome, slug e ícone
- **MarketplaceProduct**: Produto do catálogo com título, descrição, tipo, preço base opcional, dimensões, material e imagens
- **MarketplaceProductImage**: Imagem associada a um produto com URL, texto alternativo e ordem de exibição
- **MarketplaceQuoteRequest**: Solicitação de orçamento feita por um Customer para um produto customizável, contendo dimensões desejadas e mensagem
- **MarketplaceOrder**: Pedido simples contendo itens, dados do cliente e status de processamento
- **MarketplaceOrderItem**: Item individual dentro de um pedido, referenciando produto, quantidade e preço unitário
- **QuoteStatus**: Estado de um orçamento — `PENDING`, `ANSWERED`, `ACCEPTED`, `REJECTED`, `EXPIRED`
- **OrderStatus**: Estado de um pedido — `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- **ProductType**: Classificação do produto — `FIXED_PRICE` (preço fixo, comprável diretamente) ou `QUOTE_ONLY` (apenas orçamento)
- **Slug**: Identificador URL-friendly gerado a partir do nome/título, usado em rotas públicas

---

## Requirements

### Requirement 1: Gerenciamento de Categorias do Marketplace

**User Story:** Como artista autenticado, quero criar e gerenciar categorias de produtos, para que meu catálogo fique organizado por tipo de produto (toldos, capotas, coberturas, etc.).

#### Acceptance Criteria

1. THE Private_Marketplace_API SHALL expor endpoints `POST /dashboard/marketplace/categories`, `GET /dashboard/marketplace/categories`, `PATCH /dashboard/marketplace/categories/:id` e `DELETE /dashboard/marketplace/categories/:id`, todos protegidos por autenticação JWT
2. WHEN um artista autenticado cria uma MarketplaceCategory, THE Private_Marketplace_API SHALL associar a categoria ao `artistId` extraído do token JWT e retornar HTTP 201 com o recurso criado
3. THE MarketplaceCategory SHALL conter os campos: `name` (string, 2 a 100 caracteres), `slug` (string única por artista, gerada automaticamente a partir do `name` via transliteração para ASCII lowercase com hífens substituindo espaços e caracteres especiais removidos), `icon` (string opcional, máximo 50 caracteres) e `sortOrder` (inteiro, 0 a 999, default 0)
4. WHEN um artista autenticado atualiza ou deleta uma MarketplaceCategory, THE Private_Marketplace_API SHALL verificar que a categoria pertence ao artista autenticado antes de aplicar a modificação
5. IF uma MarketplaceCategory não pertence ao artista autenticado, THEN THE Private_Marketplace_API SHALL retornar HTTP 403
6. IF a MarketplaceCategory referenciada pelo `:id` não existir, THEN THE Private_Marketplace_API SHALL retornar HTTP 404
7. IF um artista tenta criar ou atualizar uma MarketplaceCategory e o `slug` gerado já existe para o mesmo artista, THEN THE Private_Marketplace_API SHALL retornar HTTP 409 com mensagem indicando conflito de slug
8. WHEN um artista tenta deletar uma MarketplaceCategory que possui produtos associados, THE Private_Marketplace_API SHALL rejeitar a operação com HTTP 422 e mensagem indicando que existem produtos vinculados à categoria
9. WHEN um artista autenticado lista suas categorias via `GET /dashboard/marketplace/categories`, THE Private_Marketplace_API SHALL retornar todas as categorias do artista ordenadas por `sortOrder` ascendente
10. THE Public_Marketplace_API SHALL expor `GET /marketplace/categories` retornando todas as categorias que possuem ao menos um produto ativo do artista, ordenadas por `sortOrder` ascendente

### Requirement 2: Gerenciamento de Produtos do Marketplace

**User Story:** Como artista autenticado, quero cadastrar e gerenciar produtos de lona no meu catálogo, para que clientes possam visualizar meus produtos e solicitar orçamentos ou compras.

#### Acceptance Criteria

1. THE Private_Marketplace_API SHALL expor endpoints CRUD para MarketplaceProduct sob o prefixo `/dashboard/marketplace/products`, onde o endpoint GET de listagem suporta paginação via parâmetros `page` (padrão 1) e `pageSize` (padrão 20, máximo 50) e retorna metadados `total`, `page`, `pageSize` e `totalPages`
2. WHEN um artista autenticado cria um MarketplaceProduct, THE Private_Marketplace_API SHALL associar o produto ao `artistId` extraído do token JWT e gerar o `slug` a partir do `title` usando transliteração para ASCII e separação por hífens, acrescentando um sufixo numérico sequencial caso já exista um produto do mesmo artista com slug idêntico
3. THE MarketplaceProduct SHALL conter os campos: `title` (string, mínimo 1 caractere não-espaço, máximo 150 caracteres), `slug` (string única por artista, gerada automaticamente a partir do `title`), `description` (texto, máximo 5000 caracteres), `shortDescription` (string, máximo 300 caracteres), `type` (ProductType), `basePrice` (decimal opcional no intervalo 0.01 a 999999.99, obrigatório quando `type = FIXED_PRICE`), `active` (booleano, padrão `false`), `featured` (booleano, padrão `false`), `customizable` (booleano), `stock` (inteiro opcional, mínimo 0, máximo 99999), `widthCm` (decimal opcional, mínimo 0.1, máximo 99999.9), `heightCm` (decimal opcional, mínimo 0.1, máximo 99999.9), `material` (string opcional, máximo 100 caracteres), `color` (string opcional, máximo 50 caracteres) e `categoryId` (UUID)
4. WHEN um artista autenticado atualiza ou deleta um MarketplaceProduct, THE Private_Marketplace_API SHALL verificar que o produto pertence ao artista autenticado antes de aplicar a modificação
5. IF um MarketplaceProduct não pertence ao artista autenticado, THEN THE Private_Marketplace_API SHALL retornar HTTP 403
6. WHEN `type = FIXED_PRICE` e `basePrice` não é fornecido ou é menor ou igual a zero, THE Private_Marketplace_API SHALL rejeitar a criação ou atualização com HTTP 422
7. IF o `categoryId` fornecido não corresponde a uma MarketplaceCategory existente pertencente ao artista autenticado, THEN THE Private_Marketplace_API SHALL rejeitar a operação com HTTP 422
8. THE Private_Marketplace_API SHALL sanitizar os campos `title`, `description` e `shortDescription` removendo tags HTML antes de armazenar

### Requirement 3: Gerenciamento de Imagens de Produtos

**User Story:** Como artista autenticado, quero fazer upload de múltiplas imagens para cada produto, para que clientes possam visualizar os detalhes visuais dos meus produtos de lona.

#### Acceptance Criteria

1. THE Private_Marketplace_API SHALL expor endpoint de upload de imagens para MarketplaceProduct sob `/dashboard/marketplace/products/:id/images`
2. WHEN um artista autenticado faz upload de uma imagem, THE Marketplace_API SHALL validar que o MIME type real do arquivo (detectado por magic bytes) é `image/jpeg`, `image/png` ou `image/webp`
3. WHEN um artista autenticado faz upload de uma imagem, THE Marketplace_API SHALL validar que o tamanho do arquivo não excede 5 MB
4. IF o arquivo enviado possui MIME type não permitido ou excede o tamanho máximo, THEN THE Private_Marketplace_API SHALL rejeitar o upload com HTTP 422 e mensagem indicando o motivo da rejeição (tipo inválido ou tamanho excedido)
5. WHEN o upload de uma imagem é validado com sucesso, THE Marketplace_API SHALL armazenar a imagem no Supabase Storage e registrar a URL pública no MarketplaceProductImage com sortOrder igual ao próximo valor sequencial para o produto
6. THE MarketplaceProductImage SHALL conter os campos: `url` (string), `alt` (string opcional, máximo 255 caracteres) e `sortOrder` (inteiro para ordenação, iniciando em 0)
7. THE Private_Marketplace_API SHALL permitir reordenação de imagens de um produto via atualização em lote dos valores de `sortOrder`, e exclusão individual de imagens por ID
8. WHEN um artista autenticado tenta fazer upload de imagem para um produto que não pertence ao artista, THE Private_Marketplace_API SHALL retornar HTTP 403
9. IF um produto já possui 10 imagens cadastradas, THEN THE Private_Marketplace_API SHALL rejeitar novos uploads com HTTP 422 e mensagem indicando que o limite máximo de imagens foi atingido
10. WHEN uma imagem é excluída com sucesso do MarketplaceProductImage, THE Private_Marketplace_API SHALL também remover o arquivo correspondente do Supabase Storage

### Requirement 4: Catálogo Público de Produtos

**User Story:** Como cliente, quero navegar o catálogo de produtos de lona com filtros por categoria, para que eu possa encontrar o produto que preciso.

#### Acceptance Criteria

1. THE Public_Marketplace_API SHALL expor `GET /marketplace/products` retornando apenas produtos com `active = true`, incluindo para cada produto os campos: `id`, `slug`, `title`, `description` (truncada em 200 caracteres), `price`, `categoryId`, `featured`, `sortOrder`, `thumbnailUrl` e `createdAt`
2. THE Public_Marketplace_API SHALL suportar filtro por `categoryId` via query string, ignorando o parâmetro e retornando todos os produtos ativos caso o `categoryId` fornecido não corresponda a nenhuma categoria existente
3. THE Public_Marketplace_API SHALL suportar paginação via parâmetros `page` (padrão 1) e `pageSize` (padrão 12, máximo 50)
4. IF o parâmetro `page` for menor que 1 ou `pageSize` for menor que 1 ou maior que 50, THEN THE Public_Marketplace_API SHALL retornar HTTP 400 com mensagem de erro indicando o parâmetro inválido
5. THE Public_Marketplace_API SHALL retornar metadados de paginação: `total`, `page`, `pageSize` e `totalPages`
6. THE Public_Marketplace_API SHALL expor `GET /marketplace/products/:slug` retornando os detalhes de um produto ativo, incluindo todos os campos do produto e o array `images` ordenado por `sortOrder` ascendente
7. IF o slug não corresponde a nenhum produto ativo, THEN THE Public_Marketplace_API SHALL retornar HTTP 404
8. THE Public_Marketplace_API SHALL suportar filtro por `featured = true` via query string para exibição de produtos em destaque
9. THE Public_Marketplace_API SHALL ordenar produtos por `sortOrder` ascendente como padrão, utilizando `createdAt` descendente como critério de desempate
10. IF nenhum produto ativo corresponder aos filtros aplicados, THEN THE Public_Marketplace_API SHALL retornar HTTP 200 com array vazio em `data` e `total` igual a 0 nos metadados de paginação

### Requirement 5: Solicitação de Orçamento

**User Story:** Como cliente, quero solicitar um orçamento personalizado para produtos de lona que dependem de medidas e materiais específicos, para que eu receba uma proposta adequada às minhas necessidades.

#### Acceptance Criteria

1. THE Public_Marketplace_API SHALL expor `POST /marketplace/quotes` sem exigir autenticação
2. WHEN um Customer envia uma solicitação de orçamento com todos os campos obrigatórios válidos, THE Marketplace_API SHALL criar o MarketplaceQuoteRequest com status inicial `PENDING` e retornar HTTP 201 com o identificador do registro criado
3. THE MarketplaceQuoteRequest SHALL conter os campos: `requesterName` (string, máximo 100 caracteres), `requesterEmail` (string, email válido conforme formato RFC 5322), `requesterPhone` (string opcional, máximo 20 caracteres), `productId` (UUID), `message` (texto, máximo 1000 caracteres), `widthCm` (decimal opcional, entre 1.0 e 5000.0), `heightCm` (decimal opcional, entre 1.0 e 5000.0) e `quantity` (inteiro, mínimo 1, máximo 10000)
4. IF o `productId` fornecido não corresponde a um produto ativo, THEN THE Public_Marketplace_API SHALL rejeitar a solicitação com HTTP 422 e uma mensagem de erro indicando que o produto não foi encontrado ou está inativo
5. IF algum campo obrigatório estiver ausente ou com formato inválido, THEN THE Public_Marketplace_API SHALL rejeitar a solicitação com HTTP 400 e uma mensagem de erro indicando quais campos falharam na validação
6. THE Public_Marketplace_API SHALL aplicar rate limit de no máximo 5 solicitações por IP a cada 15 minutos neste endpoint
7. IF o limite de requisições por IP for excedido, THEN THE Public_Marketplace_API SHALL rejeitar a solicitação com HTTP 429 e uma mensagem de erro indicando o tempo restante em segundos até a próxima janela permitida
8. THE Marketplace_API SHALL sanitizar o campo `message` removendo tags HTML antes de armazenar
9. THE Marketplace_API SHALL associar o `artistId` do produto referenciado ao MarketplaceQuoteRequest automaticamente

### Requirement 6: Gerenciamento de Orçamentos pelo Artista

**User Story:** Como artista autenticado, quero visualizar e responder às solicitações de orçamento recebidas, para que eu possa atender meus clientes com propostas personalizadas.

#### Acceptance Criteria

1. THE Private_Marketplace_API SHALL expor `GET /dashboard/marketplace/quotes` retornando os MarketplaceQuoteRequests do artista autenticado, com paginação via parâmetros `page` (padrão 1) e `pageSize` (padrão 20, máximo 50), incluindo metadados `total`, `page`, `pageSize` e `totalPages`
2. THE Private_Marketplace_API SHALL filtrar os orçamentos pelo `artistId` extraído do token JWT e ordenar por `createdAt` descendente como padrão
3. WHEN o parâmetro `status` é fornecido via query string com um valor válido de QuoteStatus, THE Private_Marketplace_API SHALL retornar apenas os orçamentos com o status correspondente
4. IF o parâmetro `status` fornecido via query string não corresponde a um valor válido de QuoteStatus, THEN THE Private_Marketplace_API SHALL retornar HTTP 422
5. THE Private_Marketplace_API SHALL expor `PATCH /dashboard/marketplace/quotes/:id/status` aceitando no corpo da requisição o campo `status` (QuoteStatus) e, quando a transição é para `ANSWERED`, o campo obrigatório `responseMessage` (texto, máximo 2000 caracteres)
6. THE Private_Marketplace_API SHALL aceitar apenas as transições de status: `PENDING → ANSWERED`, `PENDING → REJECTED`, `ANSWERED → ACCEPTED`, `ANSWERED → REJECTED`, `PENDING → EXPIRED`
7. IF a transição de status solicitada não é permitida, THEN THE Private_Marketplace_API SHALL retornar HTTP 422
8. IF o MarketplaceQuoteRequest referenciado pelo `:id` não existe, THEN THE Private_Marketplace_API SHALL retornar HTTP 404
9. IF o MarketplaceQuoteRequest não pertence ao artista autenticado, THEN THE Private_Marketplace_API SHALL retornar HTTP 403

### Requirement 7: Carrinho de Compras

**User Story:** Como cliente, quero adicionar produtos com preço fixo ao carrinho e gerenciar as quantidades, para que eu possa comprar múltiplos itens em um único pedido.

#### Acceptance Criteria

1. THE Marketplace_Web SHALL manter o estado do carrinho no localStorage do navegador do cliente, persistindo os dados entre sessões do navegador
2. WHEN um Customer adiciona um produto ao carrinho, THE Marketplace_Web SHALL verificar que o produto possui `type = FIXED_PRICE` e `basePrice` maior que zero antes de adicioná-lo
3. IF um Customer tenta adicionar ao carrinho um produto que não possui `type = FIXED_PRICE` ou cujo `basePrice` não é maior que zero, THEN THE Marketplace_Web SHALL rejeitar a adição e exibir uma mensagem de erro indicando que o produto não está disponível para compra
4. THE Marketplace_Web SHALL permitir que o Customer altere a quantidade de cada item no carrinho entre o mínimo de 1 e o máximo de 99 unidades por item
5. THE Marketplace_Web SHALL permitir que o Customer remova itens individuais do carrinho
6. THE Marketplace_Web SHALL exibir o subtotal de cada item (quantidade × preço unitário) e o total geral do carrinho, com valores formatados em 2 casas decimais
7. WHEN um produto no carrinho possui `stock` definido e o Customer tenta definir uma quantidade superior ao valor de `stock`, THE Marketplace_Web SHALL limitar a quantidade ao valor máximo de `stock` disponível e exibir uma indicação de que o estoque máximo foi atingido

### Requirement 8: Criação de Pedidos (Checkout Simples)

**User Story:** Como cliente, quero finalizar minha compra informando meus dados de contato, para que o artista receba meu pedido e possa processá-lo.

#### Acceptance Criteria

1. THE Public_Marketplace_API SHALL expor `POST /marketplace/orders` sem exigir autenticação
2. WHEN um Customer envia um pedido válido, THE Marketplace_API SHALL criar o MarketplaceOrder com status inicial `PENDING` e retornar HTTP 201 com os campos `orderId`, `status` e `total`
3. THE MarketplaceOrder SHALL conter os campos: `customerName` (string, máximo 100 caracteres), `customerEmail` (string, email válido conforme RFC 5322), `customerPhone` (string opcional, máximo 20 caracteres), `items` (array de MarketplaceOrderItem, mínimo 1 item, máximo 50 itens) e `total` (decimal calculado pelo backend)
4. EACH MarketplaceOrderItem SHALL conter: `productId` (UUID), `quantity` (inteiro, mínimo 1, máximo 9999) e `unitPrice` (decimal obtido do `basePrice` do produto no momento da criação)
5. THE Marketplace_API SHALL calcular o `total` do pedido somando `quantity × unitPrice` de cada item — o total informado pelo cliente é ignorado
6. IF algum `productId` nos items não corresponde a um produto ativo com `type = FIXED_PRICE`, THEN THE Public_Marketplace_API SHALL rejeitar o pedido com HTTP 422
7. THE Public_Marketplace_API SHALL aplicar rate limit de no máximo 3 pedidos por IP a cada 15 minutos neste endpoint
8. IF os items do pedido referenciam produtos pertencentes a artistas diferentes, THEN THE Public_Marketplace_API SHALL rejeitar o pedido com HTTP 422
9. THE Marketplace_API SHALL associar o `artistId` do primeiro produto do pedido ao MarketplaceOrder automaticamente
10. IF algum item possui `quantity` superior ao `stock` do produto (quando `stock` está definido no produto), THEN THE Public_Marketplace_API SHALL rejeitar o pedido com HTTP 422

### Requirement 9: Gerenciamento de Pedidos pelo Artista

**User Story:** Como artista autenticado, quero visualizar e gerenciar os pedidos recebidos, para que eu possa processar as vendas e atualizar os clientes sobre o status.

#### Acceptance Criteria

1. THE Private_Marketplace_API SHALL expor `GET /dashboard/marketplace/orders` retornando os MarketplaceOrders do artista autenticado com paginação via parâmetros `page` (padrão 1) e `pageSize` (padrão 20, máximo 50), incluindo metadados `total`, `page`, `pageSize` e `totalPages`
2. THE Private_Marketplace_API SHALL filtrar os pedidos pelo `artistId` extraído do token JWT
3. THE Private_Marketplace_API SHALL suportar filtro por `status` via query string, aceitando apenas valores válidos de OrderStatus (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`) e ignorando o filtro quando o valor não é fornecido
4. THE Private_Marketplace_API SHALL ordenar os pedidos por data de criação decrescente (mais recentes primeiro) como padrão
5. THE Private_Marketplace_API SHALL expor `PATCH /dashboard/marketplace/orders/:id/status` aceitando no corpo da requisição o campo `status` (string obrigatória com o novo OrderStatus desejado)
6. THE Private_Marketplace_API SHALL aceitar apenas as transições de status: `PENDING → CONFIRMED`, `CONFIRMED → SHIPPED`, `SHIPPED → DELIVERED`, `PENDING → CANCELLED`, `CONFIRMED → CANCELLED`
7. IF a transição de status solicitada não é permitida, THEN THE Private_Marketplace_API SHALL retornar HTTP 422 com mensagem de erro indicando a transição inválida
8. IF o MarketplaceOrder não pertence ao artista autenticado, THEN THE Private_Marketplace_API SHALL retornar HTTP 403
9. IF o `:id` fornecido no PATCH não corresponde a nenhum MarketplaceOrder existente, THEN THE Private_Marketplace_API SHALL retornar HTTP 404

### Requirement 10: Interface Pública do Marketplace

**User Story:** Como cliente, quero uma interface visual profissional para navegar o catálogo de lonas, para que eu tenha uma experiência de compra agradável e confiável.

#### Acceptance Criteria

1. THE Marketplace_Web SHALL exibir uma página inicial do marketplace (`/marketplace`) com hero section, até 8 produtos em destaque (produtos marcados como `featured = true`) e lista de categorias disponíveis
2. THE Marketplace_Web SHALL exibir uma página de categoria (`/marketplace/category/[slug]`) com grid de produtos filtrados pela categoria selecionada, exibindo no máximo 20 produtos por página com paginação
3. IF uma categoria não possui produtos cadastrados, THEN THE Marketplace_Web SHALL exibir uma mensagem indicando que não há produtos disponíveis nesta categoria
4. THE Marketplace_Web SHALL exibir uma página de produto (`/marketplace/product/[slug]`) com galeria de 1 a 10 imagens, descrição do produto, especificações técnicas (dimensões, material, cor) e botão de ação correspondente ao tipo do produto
5. WHEN um produto possui `type = FIXED_PRICE`, THE Marketplace_Web SHALL exibir o preço formatado em BRL e botão "Adicionar ao Carrinho"
6. WHEN um produto possui `type = QUOTE_ONLY`, THE Marketplace_Web SHALL exibir botão "Solicitar Orçamento" que abre um modal com formulário contendo campos: nome (obrigatório, máximo 100 caracteres), email (obrigatório, formato válido), telefone (obrigatório), dimensões desejadas (obrigatório) e mensagem (opcional, máximo 500 caracteres)
7. IF o cliente submeter o formulário de orçamento com campos obrigatórios não preenchidos ou inválidos, THEN THE Marketplace_Web SHALL exibir mensagens de validação junto aos campos com erro sem fechar o modal
8. THE Marketplace_Web SHALL exibir uma página de carrinho (`/marketplace/cart`) com lista de itens, quantidades editáveis entre 1 e 99 unidades por item, e valor total calculado
9. THE Marketplace_Web SHALL exibir uma página de checkout (`/marketplace/checkout`) com formulário contendo campos: nome completo (obrigatório, máximo 100 caracteres), email (obrigatório, formato válido), telefone (obrigatório) e resumo do pedido com itens e total
10. IF o cliente submeter o formulário de checkout com campos obrigatórios não preenchidos ou inválidos, THEN THE Marketplace_Web SHALL exibir mensagens de validação junto aos campos com erro e não prosseguir com o pedido

### Requirement 11: Interface Dashboard do Marketplace

**User Story:** Como artista autenticado, quero um painel administrativo para gerenciar meu marketplace, para que eu possa controlar produtos, orçamentos e pedidos de forma eficiente.

#### Acceptance Criteria

1. THE Dashboard_Marketplace SHALL exibir uma página de overview (`/dashboard/marketplace`) com métricas resumidas: total de produtos ativos, orçamentos pendentes (status `PENDING`) e pedidos pendentes (status `PENDING`)
2. THE Dashboard_Marketplace SHALL exibir uma página de produtos (`/dashboard/marketplace/products`) com listagem paginada (máximo 20 itens por página), busca por título com mínimo de 2 caracteres, e ações de criar, editar, ativar/desativar e excluir
3. THE Dashboard_Marketplace SHALL exibir uma página de categorias (`/dashboard/marketplace/categories`) com listagem e ações de criar, editar e excluir
4. THE Dashboard_Marketplace SHALL exibir uma página de orçamentos (`/dashboard/marketplace/quotes`) com listagem paginada (máximo 20 itens por página), filtrada por status (PENDING, ANSWERED, ACCEPTED, REJECTED, EXPIRED) e ação de atualizar status
5. THE Dashboard_Marketplace SHALL exibir uma página de pedidos (`/dashboard/marketplace/orders`) com listagem paginada (máximo 20 itens por página), filtrada por status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED) e ação de atualizar status
6. WHEN o artista cria ou edita um produto, THE Dashboard_Marketplace SHALL exibir formulário com os campos: título, descrição, descrição curta, tipo (FIXED_PRICE ou QUOTE_ONLY), preço base, customizável, estoque, largura, altura, material, cor, seleção de categoria e upload de imagens
7. IF o artista não está autenticado, THEN THE Dashboard_Marketplace SHALL redirecionar o usuário para a página de login
8. WHEN o artista solicita exclusão de um produto ou categoria, THE Dashboard_Marketplace SHALL exibir diálogo de confirmação antes de executar a operação
9. WHEN uma ação de criar, editar, excluir ou atualizar status é concluída com sucesso, THE Dashboard_Marketplace SHALL exibir notificação de sucesso visível por no mínimo 3 segundos

### Requirement 12: Segurança e Isolamento de Dados do Marketplace

**User Story:** Como artista autenticado, quero garantia de que apenas eu posso gerenciar meus produtos e visualizar dados de clientes, para que a privacidade dos meus clientes e a integridade do meu catálogo sejam preservadas.

#### Acceptance Criteria

1. THE Private_Marketplace_API SHALL resolver o `artistId` a partir do `userId` contido no token JWT (claim `sub`), consultando o banco de dados, e utilizar esse `artistId` como filtro em todas as operações de escrita e leitura de recursos do artista
2. THE Public_Marketplace_API SHALL retornar apenas produtos com `active = true` em todos os endpoints públicos de listagem
3. IF uma requisição autenticada tenta acessar ou modificar recursos de outro artista (o `artistId` do recurso não corresponde ao `artistId` do usuário autenticado), THEN THE Private_Marketplace_API SHALL retornar HTTP 403 e não executar a operação solicitada
4. THE Public_Marketplace_API SHALL rejeitar campos de texto recebidos de Customers que contenham tags HTML (padrão `<[^>]+>`), retornando erro de validação com indicação do campo inválido
5. WHEN um upload de imagem é recebido, THE Private_Marketplace_API SHALL validar o MIME type real do arquivo por inspeção de magic bytes, aceitar apenas os tipos `image/jpeg`, `image/png` e `image/webp`, rejeitar arquivos cujo MIME declarado não corresponda ao detectado, e limitar o tamanho máximo a 5 MB por arquivo
6. THE Public_Marketplace_API SHALL aplicar rate limiting de no máximo 5 requisições por minuto por IP em endpoints de criação de orçamentos e pedidos, retornando HTTP 429 quando o limite for excedido
7. IF o token JWT estiver ausente, expirado ou com assinatura inválida em uma requisição à Private_Marketplace_API, THEN THE Private_Marketplace_API SHALL retornar HTTP 401 sem processar a operação
