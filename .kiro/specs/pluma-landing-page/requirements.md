# Requirements Document

## Introduction

A página Pluma é uma landing page estática para o produto **Pluma** — um assistente financeiro com IA voltado ao mercado brasileiro. A página é uma rota independente em `/pluma`, completamente isolada do sistema de perfis de artistas do Hub. Ela apresenta o produto em seis seções sequenciais (Hero, Por que Pluma, Pluma Answers, Segurança, CTA Final e Footer), seguindo a direção visual editorial do projeto Hub (tipografia oversized, alto contraste, grid brutalist) adaptada para uma identidade fintech premium com paleta verde-escuro/teal/creme.

---

## Glossary

- **Pluma_Page**: O componente de página estática em `apps/web/src/app/pluma/page.tsx`
- **Pluma_Layout**: O componente raiz que compõe todas as seções da página em `apps/web/src/components/pluma/PlumaLayout.tsx`
- **Hero_Section**: Seção de abertura com proposta de valor e CTA principal
- **Features_Section**: Seção "Por que Pluma" com três cards de benefícios
- **Chat_Section**: Seção "Pluma Answers" com UI de chat e sugestões de prompt
- **Security_Section**: Seção de segurança com quatro cards de garantias
- **CTA_Section**: Seção de conversão final com lista de benefícios e botão
- **Footer_Section**: Rodapé com logo, navegação e links legais
- **Prompt_Pill**: Elemento interativo de sugestão de pergunta na Chat_Section
- **Product_Mockup**: Placeholder visual estilizado representando a interface do produto
- **SVG_Icon**: Ícone implementado como SVG inline sem dependência de biblioteca externa

---

## Requirements

### Requirement 1: Rota Estática da Página Pluma

**User Story:** Como visitante, quero acessar a URL `/pluma` e ver a landing page do produto, para que eu possa conhecer o Pluma e decidir se quero experimentá-lo.

#### Acceptance Criteria

1. THE Pluma_Page SHALL ser renderizada na rota estática `/pluma` sem realizar nenhuma chamada a APIs externas, banco de dados ou sistema de arquivos durante a renderização.
2. THE Pluma_Page SHALL exportar uma função `default` que retorna JSX válido e é colocada em `apps/web/src/app/pluma/page.tsx`, satisfazendo a convenção de arquivo de página do App Router do Next.js 14.
3. THE Pluma_Page SHALL exportar um objeto `metadata` (ou função `generateMetadata`) com `title` igual a "Pluma — Assistente Financeiro com IA" e `description` com entre 50 e 160 caracteres em português brasileiro.
4. THE Pluma_Page SHALL renderizar o Pluma_Layout como único filho do elemento `<main>`.
5. THE Pluma_Page SHALL ser completamente independente do sistema de roteamento dinâmico `[slug]/page.tsx` e não importar nenhum componente de `components/musician/`, `components/tattoo/` ou `components/shared/`.

---

### Requirement 2: Isolamento de Componentes

**User Story:** Como desenvolvedor, quero que todos os componentes da página Pluma estejam isolados em seu próprio diretório, para que alterações futuras não afetem os perfis de artistas existentes.

#### Acceptance Criteria

1. TODOS os componentes React da feature Pluma SHALL residir exclusivamente em `apps/web/src/components/pluma/`, incluindo PlumaLayout e todos os componentes de seção.
2. Nenhum componente em `apps/web/src/components/pluma/` SHALL importar de `apps/web/src/components/musician/`, `apps/web/src/components/tattoo/` ou `apps/web/src/components/shared/`.
3. THE Pluma_Layout SHALL não alterar nenhum arquivo existente fora do diretório `apps/web/src/components/pluma/` e do arquivo `apps/web/src/app/pluma/page.tsx`.
4. IF um componente Pluma precisar de um ícone, THEN THE SVG_Icon SHALL ser implementado como SVG inline dentro do próprio componente, sem instalar nenhum pacote de ícones que não esteja presente no `package.json` antes desta tarefa.
5. THE Pluma_Page (`apps/web/src/app/pluma/page.tsx`) SHALL importar componentes exclusivamente de `apps/web/src/components/pluma/`.

