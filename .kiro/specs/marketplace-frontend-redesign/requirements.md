# Documento de Requisitos — Redesign do Frontend do Marketplace

## Introdução

Este documento especifica os requisitos para o redesign visual e de experiência do usuário (UX) do frontend público do marketplace "Lonas SP". O objetivo é transformar a interface atual — que apresenta estilo genérico, inconsistências visuais e ausência de padrões modernos de UX — em uma experiência premium, responsiva, acessível e otimizada para SEO, mantendo a API backend existente inalterada. A referência visual é de sites premium como Keyly (imobiliário de luxo) e Motta (e-commerce sofisticado): tipografia elegante com serifa nos títulos, espaçamento generoso, paleta neutra com acento laranja, cards com hover sofisticado, seções de prova social com métricas e depoimentos, e layout limpo com hierarquia visual clara.

## Glossário

- **Sistema_Marketplace**: O frontend público do marketplace construído com Next.js 14 (App Router), Tailwind CSS e Zustand
- **Design_System**: Conjunto de tokens de design (cores, tipografia, espaçamentos, sombras) e componentes reutilizáveis que garantem consistência visual
- **Skeleton_Loader**: Componente de placeholder animado que simula o layout do conteúdo durante o carregamento de dados
- **Toast**: Notificação temporária exibida ao usuário para confirmar ações ou reportar erros
- **Breadcrumb**: Componente de navegação hierárquica que mostra o caminho do usuário dentro do site
- **Stepper**: Indicador visual de progresso em fluxos multi-etapa (ex: checkout)
- **Empty_State**: Componente visual exibido quando uma lista ou seção não possui dados
- **Micro_Interação**: Animação sutil aplicada a elementos da interface para fornecer feedback visual ao usuário
- **Mobile_First**: Abordagem de design onde o layout é projetado primeiro para telas pequenas e progressivamente adaptado para telas maiores
- **Token_Semântico**: Variável de design nomeada por função (ex: `bg-surface`) em vez de valor literal (ex: `bg-gray-100`)
- **SEO_Técnico**: Conjunto de otimizações técnicas (metadata, structured data, semântica HTML, performance) que melhoram o posicionamento em motores de busca
- **Structured_Data**: Marcação JSON-LD seguindo schema.org para comunicar informações estruturadas aos motores de busca
- **Social_Proof**: Seção de prova social com métricas numéricas e depoimentos de clientes que transmitem credibilidade

## Requisitos

### Requisito 1: Design System Premium

**User Story:** Como usuário do marketplace, eu quero uma interface visualmente sofisticada e consistente em todas as páginas, para que a experiência transmita profissionalismo e confiança na marca.

#### Critérios de Aceitação

