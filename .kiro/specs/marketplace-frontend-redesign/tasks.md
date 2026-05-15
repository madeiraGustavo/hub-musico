# Implementation Plan: Marketplace Frontend Redesign

## Overview

Transform the marketplace frontend from a generic client-rendered interface into a premium, SEO-optimized experience using Server Components, scoped design tokens, and modern UX patterns. Implementation follows a foundation-first approach: design tokens → utility libraries → shared components → page rewrites → tests.

## Tasks

- [x] 1. Foundation: Design Tokens and CSS Custom Properties
  - [x] 1.1 Create marketplace CSS custom properties and scoped styles
    - Add `.marketplace` wrapper class with CSS custom properties for all semantic tokens (bg, text, border, accent colors)
    - Add Playfair Display font import via Google Fonts in the marketplace layout
    - Define spacing, shadow, and border-radius tokens as CSS variables
    - Ensure tokens do NOT conflict with the existing dark theme in tailwind.config.ts
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 Update marketplace layout with providers, fonts, and wrapper
    - Modify `apps/web/src/app/marketplace/layout.tsx` to include `.marketplace` wrapper class
    - Add ToastContainer rendering in layout
    - Add MarketplaceFooter rendering in layout
    - Remove static metadata export (pages will use generateMetadata)
    - _Requirements: 1.1, 1.4, 2.1, 8.3_

- [x] 2. Utility Libraries and State
  - [x] 2.1 Create server-side API fetch functions
    - Create `apps/web/src/lib/marketplace/api.ts` with `fetchProducts`, `fetchProduct`, `fetchCategories`
    - Use `fetch` with `{ next: { revalidate: 60 } }` for ISR caching
    - Return safe fallback data on error (empty arrays, null)
    - _Requirements: 13.1, 6.1_

  - [x] 2.2 Create product filter utility
    - Create `apps/web/src/lib/marketplace/filterProducts.ts`
    - Implement case-insensitive title substring matching
    - Export pure function for testability
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.3 Create metadata generation utility
    - Create `apps/web/src/lib/marketplace/metadata.ts`
    - Implement `generateProductMetadata`, `generateCategoryMetadata`, `generateHomeMetadata`
    - Follow pattern: "{Name} | Lonas SP - Toldos e Coberturas Sob Medida"
    - Include og:title, og:description, og:image, robots, canonical
    - _Requirements: 13.1, 13.8, 13.9_

  - [x] 2.4 Create toast store with Zustand
    - Create `apps/web/src/stores/toastStore.ts`
    - Implement `addToast` (generates unique id), `removeToast`
    - Cap at 5 simultaneous toasts (remove oldest on overflow)
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 3. Checkpoint - Foundation verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Shared UI Components (no page dependencies)
  - [x] 4.1 Create Breadcrumb component
    - Create `apps/web/src/components/marketplace/Breadcrumb.tsx`
    - Render navigation path with links; last item is non-clickable current page
    - Use semantic `nav` with `aria-label="Breadcrumb"` and `ol` list
    - _Requirements: 2.4, 15.4_

  - [x] 4.2 Create Toast component and ToastContainer
    - Create `apps/web/src/components/marketplace/Toast.tsx`
    - Implement slide-in from right animation, fade-out on dismiss
    - Auto-dismiss after configured duration (3s success, 5s error)
    - Stack vertically with 8px gap, position fixed top-right
    - Add `role="alert"` and `aria-live="polite"` for screen readers
    - Respect `prefers-reduced-motion`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.4, 15.5_

  - [x] 4.3 Create EmptyState component
    - Create `apps/web/src/components/marketplace/EmptyState.tsx`
    - Support variants: cart, search, category, product
    - Render SVG icon (min 64x64), heading-3 title, muted description, optional CTA button
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 4.4 Create CheckoutStepper component
    - Create `apps/web/src/components/marketplace/CheckoutStepper.tsx`
    - Render 3 steps: Carrinho, Dados, Confirmação
    - Visual states: completed (check icon), active (highlighted), disabled (muted)
    - Extract step derivation logic into pure function for testability
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 4.5 Create SearchBar component
    - Create `apps/web/src/components/marketplace/SearchBar.tsx`
    - Input with search icon, 300ms debounce, clear button
    - Optional category dropdown/pills
    - `aria-label="Buscar produtos"` on input
    - _Requirements: 4.1, 4.2, 3.5, 15.1_

  - [x] 4.6 Create SkeletonCard and SkeletonProductDetail components
    - Create `apps/web/src/components/marketplace/SkeletonCard.tsx`
    - Create `apps/web/src/components/marketplace/SkeletonProductDetail.tsx`
    - Use `animate-pulse` with proportional dimensions matching real content
    - _Requirements: 6.1, 6.2_

  - [x] 4.7 Create JsonLd component
    - Create `apps/web/src/components/marketplace/JsonLd.tsx`
    - Support Product, BreadcrumbList, and LocalBusiness schema types
    - Render as `<script type="application/ld+json">` with valid JSON
    - Omit optional fields when data is incomplete; never output invalid JSON
    - _Requirements: 13.2, 13.3, 13.4_

  - [x] 4.8 Create MarketplaceFooter component
    - Create `apps/web/src/components/marketplace/MarketplaceFooter.tsx`
    - Include company info, navigation links, semantic `footer` element
    - _Requirements: 13.6, 15.4_