---

### Requirement 3: Seção Hero

**User Story:** Como visitante, quero ver uma seção de abertura impactante com a proposta de valor do Pluma, para que eu entenda imediatamente o que o produto faz e seja incentivado a experimentá-lo.

#### Acceptance Criteria

1. THE Hero_Section SHALL exibir um eyebrow com o texto "ASSISTENTE FINANCEIRO COM IA" em uppercase.
2. THE Hero_Section SHALL exibir um H1 com fonte Anton ou Bebas Neue, com tamanho mínimo de 48px em mobile e mínimo de 72px em telas `md` ou maiores.
3. THE Hero_Section SHALL exibir um subtítulo com no máximo 160 caracteres em Inter ou DM Sans, weight 400.
4. THE Hero_Section SHALL exibir um botão CTA com o texto "Teste grátis por 14 dias", fundo verde-escuro (`#1C3F3A`), texto branco e border-radius 4px; ao ser clicado, o botão SHALL iniciar o fluxo de cadastro ou redirecionar para a página de registro.
5. THE Hero_Section SHALL exibir um Product_Mockup na segunda coluna implementado como `<div>` estilizado com gradiente Tailwind ou SVG inline, sem referenciar URLs de imagens externas.
6. THE Hero_Section SHALL usar layout de duas colunas em telas `md` ou maiores e layout de coluna única em telas menores.
7. THE Hero_Section SHALL ter fundo branco (`#FFFFFF`).
8. WHEN o usuário foca o botão CTA via teclado, THE Hero_Section SHALL exibir um outline de foco com largura mínima de 2px e razão de contraste mínima de 3:1 entre o outline e o fundo adjacente.

---

### Requirement 4: Seção Por que Pluma

**User Story:** Como visitante, quero ver os principais benefícios do Pluma apresentados de forma clara, para que eu entenda o valor do produto antes de decidir experimentá-lo.

#### Acceptance Criteria

1. THE Features_Section SHALL exibir o H2 "Menos planilhas. Mais clareza." com tamanho mínimo de 48px.
2. THE Features_Section SHALL exibir exatamente três cards de benefícios, cada um contendo um SVG_Icon inline, seu título definido e sua descrição definida.
3. THE Features_Section SHALL usar os ícones Landmark (banco/finanças), Wallet (carteira) e MessageCircle (conversa com IA) implementados como SVG inline.
4. THE Features_Section SHALL usar layout de três colunas em telas `lg` ou maiores, duas colunas em telas `md` e coluna única em telas `sm` ou menores, garantindo que o layout de três colunas nunca seja exibido em telas menores que `lg`.
5. THE Features_Section SHALL ter fundo branco (`#FFFFFF`).
6. WHEN o usuário passa o cursor sobre um card, THE Features_Section SHALL elevar o card 4px via CSS `transform: translateY(-4px)` com `transition` de 200ms, sem usar Framer Motion.
7. THE Features_Section SHALL exibir os seguintes cards com exatamente estes textos:
   - Card 1 — Título: "Conecta automaticamente" / Descrição: "Conecta automaticamente todas suas contas via Open Finance do Banco Central."
   - Card 2 — Título: "Experiência personalizada" / Descrição: "Responde suas dúvidas em linguagem humana e sugere ações para sua situação real."
   - Card 3 — Título: "Atualiza sozinho" / Descrição: "Não precisa fazer input manual. Você só conversa e toma decisões."

---

### Requirement 5: Seção Pluma Answers

**User Story:** Como visitante, quero ver exemplos de perguntas que posso fazer ao Pluma, para que eu entenda como o assistente funciona na prática.

