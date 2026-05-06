---
inclusion: always
---

# Regras Obrigatórias do Projeto

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção.

## Estrutura e Dados

- **Manter a estrutura de dados já criada.** Não alterar interfaces existentes em `packages/types` sem necessidade explícita. Novos campos devem ser opcionais (`?`) para não quebrar perfis existentes.
- **Não criar novas entidades desnecessárias.** Antes de criar um novo tipo, interface ou tabela, verificar se já existe algo equivalente no projeto.
- **Não refatorar o projeto inteiro.** Mudanças devem ser cirúrgicas e limitadas ao escopo solicitado. Não aproveitar uma tarefa pequena para reorganizar arquivos não relacionados.

## Imagens e Assets

- **Não inventar imagens.** Nunca usar URLs de imagens que possam não existir ou expirar (CDN do Instagram, URLs geradas, etc.).
- **Usar placeholders temporários para imagens.** Quando não há imagem real disponível, usar um `<div>` estilizado ou SVG inline como placeholder. Para imagens de portfólio de demonstração, usar Unsplash com parâmetros fixos (`?w=600&q=80`).

## Separação de Perfis

- **Não usar o vinil ou elementos musicais na página do tatuador.** Componentes como `VinylSVG`, `Player`, `Musicas`, waveform canvas e qualquer elemento temático musical são exclusivos do perfil `musician`. O perfil `tattoo` tem seus próprios componentes em `components/tattoo/`.
- **Permitir que as duas páginas rodem simultaneamente.** Alterações em componentes compartilhados (`Navbar`, `Footer`, `Servicos`, `Depoimentos`, `Contato`) devem funcionar corretamente para ambos os perfis (`musician` e `tattoo`). Testar mentalmente os dois fluxos antes de commitar.

## Segurança de Código

- **Não usar `innerHTML`.** Nunca. Usar `textContent`, JSX ou componentes React com escape automático.
- **Não adicionar JavaScript customizado vindo de dados.** Nenhum campo do JSON ou banco de dados deve ser executado como código. Dados são sempre tratados como strings/valores, nunca como scripts.

## Escopo de Geração

- **Gerar somente os arquivos necessários.** Não criar arquivos extras "por precaução". Se a tarefa exige alterar 2 arquivos, alterar exatamente esses 2 arquivos.