- [x] 5. Feature Components (depend on shared components)
  - [x] 5.1 Create HeroSection component
    - Create `apps/web/src/components/marketplace/HeroSection.tsx`
    - Clean/neutral background (no external Unsplash image), serif title, sans-serif subtitle
    - Two CTA buttons (primary orange, secondary outlined)
    - Social proof indicator with SVG avatars ("120+ clientes atendidos")
    - Staggered fade-in animation (100ms delay between elements)
    - Mobile: stack CTAs vertically, reduce title size, hide avatar social proof
    - Integrated search/filter bar (category dropdown + redirect to catalog)
    - Respect `prefers-reduced-motion`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.1, 11.4_

  - [x] 5.2 Rewrite ProductCard component
    - Rewrite `apps/web/src/components/marketplace/ProductCard.tsx`
    - Image with SVG placeholder (gradient, no emoji), category badge top-right
    - Serif title, formatted price or "Sob consulta" in orange
    - Hover: elevation shadow, scale(1.02), "Ver Detalhes" overlay button, 200ms transition
    - Spec summary (dimensions, material) with small icons
    - Responsive grid: 1 col <640px, 2 cols 640-1024px, 3 cols >1024px
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.2_

  - [x] 5.3 Create SocialProofSection component
    - Create `apps/web/src/components/marketplace/SocialProofSection.tsx`
    - "Sobre Nós" text + metrics in 2-column layout
    - Metrics in dark cards with large serif numbers, count-up animation on viewport entry
    - Testimonials card with star rating SVG, quote text, author name/role
    - Respect `prefers-reduced-motion` for count-up
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 5.4 Create ProjectsSection component
    - Create `apps/web/src/components/marketplace/ProjectsSection.tsx`
    - Grid of project images (SVG placeholders), titles, "Ver Todos" button
    - _Requirements: 12.5_

  - [x] 5.5 Rewrite MarketplaceHeader component
    - Rewrite `apps/web/src/components/marketplace/MarketplaceHeader.tsx`
    - Sticky header with backdrop-blur on scroll (threshold 50px)
    - Desktop: logo + nav links + cart badge (from cartStore) + login button
    - Mobile (<768px): hamburger menu with slide-in panel (translateX animation)
    - Cart badge shows item count from Zustand store (client island)
    - Semantic `header` and `nav` elements, aria-labels on icon buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 14.4, 15.1, 15.4_

  - [x] 5.6 Improve ProductGallery component
    - Modify `apps/web/src/components/marketplace/ProductGallery.tsx`
    - Animated transitions between images on thumbnail click
    - SVG placeholder with gradient when no images
    - Mobile: full-width gallery with horizontal thumbnail scroll
    - _Requirements: 7.1, 7.2, 14.2_

  - [x] 5.7 Improve QuoteModal accessibility and animation
    - Modify `apps/web/src/components/marketplace/QuoteModal.tsx`
    - Entry animation: scale(0.95) + fade → scale(1) + full opacity (200ms)
    - Overlay fade animation (150ms)
    - Focus trap: cycle focus within modal elements
    - Close on Escape, return focus to trigger button
    - `aria-modal="true"`, `role="dialog"`, `aria-labelledby`
    - _Requirements: 11.3, 15.3_

  - [x] 5.8 Improve PaginationControls visual design
    - Modify `apps/web/src/components/marketplace/PaginationControls.tsx`
    - Apply premium visual styling consistent with design tokens
    - Ensure touch targets ≥44x44px on mobile
    - _Requirements: 1.6, 14.4_