#### Acceptance Criteria

1. THE Chat_Section SHALL ter fundo verde-escuro (`#1C3F3A`).
2. THE Chat_Section SHALL exibir um card de UI de chat com um campo de input com placeholder entre 20 e 80 caracteres em português brasileiro descrevendo a ação de perguntar sobre finanças.
3. THE Chat_Section SHALL exibir exatamente cinco Prompt_Pills com as seguintes sugestões em português brasileiro:
   - "Quanto posso gastar neste fim de semana?"
   - "Por que minha conta está sempre no vermelho?"
   - "Consigo trocar de carro este ano?"
   - "Onde estou gastando demais?"
   - "Quanto preciso guardar para a reserva de emergência?"
4. WHEN o usuário passa o cursor sobre um Prompt_Pill, THE Chat_Section SHALL aplicar uma transição de cor de fundo com duração entre 150ms e 300ms via CSS transition, sem usar Framer Motion.
5. THE Chat_Section SHALL usar texto na cor creme (`#EBE8D8`) ou branco sobre o fundo escuro.
6. WHEN o usuário clica em um Prompt_Pill, THE Chat_Section SHALL preencher o campo de input com o texto da pill clicada.

---

### Requirement 6: Seção Segurança

**User Story:** Como visitante, quero ver as garantias de segurança do Pluma, para que eu me sinta confiante em fornecer meus dados financeiros ao produto.

#### Acceptance Criteria

1. THE Security_Section SHALL ter fundo creme (`#EBE8D8`).
2. THE Security_Section SHALL exibir exatamente quatro cards de segurança, cada um contendo um SVG_Icon de check inline, um título com no máximo 60 caracteres e um texto descritivo com no máximo 120 caracteres.
3. THE Security_Section SHALL usar layout de duas colunas em telas `md` ou maiores e coluna única em telas menores.
4. THE Security_Section SHALL usar texto escuro (`#050706` ou `#1C3F3A`) com razão de contraste mínima de 4.5:1 em relação ao fundo creme, conforme WCAG 2.1 AA.
5. THE Security_Section SHALL usar cards flat com borda `rgba(28,63,58,0.16)`; sombras são permitidas desde que `box-shadow` use opacidade máxima de 0.12 e nenhum valor de blur superior a 16px.
6. THE Security_Section SHALL exibir os seguintes itens de segurança:
   - "Open Finance certificado pelo Banco Central"
   - "Mesma segurança que seu internet banking"
   - "Seus dados nunca saem do Brasil"
   - "Criptografia de ponta a ponta"

---

### Requirement 7: Seção CTA Final

**User Story:** Como visitante que chegou ao final da página, quero ver uma chamada para ação clara com os benefícios resumidos, para que eu seja convertido a experimentar o Pluma.

#### Acceptance Criteria

1. THE CTA_Section SHALL ter fundo verde-escuro (`#1C3F3A`).
2. THE CTA_Section SHALL exibir um H2 com tamanho mínimo de 48px com texto em branco ou creme.
3. THE CTA_Section SHALL exibir uma lista com no mínimo três itens de benefício, cada um precedido pelo marcador "✓".
4. THE CTA_Section SHALL exibir um botão CTA com fundo teal (`#2E8F86`), texto branco e border-radius 4px.
5. WHEN o usuário passa o cursor sobre o botão CTA, THE CTA_Section SHALL transicionar o fundo do botão para verde-escuro (`#1C3F3A`) em no máximo 300ms via CSS transition.
6. WHEN o usuário foca o botão CTA via teclado, THE CTA_Section SHALL exibir um outline com razão de contraste mínima de 3:1 entre o outline e o fundo adjacente, conforme WCAG 2.1 AA.
7. THE CTA_Section SHALL usar layout de coluna única com largura máxima de 720px centralizado horizontalmente.
8. WHEN o usuário clica no botão CTA, THE CTA_Section SHALL iniciar o fluxo de cadastro ou redirecionar para a página de registro.

