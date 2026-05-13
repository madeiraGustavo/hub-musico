# Implementation Plan: Marketplace Lonas

## Overview

Implementação do marketplace de lonas para o Arte Hub, seguindo a arquitetura existente (Fastify + Prisma + Next.js + Supabase Storage). O plano segue uma abordagem incremental: schema primeiro, depois módulos backend por dependência, e por fim frontend com carrinho e checkout.

## Tasks

- [x] 1. Database schema e migração
  - [x] 1.1 Adicionar enums e modelos do marketplace ao Prisma schema
    - Adicionar enums `ProductType`, `QuoteStatus`, `OrderStatus` ao `schema.prisma`
    - Adicionar modelos `MarketplaceCategory`, `MarketplaceProduct`, `MarketplaceProductImage`, `MarketplaceQuoteRequest`, `MarketplaceOrder`, `MarketplaceOrderItem`
    - Adicionar relações `marketplaceCategories`, `marketplaceProducts`, `marketplaceQuotes`, `marketplaceOrders` ao modelo `Artist`
    - Gerar e aplicar migração Prisma (`011_create_marketplace.sql`)
    - _Requirements: 1.3, 2.3, 3.6, 5.3, 8.3, 8.4_

- [x] 2. Módulo marketplace-categories (backend)
  - [x] 2.1 Criar estrutura do módulo marketplace-categories
    - Criar `apps/api/src/modules/marketplace-categories/` com arquivos: `marketplace-categories.routes.ts`, `marketplace-categories.controller.ts`, `marketplace-categories.service.ts`, `marketplace-categories.schemas.ts`, `marketplace-categories.repository.ts`
    - Implementar `generateSlug` e `ensureUniqueSlug` no service
    - Implementar schemas Zod para validação de criação e atualização de categorias
    - _Requirements: 1.1, 1.2, 1.3, 1.7_
  - [x] 2.2 Implementar endpoints privados de categorias (CRUD)
    - Implementar `POST /dashboard/marketplace/categories` com geração de slug e verificação de unicidade
    - Implementar `GET /dashboard/marketplace/categories` com ordenação por `sortOrder`
    - Implementar `PATCH /dashboard/marketplace/categories/:id` com ownership check e regeneração de slug
    - Implementar `DELETE /dashboard/marketplace/categories/:id` com verificação de produtos vinculados
    - Registrar rotas no `app.ts`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  - [x] 2.3 Implementar endpoint público de categorias
    - Implementar `GET /marketplace/categories` retornando apenas categorias com ao menos 1 produto ativo
    - _Requirements: 1.10_
  - [x] 2.4 Write property tests for slug generation
    - **Property 1: Slug generation produces valid ASCII output**
    - **Property 2: Slug uniqueness per artist**
    - **Validates: Requirements 1.3, 1.7, 2.2**
  - [x] 2.5 Write unit tests for marketplace-categories
    - Testar criação com slug duplicado → 409
    - Testar delete de categoria com produtos → 422
    - Testar ownership check → 403
    - Testar categoria inexistente → 404
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Checkpoint - Verificar categorias
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Módulo marketplace-products (backend)
  - [x] 4.1 Criar estrutura do módulo marketplace-products
    - Criar `apps/api/src/modules/marketplace-products/` com arquivos: `marketplace-products.routes.ts`, `marketplace-products.controller.ts`, `marketplace-products.service.ts`, `marketplace-products.schemas.ts`, `marketplace-products.repository.ts`
    - Implementar `generateProductSlug`, `sanitizeText`, `validateProductType` no service
    - Implementar schemas Zod para criação, atualização e listagem de produtos (com paginação)
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.8_
  - [x] 4.2 Implementar endpoints privados de produtos (CRUD)
    - Implementar `POST /dashboard/marketplace/products` com sanitização, validação de tipo/preço, verificação de categoryId ownership
    - Implementar `GET /dashboard/marketplace/products` com paginação (`page`, `pageSize`)
    - Implementar `GET /dashboard/marketplace/products/:id` com ownership check
    - Implementar `PATCH /dashboard/marketplace/products/:id` com ownership check e validações
    - Implementar `DELETE /dashboard/marketplace/products/:id` com ownership check e remoção de imagens do Storage
    - Registrar rotas no `app.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  - [x] 4.3 Implementar endpoints públicos de produtos
    - Implementar `GET /marketplace/products` com filtros `categoryId`, `featured`, paginação, ordenação por `sortOrder` ASC + `createdAt` DESC
    - Implementar `GET /marketplace/products/:slug` com detalhes completos e imagens ordenadas
    - Retornar apenas produtos com `active = true`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  - [x] 4.4 Write property tests for product validation
    - **Property 6: FIXED_PRICE requires positive basePrice**
    - **Property 7: HTML sanitization removes all tags**
    - **Validates: Requirements 2.6, 2.8, 12.4**
  - [x] 4.5 Write property tests for public visibility and pagination
    - **Property 4: Public endpoints only return active resources**
    - **Property 5: Pagination metadata consistency**
    - **Validates: Requirements 4.1, 4.3, 4.5, 12.2**
  - [x] 4.6 Write property test for ownership isolation
    - **Property 3: Ownership isolation**
    - **Validates: Requirements 2.4, 2.5, 12.1, 12.3**
  - [x] 4.7 Write unit tests for marketplace-products
    - Testar criação FIXED_PRICE sem preço → 422
    - Testar categoryId de outro artista → 422
    - Testar produto inexistente → 404
    - Testar paginação com parâmetros inválidos → 400
    - _Requirements: 2.5, 2.6, 2.7, 4.4_

- [x] 5. Checkpoint - Verificar produtos
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Módulo marketplace-quotes (backend)
  - [x] 6.1 Criar estrutura do módulo marketplace-quotes
    - Criar `apps/api/src/modules/marketplace-quotes/` com arquivos: `marketplace-quotes.routes.ts`, `marketplace-quotes.controller.ts`, `marketplace-quotes.service.ts`, `marketplace-quotes.schemas.ts`, `marketplace-quotes.repository.ts`
    - Implementar `validateQuoteStatusTransition` no service
    - Implementar schemas Zod para criação de quote e atualização de status
    - _Requirements: 5.1, 5.3, 6.5, 6.6_
  - [x] 6.2 Implementar endpoint público de criação de orçamento
    - Implementar `POST /marketplace/quotes` com rate limit (5 req / 15 min por IP)
    - Validar produto ativo, sanitizar `message`, associar `artistId` automaticamente
    - Retornar HTTP 201 com id e status `PENDING`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  - [x] 6.3 Implementar endpoints privados de orçamentos
    - Implementar `GET /dashboard/marketplace/quotes` com paginação, filtro por status, ordenação por `createdAt` DESC
    - Implementar `PATCH /dashboard/marketplace/quotes/:id/status` com validação de transição e ownership check
    - Registrar rotas no `app.ts`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [x] 6.4 Write property test for quote status transitions
    - **Property 9: Quote status transition validity**
    - **Validates: Requirements 6.5, 6.6, 6.7**
  - [x] 6.5 Write unit tests for marketplace-quotes
    - Testar criação com produto inativo → 422
    - Testar rate limit → 429
    - Testar transição inválida → 422
    - Testar ownership check → 403
    - _Requirements: 5.4, 5.6, 5.7, 6.7, 6.9_

- [x] 7. Módulo marketplace-orders (backend)
  - [x] 7.1 Criar estrutura do módulo marketplace-orders
    - Criar `apps/api/src/modules/marketplace-orders/` com arquivos: `marketplace-orders.routes.ts`, `marketplace-orders.controller.ts`, `marketplace-orders.service.ts`, `marketplace-orders.schemas.ts`, `marketplace-orders.repository.ts`
    - Implementar `validateOrderStatusTransition` e `calculateOrderTotal` no service
    - Implementar schemas Zod para criação de pedido e atualização de status
    - _Requirements: 8.1, 8.3, 8.4, 9.5, 9.6_
  - [x] 7.2 Implementar endpoint público de criação de pedido
    - Implementar `POST /marketplace/orders` com rate limit (3 req / 15 min por IP)
    - Validar produtos ativos + FIXED_PRICE + mesmo artista + estoque
    - Calcular total server-side (ignorar total do cliente)
    - Retornar HTTP 201 com `orderId`, `status`, `total`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
  - [x] 7.3 Implementar endpoints privados de pedidos
    - Implementar `GET /dashboard/marketplace/orders` com paginação, filtro por status, ordenação por `createdAt` DESC
    - Implementar `PATCH /dashboard/marketplace/orders/:id/status` com validação de transição e ownership check
    - Registrar rotas no `app.ts`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_
  - [x] 7.4 Write property tests for order transitions and calculation
    - **Property 10: Order status transition validity**
    - **Property 14: Order total calculated server-side**
    - **Property 15: Order items must belong to same artist**
    - **Property 16: Order stock validation**
    - **Validates: Requirements 8.5, 8.8, 8.10, 9.6, 9.7**
  - [x] 7.5 Write unit tests for marketplace-orders
    - Testar criação com produto inativo → 422
    - Testar produtos de artistas diferentes → 422
    - Testar estoque excedido → 422
    - Testar rate limit → 429
    - Testar transição inválida → 422
    - _Requirements: 8.6, 8.7, 8.8, 8.10, 9.7_

- [x] 8. Checkpoint - Verificar quotes e orders
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Upload de imagens de produtos
  - [x] 9.1 Implementar endpoints de imagem no módulo marketplace-products
    - Implementar `POST /dashboard/marketplace/products/:id/images` com validação de MIME por magic bytes, limite de 5 MB, limite de 10 imagens por produto
    - Implementar `PATCH /dashboard/marketplace/products/:id/images/reorder` para reordenação em batch
    - Implementar `DELETE /dashboard/marketplace/products/:id/images/:imageId` com remoção do Storage + DB
    - Criar bucket `marketplace-images` no Supabase Storage (path pattern: `{artistId}/{productId}/{uuid}.{ext}`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  - [x] 9.2 Write property test for MIME validation
    - **Property 8: MIME validation by magic bytes**
    - **Validates: Requirements 3.2, 3.3, 12.5**
  - [x] 9.3 Write unit tests for image upload
    - Testar upload com MIME inválido → 422
    - Testar upload excedendo 5 MB → 422
    - Testar upload quando produto já tem 10 imagens → 422
    - Testar ownership check → 403
    - _Requirements: 3.2, 3.3, 3.4, 3.8, 3.9_

- [x] 10. Checkpoint - Verificar upload de imagens
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend - Páginas públicas do marketplace
  - [x] 11.1 Criar layout e página inicial do marketplace
    - Criar `apps/web/src/app/marketplace/layout.tsx` com wrapper do marketplace
    - Criar `apps/web/src/app/marketplace/page.tsx` com hero section, até 8 produtos em destaque e lista de categorias
    - Criar componentes `ProductCard.tsx`, `CategoryNav.tsx`, `PaginationControls.tsx`
    - _Requirements: 10.1_
  - [x] 11.2 Criar página de categoria
    - Criar `apps/web/src/app/marketplace/category/[slug]/page.tsx` com grid de produtos filtrados por categoria
    - Implementar paginação (máximo 20 por página)
    - Exibir mensagem quando categoria não possui produtos
    - _Requirements: 10.2, 10.3_
  - [x] 11.3 Criar página de detalhe do produto
    - Criar `apps/web/src/app/marketplace/product/[slug]/page.tsx` com galeria de imagens, descrição, especificações técnicas
    - Criar componente `ProductGallery.tsx` para galeria com thumbnails
    - Exibir botão "Adicionar ao Carrinho" para FIXED_PRICE ou "Solicitar Orçamento" para QUOTE_ONLY
    - _Requirements: 10.4, 10.5, 10.6_
  - [x] 11.4 Criar modal de solicitação de orçamento
    - Criar componente `QuoteModal.tsx` com formulário: nome, email, telefone, dimensões, mensagem
    - Implementar validação client-side dos campos obrigatórios
    - Integrar com `POST /marketplace/quotes`
    - _Requirements: 10.6, 10.7_

- [x] 12. Frontend - Páginas do dashboard marketplace
  - [x] 12.1 Criar layout e página de overview do dashboard marketplace
    - Criar `apps/web/src/app/dashboard/marketplace/layout.tsx`
    - Criar `apps/web/src/app/dashboard/marketplace/page.tsx` com métricas: total de produtos ativos, orçamentos pendentes, pedidos pendentes
    - Criar componente `MetricsCard.tsx`
    - _Requirements: 11.1_
  - [x] 12.2 Criar página de gerenciamento de categorias
    - Criar `apps/web/src/app/dashboard/marketplace/categories/page.tsx` com listagem e ações CRUD
    - Criar componente `CategoryForm.tsx` para criação/edição
    - Implementar diálogo de confirmação para exclusão
    - _Requirements: 11.3, 11.8, 11.9_
  - [x] 12.3 Criar página de gerenciamento de produtos
    - Criar `apps/web/src/app/dashboard/marketplace/products/page.tsx` com listagem paginada e busca por título
    - Criar `apps/web/src/app/dashboard/marketplace/products/[id]/page.tsx` com formulário completo de produto
    - Criar componentes `ProductForm.tsx` e `ImageUploader.tsx` (drag-and-drop)
    - Implementar ações de ativar/desativar e excluir com confirmação
    - _Requirements: 11.2, 11.6, 11.8, 11.9_
  - [x] 12.4 Criar página de gerenciamento de orçamentos
    - Criar `apps/web/src/app/dashboard/marketplace/quotes/page.tsx` com listagem paginada e filtro por status
    - Criar componente `QuoteStatusBadge.tsx`
    - Implementar ação de atualizar status com campo de resposta quando ANSWERED
    - _Requirements: 11.4, 11.9_
  - [x] 12.5 Criar página de gerenciamento de pedidos
    - Criar `apps/web/src/app/dashboard/marketplace/orders/page.tsx` com listagem paginada e filtro por status
    - Criar componente `OrderStatusBadge.tsx`
    - Implementar ação de atualizar status
    - _Requirements: 11.5, 11.9_

- [x] 13. Checkpoint - Verificar páginas frontend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Cart store e checkout
  - [x] 14.1 Implementar Zustand cart store com localStorage
    - Criar `apps/web/src/stores/cartStore.ts` com interface `CartStore`
    - Implementar `addItem` (validar FIXED_PRICE + basePrice > 0), `removeItem`, `updateQuantity` (clampar entre 1 e min(99, stock)), `clearCart`, `total()`
    - Persistir estado no localStorage
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [x] 14.2 Criar página de carrinho
    - Criar `apps/web/src/app/marketplace/cart/page.tsx` com lista de itens, quantidades editáveis, subtotais e total
    - Criar componentes `CartItem.tsx` e `CartSummary.tsx`
    - _Requirements: 10.8_
  - [x] 14.3 Criar página de checkout
    - Criar `apps/web/src/app/marketplace/checkout/page.tsx` com formulário de dados do cliente e resumo do pedido
    - Criar componente `CheckoutForm.tsx` com validação client-side
    - Integrar com `POST /marketplace/orders`
    - Limpar carrinho após pedido bem-sucedido
    - _Requirements: 10.9, 10.10_
  - [x] 14.4 Write property tests for cart store
    - **Property 11: Cart only accepts FIXED_PRICE products**
    - **Property 12: Cart quantity bounds respect stock**
    - **Property 13: Cart total equals sum of item subtotals**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.6, 7.7**

- [x] 15. Listing ordering e segurança
  - [x] 15.1 Implementar proteção de autenticação no dashboard marketplace
    - Verificar redirecionamento para login quando não autenticado
    - Garantir que todos os endpoints privados retornam 401 para JWT ausente/inválido
    - _Requirements: 11.7, 12.7_
  - [x] 15.2 Write property test for listing ordering invariant
    - **Property 17: Listing ordering invariant**
    - **Validates: Requirements 1.9, 4.9, 6.2, 9.4**

- [x] 16. Final checkpoint - Verificação completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project already has `fast-check` in devDependencies for property-based testing
- All backend modules follow the existing pattern: `.routes.ts`, `.controller.ts`, `.service.ts`, `.schemas.ts`, `.repository.ts`
- Frontend uses Next.js App Router with the existing project structure

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5", "4.6", "4.7", "6.1", "7.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "7.2", "7.3"] },
    { "id": 7, "tasks": ["6.4", "6.5", "7.4", "7.5", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "11.1"] },
    { "id": 9, "tasks": ["11.2", "11.3", "12.1"] },
    { "id": 10, "tasks": ["11.4", "12.2", "12.3"] },
    { "id": 11, "tasks": ["12.4", "12.5", "14.1"] },
    { "id": 12, "tasks": ["14.2", "14.3"] },
    { "id": 13, "tasks": ["14.4", "15.1"] },
    { "id": 14, "tasks": ["15.2"] }
  ]
}
```