- [x] 6. Checkpoint - Components verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Page Rewrites (Server Components + SEO)
  - [x] 7.1 Rewrite marketplace home page as Server Component
    - Rewrite `apps/web/src/app/marketplace/page.tsx`
    - Convert to Server Component with `generateMetadata()` for dynamic SEO
    - Fetch products and categories server-side via `lib/marketplace/api.ts`
    - Compose: HeroSection, SearchBar (client island), ProductCard grid, SocialProofSection, ProjectsSection
    - Add LocalBusiness JSON-LD and BreadcrumbList JSON-LD
    - Use SkeletonCard in Suspense boundaries for loading states
    - Semantic HTML5 structure (section, article), single h1
    - _Requirements: 3.1, 4.3, 5.4, 6.1, 12.1, 13.1, 13.3, 13.4, 13.6, 13.7_

  - [x] 7.2 Rewrite product detail page as Server Component
    - Rewrite `apps/web/src/app/marketplace/product/[slug]/page.tsx`
    - Convert to Server Component with `generateMetadata()` for per-product SEO
    - Fetch product detail server-side, render ProductGallery (client island)
    - Specs grid with icons (width, height, material, color)
    - Breadcrumb: Marketplace > Categoria > Produto
    - Product JSON-LD and BreadcrumbList JSON-LD
    - SkeletonProductDetail in Suspense boundary
    - robots: index, follow; canonical URL
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 13.1, 13.2, 13.3, 13.6, 13.7, 13.8, 13.9_

  - [x] 7.3 Rewrite category page as Server Component
    - Rewrite `apps/web/src/app/marketplace/category/[slug]/page.tsx`
    - Convert to Server Component with `generateMetadata()` for per-category SEO
    - Fetch products by category server-side
    - Breadcrumb: Marketplace > Categoria
    - BreadcrumbList JSON-LD
    - EmptyState when category has no products
    - robots: index, follow; canonical URL
    - _Requirements: 10.2, 13.1, 13.3, 13.6, 13.8, 13.9_

  - [x] 7.4 Modify cart page with redesigned visuals
    - Modify `apps/web/src/app/marketplace/cart/page.tsx`
    - Apply premium design tokens and styling
    - Add Breadcrumb (Marketplace > Carrinho)
    - EmptyState when cart is empty with CTA to catalog
    - Toast on item removal
    - robots: noindex
    - _Requirements: 2.4, 10.1, 8.1, 13.8_

  - [x] 7.5 Modify checkout page with stepper and redesign
    - Modify `apps/web/src/app/marketplace/checkout/page.tsx`
    - Add CheckoutStepper at top
    - Apply premium design tokens
    - Breadcrumb (Marketplace > Checkout)
    - Mobile: stack form and order summary vertically
    - Toast on success/error
    - robots: noindex
    - Celebration animation on confirmation step
    - _Requirements: 9.1, 9.2, 9.3, 14.3, 8.2, 13.8_

  - [x] 7.6 Create dynamic sitemap
    - Create `apps/web/src/app/marketplace/sitemap.ts`
    - Export Next.js sitemap function that fetches all active products and categories
    - Include: /marketplace, /marketplace/product/{slug}, /marketplace/category/{slug}
    - Exclude: cart, checkout pages
    - Set lastmod from updatedAt timestamps
    - _Requirements: 13.5_