1. THE Design_System SHALL definir tokens semânticos para cores (paleta neutra: branco, cinza claro, cinza escuro/charcoal, preto + acento laranja #E85D2C), tipografia, espaçamentos generosos, bordas e sombras utilizados em todas as páginas do marketplace
2. THE Sistema_Marketplace SHALL utilizar exclusivamente tokens semânticos do Design_System em todas as classes de estilo, eliminando o uso de classes Tailwind literais (como `text-gray-900`, `bg-gray-100`)
3. THE Design_System SHALL incluir variantes de cor para os estados: default, hover, active, disabled e focus em todos os elementos interativos
4. THE Design_System SHALL definir uma escala tipográfica com: fonte serifada (ex: Playfair Display ou similar via Google Fonts) para headings (h1, h2, h3) e fonte sans-serif (Inter ou sistema) para body, caption e label
5. THE Design_System SHALL definir espaçamentos generosos entre seções (mínimo 80px em desktop, 48px em mobile) para criar respiro visual e hierarquia clara
6. THE Design_System SHALL definir estilos de botão em duas variantes: primário (fundo laranja acento, texto branco, border-radius arredondado) e secundário (borda escura, fundo transparente, texto escuro)

### Requisito 2: Header e Navegação Profissional

**User Story:** Como visitante do marketplace, eu quero um header com navegação clara e funcional, para que eu possa encontrar facilmente o que procuro.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir um header fixo no topo com logo, links de navegação principal, ícone do carrinho com badge de quantidade e botão de login/conta
2. WHEN o usuário rolar a página para baixo, THE Sistema_Marketplace SHALL aplicar um efeito de backdrop-blur e sombra sutil ao header para diferenciá-lo do conteúdo
3. WHEN a largura da tela for inferior a 768px, THE Sistema_Marketplace SHALL substituir a navegação horizontal por um menu hambúrguer com painel lateral deslizante
4. THE Sistema_Marketplace SHALL exibir um componente Breadcrumb em todas as páginas internas (categoria, produto, carrinho, checkout) indicando o caminho hierárquico de navegação
5. WHEN o usuário clicar no ícone do carrinho no header, THE Sistema_Marketplace SHALL navegar para a página do carrinho exibindo o número de itens como badge

### Requisito 3: Hero Section Premium

**User Story:** Como visitante do marketplace, eu quero uma seção hero impactante e premium, para que eu tenha uma primeira impressão de marca sofisticada e confiável.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir uma hero section com fundo claro/neutro (sem imagem externa do Unsplash), título em fonte serifada grande e elegante, subtítulo descritivo em fonte sans-serif e dois botões de CTA (primário: "Ver Catálogo", secundário: "Solicitar Orçamento")
2. THE Sistema_Marketplace SHALL exibir na hero section um indicador de prova social (ex: "120+ clientes atendidos") com avatares estilizados em SVG
3. WHEN a hero section for renderizada, THE Sistema_Marketplace SHALL aplicar animação de entrada (fade-in com translate-y) aos elementos de texto e botões com delay escalonado de 100ms entre elementos
4. WHILE a largura da tela for inferior a 640px, THE Sistema_Marketplace SHALL empilhar os botões de CTA verticalmente, reduzir o tamanho do título e ocultar o indicador de prova social com avatares
5. THE Sistema_Marketplace SHALL incluir na hero section uma barra de busca/filtro rápido integrada visualmente (similar ao padrão de busca com dropdowns da referência Keyly) que permite filtrar por categoria e redireciona para a seção de catálogo

### Requisito 4: Busca e Filtragem de Produtos

**User Story:** Como visitante do marketplace, eu quero buscar e filtrar produtos, para que eu encontre rapidamente o que preciso.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir um campo de busca na seção de catálogo que filtra produtos pelo título em tempo real (debounce de 300ms)
2. WHEN o usuário digitar no campo de busca, THE Sistema_Marketplace SHALL filtrar a lista de produtos exibidos mostrando apenas aqueles cujo título contenha o termo digitado (case-insensitive)
3. WHEN o campo de busca estiver vazio e nenhuma categoria estiver selecionada, THE Sistema_Marketplace SHALL exibir todos os produtos disponíveis
4. WHEN a busca não retornar resultados, THE Sistema_Marketplace SHALL exibir um Empty_State com ícone ilustrativo SVG e mensagem informativa

### Requisito 5: Cards de Produto Premium

**User Story:** Como visitante do marketplace, eu quero cards de produto visualmente sofisticados e interativos, para que eu tenha uma experiência de navegação premium.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir cada produto em um card com: imagem (ou placeholder SVG estilizado com gradiente), badge de categoria posicionado sobre a imagem (canto superior direito), título em fonte serifada, preço formatado e indicador de tipo (preço fixo ou "Sob consulta" em laranja)
2. WHEN o usuário posicionar o cursor sobre um card de produto, THE Sistema_Marketplace SHALL aplicar elevação (sombra suave), leve escala (scale 1.02) e exibir um botão "Ver Detalhes" com overlay sutil sobre a imagem, com transição de 200ms
3. WHEN um produto não possuir imagem, THE Sistema_Marketplace SHALL exibir um placeholder com ícone SVG estilizado (ícone de lona/cobertura) e fundo com gradiente sutil em vez de emoji ou texto simples
4. THE Sistema_Marketplace SHALL exibir os cards em grid responsivo: 1 coluna em telas menores que 640px, 2 colunas entre 640px e 1024px, 3 colunas acima de 1024px
5. THE Sistema_Marketplace SHALL exibir em cada card informações de especificação resumidas (ex: dimensões, material) com ícones pequenos, similar ao padrão de metragem/quartos da referência Keyly

### Requisito 6: Loading States com Skeleton

**User Story:** Como visitante do marketplace, eu quero feedback visual durante o carregamento de dados, para que eu saiba que o sistema está funcionando.

#### Critérios de Aceitação

1. WHILE dados estiverem sendo carregados, THE Sistema_Marketplace SHALL exibir componentes Skeleton_Loader que simulam o layout final do conteúdo (cards, textos, imagens) com animação de pulse
2. THE Sistema_Marketplace SHALL exibir skeletons com dimensões proporcionais ao conteúdo real que será renderizado
3. WHEN o carregamento for concluído, THE Sistema_Marketplace SHALL substituir os skeletons pelo conteúdo real com transição suave de opacidade

### Requisito 7: Página de Produto com Galeria Aprimorada

**User Story:** Como visitante do marketplace, eu quero uma página de produto rica e informativa, para que eu possa avaliar o produto antes de solicitar orçamento ou comprar.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir a galeria de imagens do produto com transição animada entre imagens ao clicar nas thumbnails
2. WHEN o produto não possuir imagens, THE Sistema_Marketplace SHALL exibir um placeholder visual estilizado com ícone SVG e fundo gradiente
3. THE Sistema_Marketplace SHALL exibir as especificações do produto em um layout de grid com ícones visuais para cada atributo (largura, altura, material, cor)
4. THE Sistema_Marketplace SHALL exibir o Breadcrumb com o caminho: Marketplace > Categoria > Nome do Produto

### Requisito 8: Sistema de Notificações (Toast)

**User Story:** Como usuário do marketplace, eu quero receber feedback visual imediato sobre minhas ações, para que eu saiba se a operação foi bem-sucedida ou falhou.

#### Critérios de Aceitação

1. WHEN o usuário adicionar um produto ao carrinho, THE Sistema_Marketplace SHALL exibir um Toast de sucesso com o nome do produto e duração de 3 segundos
2. WHEN uma operação falhar (envio de orçamento, criação de pedido), THE Sistema_Marketplace SHALL exibir um Toast de erro com mensagem descritiva e duração de 5 segundos
3. THE Sistema_Marketplace SHALL posicionar os Toasts no canto superior direito da tela com animação de entrada (slide-in da direita) e saída (fade-out)
4. WHEN múltiplos Toasts forem disparados, THE Sistema_Marketplace SHALL empilhá-los verticalmente com espaçamento de 8px entre eles

### Requisito 9: Checkout com Indicador de Progresso

**User Story:** Como comprador, eu quero visualizar em qual etapa do checkout estou, para que eu saiba quanto falta para concluir meu pedido.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir um componente Stepper no topo da página de checkout com as etapas: Carrinho, Dados, Confirmação
2. THE Sistema_Marketplace SHALL destacar visualmente a etapa atual, marcar etapas concluídas com ícone de check e exibir etapas futuras em estado desabilitado
3. WHEN o pedido for concluído com sucesso, THE Sistema_Marketplace SHALL exibir a etapa "Confirmação" como ativa com animação de celebração sutil (ícone animado)

### Requisito 10: Empty States Visuais

**User Story:** Como visitante do marketplace, eu quero ver estados vazios informativos e visualmente agradáveis, para que eu saiba o que fazer quando não há conteúdo.

#### Critérios de Aceitação

1. WHEN o carrinho estiver vazio, THE Sistema_Marketplace SHALL exibir um Empty_State com ícone SVG ilustrativo de carrinho, mensagem amigável e botão de call-to-action para o catálogo
2. WHEN uma categoria não possuir produtos, THE Sistema_Marketplace SHALL exibir um Empty_State com ícone SVG contextual e sugestão de explorar outras categorias
3. THE Sistema_Marketplace SHALL estilizar todos os Empty_States com ícone centralizado (mínimo 64x64px), título em heading-3 e texto descritivo em body com cor muted

### Requisito 11: Animações e Micro-Interações

**User Story:** Como visitante do marketplace, eu quero uma interface com animações sutis e responsivas, para que a experiência pareça fluida e moderna.

#### Critérios de Aceitação

1. WHEN elementos da página entrarem no viewport durante scroll, THE Sistema_Marketplace SHALL aplicar animação de fade-in com translate-y utilizando CSS animations
2. THE Sistema_Marketplace SHALL aplicar transições de 150ms a 300ms em todos os estados interativos (hover, focus, active) de botões, links e cards
3. WHEN um modal for aberto (QuoteModal), THE Sistema_Marketplace SHALL aplicar animação de entrada com scale e fade no conteúdo e fade no overlay de fundo
4. THE Sistema_Marketplace SHALL respeitar a preferência `prefers-reduced-motion` do sistema operacional, desabilitando animações quando o usuário preferir movimento reduzido

### Requisito 12: Seção de Prova Social e Credibilidade

**User Story:** Como visitante do marketplace, eu quero ver indicadores de credibilidade e depoimentos, para que eu confie na qualidade dos produtos e serviços oferecidos.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL exibir na página inicial uma seção "Sobre Nós" com texto descritivo da empresa, métricas numéricas em destaque (ex: "300+ projetos entregues", "500+ clientes atendidos", "10+ anos de experiência") e layout de 2 colunas (texto + métricas)
2. THE Sistema_Marketplace SHALL exibir as métricas numéricas em cards com fundo escuro (charcoal/preto) e tipografia grande em fonte serifada, criando contraste visual com o restante da página
3. THE Sistema_Marketplace SHALL exibir uma seção de depoimentos com card contendo: avaliação em estrelas (SVG), texto do depoimento entre aspas, nome do cliente e cargo/empresa
4. WHEN a seção de métricas entrar no viewport, THE Sistema_Marketplace SHALL animar os números com contagem progressiva (count-up) de 0 até o valor final em 1.5 segundos
5. THE Sistema_Marketplace SHALL exibir na página inicial uma seção "Nossos Projetos" com grid de imagens de projetos realizados (usando placeholders SVG estilizados) com título e botão "Ver Todos"

### Requisito 13: SEO Técnico e Metadata

**User Story:** Como dono do marketplace, eu quero que o site seja otimizado para motores de busca, para que clientes encontrem meus produtos organicamente no Google.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL gerar metadata dinâmica (title, description, og:title, og:description, og:image) para cada página usando a API de Metadata do Next.js, com títulos seguindo o padrão "[Página] | Lonas SP - Toldos e Coberturas Sob Medida"
2. THE Sistema_Marketplace SHALL incluir Structured_Data (JSON-LD) do tipo `Product` em cada página de produto contendo: name, description, image, offers (price, priceCurrency, availability) e brand
3. THE Sistema_Marketplace SHALL incluir Structured_Data (JSON-LD) do tipo `BreadcrumbList` em todas as páginas internas refletindo a hierarquia de navegação
4. THE Sistema_Marketplace SHALL incluir Structured_Data (JSON-LD) do tipo `LocalBusiness` na página inicial com informações da empresa (name, address, telephone, openingHours)
5. THE Sistema_Marketplace SHALL gerar um sitemap.xml dinâmico via Next.js que inclua todas as páginas públicas (home, categorias, produtos ativos) com lastmod baseado na data de atualização
6. THE Sistema_Marketplace SHALL utilizar tags semânticas HTML5 (article, section, nav, header, main, footer) e headings hierárquicos (h1 único por página, h2-h6 em ordem) em todas as páginas
7. THE Sistema_Marketplace SHALL otimizar imagens com atributo `alt` descritivo, atributo `loading="lazy"` para imagens abaixo do fold, e dimensões explícitas (width/height) para evitar layout shift
8. THE Sistema_Marketplace SHALL incluir meta tag `robots` com valor `index, follow` em páginas públicas e `noindex` em páginas de carrinho e checkout
9. THE Sistema_Marketplace SHALL gerar URLs canônicas (`<link rel="canonical">`) em todas as páginas para evitar conteúdo duplicado

### Requisito 14: Design Responsivo Mobile-First

**User Story:** Como usuário mobile, eu quero acessar o marketplace com uma experiência otimizada para meu dispositivo, para que eu possa navegar e comprar confortavelmente.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL implementar todos os layouts seguindo a abordagem Mobile_First, definindo estilos base para mobile e usando breakpoints progressivos (sm: 640px, md: 768px, lg: 1024px)
2. WHILE a largura da tela for inferior a 768px, THE Sistema_Marketplace SHALL exibir a galeria de produto em largura total com thumbnails em scroll horizontal
3. WHILE a largura da tela for inferior a 768px, THE Sistema_Marketplace SHALL empilhar o formulário de checkout e o resumo do pedido verticalmente
4. THE Sistema_Marketplace SHALL garantir que todos os alvos de toque (botões, links) tenham dimensão mínima de 44x44px em dispositivos móveis

### Requisito 15: Acessibilidade

**User Story:** Como usuário com necessidades de acessibilidade, eu quero que o marketplace seja navegável e compreensível, para que eu possa utilizá-lo independentemente de minhas limitações.

#### Critérios de Aceitação

1. THE Sistema_Marketplace SHALL incluir atributos `aria-label` descritivos em todos os elementos interativos que não possuam texto visível (ícones, botões de fechar, controles de quantidade)
2. THE Sistema_Marketplace SHALL garantir contraste mínimo de 4.5:1 entre texto e fundo em todos os elementos textuais conforme WCAG 2.1 AA
3. THE Sistema_Marketplace SHALL tornar todos os modais acessíveis via teclado com trap de foco, fechamento por Escape e retorno do foco ao elemento que abriu o modal
4. THE Sistema_Marketplace SHALL utilizar landmarks semânticos (`nav`, `main`, `header`, `footer`, `section`) e headings hierárquicos (h1-h6) em ordem correta em todas as páginas
5. WHEN um Toast for exibido, THE Sistema_Marketplace SHALL anunciá-lo para leitores de tela utilizando `role="alert"` e `aria-live="polite"`