---

### Requirement 8: Footer

**User Story:** Como visitante, quero ver um rodapé com informações de navegação e links legais, para que eu possa acessar políticas de privacidade e termos de uso.

#### Acceptance Criteria

1. THE Footer_Section SHALL ter fundo preto (`#050706`).
2. THE Footer_Section SHALL exibir o logotipo ou o nome "Pluma" em texto com tamanho mínimo de 20px, em branco ou creme.
3. THE Footer_Section SHALL exibir links de navegação interna para as seções: Hero, Por que Pluma, Pluma Answers, Segurança e CTA.
4. THE Footer_Section SHALL exibir links para "Política de Privacidade" e "Termos de Uso", ambos abrindo em nova aba (`target="_blank"` com `rel="noopener noreferrer"`).
5. THE Footer_Section SHALL usar texto com razão de contraste mínima de 4.5:1 para texto de tamanho normal e 3:1 para texto grande (≥ 18px regular ou ≥ 14px bold) em relação ao fundo escuro, conforme WCAG 2.1 AA.

---

### Requirement 9: Responsividade e Acessibilidade

**User Story:** Como visitante em qualquer dispositivo, quero que a página seja legível e utilizável, para que eu tenha uma boa experiência independentemente do tamanho da tela ou da forma como navego.

#### Acceptance Criteria

1. THE Pluma_Layout SHALL usar abordagem mobile-first, com breakpoints Tailwind `sm` (640px), `md` (768px) e `lg` (1024px) para escalar o layout.
2. THE Pluma_Layout SHALL escalar a tipografia dos headings de forma responsiva, com tamanho mínimo de 36px em mobile, 56px em `md` e 80px em `lg` ou maiores.
3. THE Pluma_Layout SHALL usar elementos HTML semânticos: `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`, `<h1>`, `<h2>`, `<p>`, `<ul>`, `<li>`, `<button>` ou `<a>` conforme apropriado.
4. THE Pluma_Layout SHALL garantir que todos os elementos interativos (botões, links, pills) sejam acessíveis via teclado com foco visível e razão de contraste de foco mínima de 3:1.
5. THE Pluma_Layout SHALL garantir que todos os elementos `<img>` ou SVG decorativos tenham `alt=""` ou `aria-hidden="true"` conforme apropriado.
6. IF um elemento interativo não tiver texto visível, THEN THE Pluma_Layout SHALL fornecer um atributo `aria-label` descritivo.

---

### Requirement 10: Restrições de Implementação Técnica

**User Story:** Como desenvolvedor, quero que a implementação respeite as restrições técnicas do projeto, para que não sejam introduzidas dependências desnecessárias ou quebras no build existente.

#### Acceptance Criteria

1. THE Pluma_Layout SHALL usar exclusivamente dependências já instaladas: Next.js 14, Tailwind CSS 3 e TypeScript.
2. THE Pluma_Layout SHALL implementar todas as animações via CSS transitions e transforms do Tailwind, sem instalar ou usar Framer Motion.
3. THE Pluma_Layout SHALL implementar todos os ícones como SVG inline ou componentes SVG locais, sem instalar `lucide-react` ou qualquer outra biblioteca de ícones.
4. THE Pluma_Layout SHALL implementar todos os placeholders visuais como `<div>` estilizados com gradiente Tailwind ou SVG inline; URLs de imagens externas são proibidas, exceto Unsplash com parâmetros fixos (`?w=600&q=80`) quando usadas exclusivamente para imagens de demonstração de portfólio.
5. THE Pluma_Layout SHALL não usar `innerHTML` em nenhum componente, nem tratar nenhum campo de dados como código executável.
6. WHEN o projeto for compilado com `next build`, THE Pluma_Layout e THE Pluma_Page SHALL compilar sem erros de TypeScript ou de build.