- [x] 8. Checkpoint - Pages and integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Property-Based Tests
  - [ ]* 9.1 Write property test for search filter
    - **Property 1: Search filter returns only matching products**
    - Test `filterProducts` with arbitrary product arrays and query strings
    - Assert: all results contain query as case-insensitive substring; no non-matching products included
    - File: `apps/web/src/lib/marketplace/__tests__/filterProducts.property.test.ts`
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 9.2 Write property test for toast store
    - **Property 2: Toast store preserves all active toasts**
    - Test sequences of addToast/removeToast operations
    - Assert: store contains exactly added-and-not-removed toasts in insertion order
    - File: `apps/web/src/stores/__tests__/toastStore.property.test.ts`
    - **Validates: Requirements 8.4**

  - [ ]* 9.3 Write property test for stepper state derivation
    - **Property 3: Stepper state derivation is consistent**
    - Test with arbitrary valid checkout steps
    - Assert: steps before current are "completed", current is "active", after are "disabled"
    - File: `apps/web/src/components/marketplace/__tests__/CheckoutStepper.property.test.ts`
    - **Validates: Requirements 9.2**

  - [ ]* 9.4 Write property test for metadata title pattern
    - **Property 4: Metadata title follows naming pattern**
    - Test with arbitrary non-empty product/category names
    - Assert: title matches pattern "{Name} | Lonas SP - Toldos e Coberturas Sob Medida", description and og fields are non-empty
    - File: `apps/web/src/lib/marketplace/__tests__/metadata.property.test.ts`
    - **Validates: Requirements 13.1**

  - [ ]* 9.5 Write property test for JSON-LD Product schema
    - **Property 5: JSON-LD Product contains all required schema.org fields**
    - Test with arbitrary valid product data
    - Assert: output contains @type "Product", name, description, offers with priceCurrency "BRL", brand
    - File: `apps/web/src/lib/marketplace/__tests__/jsonld.property.test.ts`
    - **Validates: Requirements 13.2**

  - [ ]* 9.6 Write property test for JSON-LD BreadcrumbList
    - **Property 6: JSON-LD BreadcrumbList structure is valid**
    - Test with arbitrary navigation paths (2+ segments)
    - Assert: @type "BreadcrumbList", itemListElement with sequential positions starting at 1, each with name and item URL
    - File: `apps/web/src/lib/marketplace/__tests__/jsonld.property.test.ts`
    - **Validates: Requirements 7.4, 13.3**

  - [ ]* 9.7 Write property test for sitemap generation
    - **Property 7: Sitemap includes all public pages**
    - Test with arbitrary sets of products and categories
    - Assert: URL for each product/category present, /marketplace present, no cart/checkout URLs
    - File: `apps/web/src/lib/marketplace/__tests__/sitemap.property.test.ts`
    - **Validates: Requirements 13.5**

- [ ] 10. Unit Tests
  - [ ]* 10.1 Write unit tests for MarketplaceHeader
    - Test scroll behavior (blur/shadow toggle), mobile menu toggle, cart badge rendering
    - File: `apps/web/src/components/marketplace/__tests__/MarketplaceHeader.test.tsx`
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 10.2 Write unit tests for ProductCard
    - Test render with price, without price (quote), without image (SVG placeholder), hover state
    - File: `apps/web/src/components/marketplace/__tests__/ProductCard.test.tsx`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 10.3 Write unit tests for Toast and EmptyState
    - Test Toast: success/error variants, aria attributes, auto-dismiss
    - Test EmptyState: each variant renders correct icon, title, CTA
    - File: `apps/web/src/components/marketplace/__tests__/Toast.test.tsx`
    - File: `apps/web/src/components/marketplace/__tests__/EmptyState.test.tsx`
    - _Requirements: 8.1, 8.3, 10.1, 10.2, 10.3, 15.5_

  - [ ]* 10.4 Write unit tests for Breadcrumb and SearchBar
    - Test Breadcrumb: multiple items, last item non-clickable, aria-label
    - Test SearchBar: debounce fires after 300ms, clear button, category select
    - File: `apps/web/src/components/marketplace/__tests__/Breadcrumb.test.tsx`
    - File: `apps/web/src/components/marketplace/__tests__/SearchBar.test.tsx`
    - _Requirements: 2.4, 4.1, 4.2, 15.1_

- [ ] 11. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The marketplace uses scoped CSS custom properties (`.marketplace` wrapper) to avoid conflicting with the existing dark theme
- All pages that need SEO migrate to Server Components with `generateMetadata()`
- No new dependencies are introduced — uses existing vitest, fast-check, zustand, tailwind

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "7.6"] },
    { "id": 5, "tasks": ["7.4", "7.5"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
