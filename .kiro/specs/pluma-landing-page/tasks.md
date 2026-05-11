# Implementation Plan: Pluma Landing Page

## Overview

Implementação de uma landing page estática para o produto Pluma na rota `/pluma` do Next.js 14 App Router. A página é composta por seis seções sequenciais (Hero, Features, Chat, Security, CTA, Footer) com componentes isolados em `apps/web/src/components/pluma/`. O único componente com estado React é `ChatSection` (`'use client'`). Todos os ícones são SVG inline, todas as animações são CSS transitions via Tailwind, e nenhuma dependência nova é instalada.

---

## Tasks

- [x] 1. Criar estrutura de arquivos e componentes de ícone SVG
  - Criar o diretório `apps/web/src/components/pluma/icons/`
  - Implementar `LandmarkIcon.tsx` — SVG inline com `aria-hidden="true"` e prop `className`
  - Implementar `WalletIcon.tsx` — SVG inline com `aria-hidden="true"` e prop `className`
  - Implementar `MessageCircleIcon.tsx` — SVG inline com `aria-hidden="true"` e prop `className`
  - Implementar `CheckIcon.tsx` — SVG inline com `aria-hidden="true"` e prop `className`
  - Cada ícone exporta interface `IconProps { className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }`
  - _Requirements: 2.4, 4.3, 10.3_

- [x] 2. Implementar componentes de seção estáticos (Server Components)
  - [x] 2.1 Implementar `HeroSection.tsx`
    - Eyebrow "ASSISTENTE FINANCEIRO COM IA" em uppercase
    - H1 com fonte Anton via variável CSS `--font-anton`, `text-5xl md:text-7xl lg:text-8xl`
    - Subtítulo em Inter, máximo 160 caracteres
    - Botão CTA `href="/register"` com `bg-[#1C3F3A] text-white rounded`, `focus-visible:outline` com contraste ≥ 3:1
    - `Product_Mockup` como `<div aria-hidden="true">` com gradiente Tailwind — sem URLs externas
    - Layout `grid-cols-1 md:grid-cols-2`, fundo `bg-white`, `id="hero"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 2.2 Implementar `FeaturesSection.tsx`
    - Constante `FEATURES` com os 3 cards (textos exatos conforme Requirement 4.7)
    - H2 "Menos planilhas. Mais clareza." com `text-5xl md:text-6xl`
    - Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
    - Hover: `hover:-translate-y-1 transition-transform duration-200` em cada card
    - Ícones `<LandmarkIcon />`, `<WalletIcon />`, `<MessageCircleIcon />` com `aria-hidden="true"`
    - Fundo `bg-white`, `id="features"`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 2.3 Implementar `SecuritySection.tsx`
    - Constante `SECURITY_ITEMS` com os 4 cards (textos exatos conforme Requirement 6.6)
    - `<CheckIcon />` em cada card com `aria-hidden="true"`
    - Grid `grid-cols-1 md:grid-cols-2`
    - Cards com `border border-[rgba(28,63,58,0.16)]`, texto `text-[#050706]`
    - Fundo `bg-[#EBE8D8]`, `id="security"`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 2.4 Implementar `CTASection.tsx`
    - Constante `BENEFITS` com ≥ 3 itens, cada um iniciando com "✓"
    - H2 com `text-5xl md:text-6xl text-white`
    - Lista `<ul>` com `<li>` para cada benefício
    - Botão CTA `bg-[#2E8F86] hover:bg-[#1C3F3A] transition-colors duration-300 text-white rounded`, `focus-visible:outline` com contraste ≥ 3:1
    - Layout `max-w-[720px] mx-auto`, fundo `bg-[#1C3F3A]`, `id="cta"`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 2.5 Implementar `FooterSection.tsx`
    - Constante `NAV_SECTIONS` com 5 links de âncora (textos e hrefs exatos conforme design)
    - Constante `LEGAL_LINKS` com "Política de Privacidade" e "Termos de Uso"
    - Links legais com `target="_blank" rel="noopener noreferrer"`
    - Logo/nome "Pluma" com `text-xl` mínimo, cor `text-[#EBE8D8]`
    - `<nav>` com `<ul>/<li>` para navegação, `<footer>` como elemento raiz
    - Fundo `bg-[#050706]`, texto `text-[#EBE8D8]`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Implementar `ChatSection.tsx` (único `'use client'`)
  - Adicionar diretiva `'use client'` no topo do arquivo
  - Constante `PROMPT_PILLS` com as 5 sugestões exatas (conforme Requirement 5.3)
  - Estado `const [inputValue, setInputValue] = useState('')`
  - Handler `handlePillClick = (text: string) => setInputValue(text)`
  - Campo `<input>` com `value={inputValue}` e `onChange` controlado, placeholder entre 20–80 chars
  - Pills implementadas como `<button>` com `onClick={handlePillClick}`, `hover:bg-[#2E8F86] transition-colors duration-200`
  - Texto `text-[#EBE8D8]`, fundo `bg-[#1C3F3A]`, `id="chat"`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 4. Implementar `PlumaLayout.tsx` e `apps/web/src/app/pluma/page.tsx`
  - [x] 4.1 Implementar `PlumaLayout.tsx`
    - Server Component sem props externas
    - Compõe `HeroSection`, `FeaturesSection`, `ChatSection`, `SecuritySection`, `CTASection`, `FooterSection` em sequência
    - Usa elementos semânticos: `<main>` como wrapper raiz do layout (ou delegado ao page.tsx)
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.3_

  - [x] 4.2 Implementar `apps/web/src/app/pluma/page.tsx`
    - Importar `Anton` de `next/font/google` com `weight: '400'`, `subsets: ['latin']`, `display: 'swap'`, `variable: '--font-anton'`
    - Exportar `metadata` com `title: "Pluma — Assistente Financeiro com IA"` e `description` entre 50–160 chars em pt-BR
    - Exportar função `default` que retorna `<main className={anton.variable}>` com `<PlumaLayout />` como único filho
    - Importar somente de `apps/web/src/components/pluma/`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1_

- [x] 5. Checkpoint — Verificar build e isolamento
  - Garantir que `next build` compila sem erros de TypeScript
  - Verificar que nenhum arquivo em `components/pluma/` importa de `components/musician/`, `components/tattoo/` ou `components/shared/`
  - Verificar ausência de `innerHTML`, `dangerouslySetInnerHTML` e `framer-motion` em `components/pluma/`
  - Perguntar ao usuário se há dúvidas antes de prosseguir para os testes.
  - _Requirements: 2.2, 10.2, 10.3, 10.5, 10.6_

- [x] 6. Escrever testes de exemplo (Vitest)
  - [x] 6.1 Criar `__tests__/HeroSection.test.tsx`
    - Verificar eyebrow text, presença do H1, texto do botão CTA, atributo `href="/register"`, ausência de URLs externas no mockup
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 6.2 Criar `__tests__/FeaturesSection.test.tsx`
    - Verificar exatamente 3 cards, textos exatos de título e descrição, presença de classes `hover:-translate-y-1` e `transition-transform`
    - _Requirements: 4.2, 4.6, 4.7_

  - [x] 6.3 Criar `__tests__/ChatSection.test.tsx`
    - Verificar 5 pills com textos exatos, comprimento do placeholder (20–80 chars), comportamento de click (input preenchido com texto da pill)
    - _Requirements: 5.2, 5.3, 5.6_

  - [x] 6.4 Criar `__tests__/SecuritySection.test.tsx`
    - Verificar 4 cards, textos de segurança presentes, presença de `border` com cor correta
    - _Requirements: 6.2, 6.6_

  - [x] 6.5 Criar `__tests__/CTASection.test.tsx`
    - Verificar presença do H2, lista de benefícios (≥ 3 itens com "✓"), botão CTA com classes de hover/transition
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [x] 6.6 Criar `__tests__/FooterSection.test.tsx`
    - Verificar "Pluma" presente, 5 links de navegação com hrefs corretos, links legais com `target="_blank"` e `rel="noopener noreferrer"`
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 6.7 Criar `__tests__/PlumaPage.test.tsx`
    - Verificar `metadata.title` e `metadata.description` (comprimento 50–160), renderização do `<main>`, ausência de imports proibidos
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 7. Escrever testes de propriedade (Vitest + @fast-check/vitest)
  - [x] 7.1 Criar `__tests__/pluma.property.test.tsx` com configuração `fc.configureGlobal({ numRuns: 100 })`

  - [x]* 7.2 Escrever Property 1: Prompt Pill Click Fills Input
    - Para cada pill em `PROMPT_PILLS`, simular click e verificar que `inputValue === pill.text`
    - **Property 1: For any Prompt_Pill, clicking it SHALL set the input value to exactly that pill's text**
    - **Validates: Requirements 5.6**

  - [x]* 7.3 Escrever Property 2: Security Card Content Length Invariant
    - Para cada item em `SECURITY_ITEMS`, verificar `title.length ≤ 60` e `description.length ≤ 120`
    - **Property 2: For any security card, title ≤ 60 chars AND description ≤ 120 chars**
    - **Validates: Requirements 6.2**

  - [x]* 7.4 Escrever Property 3: CTA Benefit List Invariant
    - Verificar `BENEFITS.length ≥ 3` e que todo item começa com "✓"
    - **Property 3: Benefit list has ≥ 3 items and every item starts with "✓"**
    - **Validates: Requirements 7.3**

  - [x]* 7.5 Escrever Property 4: Footer Navigation Completeness
    - Para cada item em `NAV_SECTIONS`, verificar que existe `<a href={item.href}>` no DOM renderizado
    - **Property 4: Every nav section has a corresponding anchor link in the rendered footer**
    - **Validates: Requirements 8.3**

  - [x]* 7.6 Escrever Property 5: External Links Security Attributes
    - Para cada item em `LEGAL_LINKS`, verificar `target="_blank"` e `rel="noopener noreferrer"`
    - **Property 5: Every legal link has target=_blank and rel=noopener noreferrer**
    - **Validates: Requirements 8.4**

  - [x]* 7.7 Escrever Property 6: WCAG Color Contrast Compliance
    - Implementar `relativeLuminance(hex)` e `contrastRatio(hex1, hex2)` como funções puras
    - Verificar os 4 pares de cores: `#050706`/`#EBE8D8` ≥ 4.5:1, `#EBE8D8`/`#050706` ≥ 4.5:1, `#FFFFFF`/`#1C3F3A` ≥ 4.5:1, `#FFFFFF`/`#2E8F86` ≥ 3:1
    - **Property 6: All color pairs meet WCAG 2.1 AA contrast thresholds**
    - **Validates: Requirements 6.4, 7.6, 8.5**

  - [x]* 7.8 Escrever Property 7: Semantic HTML Structure
    - Renderizar `PlumaLayout` e verificar presença de `main`, `section`, `footer`, `h1`, `h2`, `nav`, `ul`, `li`
    - **Property 7: Rendered layout contains all required semantic elements**
    - **Validates: Requirements 9.3**

  - [x]* 7.9 Escrever Property 8: Interactive Element Keyboard Accessibility
    - Queries todos os `button` e `a` no DOM renderizado, verificar presença de classes `focus-visible:` em cada um
    - **Property 8: Every interactive element has focus-visible styles**
    - **Validates: Requirements 9.4, 3.8, 7.6**

  - [x]* 7.10 Escrever Property 9: Decorative Element Accessibility
    - Queries todos os `svg` no DOM renderizado, verificar `aria-hidden="true"` em cada SVG decorativo
    - **Property 9: Every decorative SVG has aria-hidden=true**
    - **Validates: Requirements 9.5**

  - [x]* 7.11 Escrever Property 10: Icon-Only Interactive Element Labeling
    - Queries elementos interativos sem texto visível, verificar `aria-label` não vazio
    - **Property 10: Every icon-only interactive element has a non-empty aria-label**
    - **Validates: Requirements 9.6**

- [x] 8. Checkpoint final — Garantir que todos os testes passam
  - Executar `vitest --run` em `apps/web/` e confirmar que todos os testes em `__tests__/` passam
  - Garantir que `next build` compila sem erros
  - Perguntar ao usuário se há ajustes antes de encerrar.

---

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- `ChatSection` é o único `'use client'` — todos os demais são Server Components puros
- A fonte Anton é carregada via `next/font/google` no `page.tsx` e passada como variável CSS ao `<main>`
- Cores Pluma são usadas como valores Tailwind arbitrários inline (`bg-[#1C3F3A]`) — não adicionadas ao `tailwind.config.ts`
- Testes de propriedade usam `@fast-check/vitest` (já instalado) com mínimo 100 iterações
- Para Properties 2–10, a "geração de inputs" é sobre os arrays de dados estáticos dos componentes — testes são determinísticos mas expressivos como invariantes universais

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11"] }
  ]
}
```
