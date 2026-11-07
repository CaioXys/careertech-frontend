# CareerTech Design System

Use este guia ao criar ou ajustar telas, componentes e estilos da SPA. Os valores oficiais estão centralizados em `src/styles/tokens.css` e devem ser consumidos com `var(--token)`, sem copiar valores hexadecimais ou medidas para CSS de tela.

## Fonte visual

- Referência local: `CareerTech-Design-System/careertech-design-system`.
- Especificação: [Design System Mapa Carreira no Figma](https://www.figma.com/design/JkHzDGS4XxJDaKMD7uWNmL/Design-System-Mapa-Carreira?node-id=0-1).
- O protótipo local contém demonstrações e regras de estados; `tweaks.css` contém ajustes exclusivos da página de demonstração e não deve ser copiado para o produto.

## Tokens

- **Ação:** use `--action` para a ação principal, `--action-hover` e `--action-pressed` para interação, `--action-soft` para realces sutis e `--focus` para foco visível.
- **Superfícies e texto:** use `--page`, `--surface`, `--surface-2`, `--surface-3`, `--ink`, `--text-2`, `--muted` e `--line` conforme a função visual.
- **Estados:** `--progress` / `--progress-text` / `--progress-soft` comunicam progresso; `--xp` / `--xp-text` / `--xp-soft` comunicam XP e conquistas; `--error` / `--error-text` / `--error-soft` comunicam erro. Combine a cor com texto ou ícone; não dependa só da cor. Teal e âmbar não devem receber texto branco.
- **Tipografia:** use Inter, pesos 400, 500 e 600, a escala `--font-size-12` a `--font-size-40` e os line-heights `--line-height-body` e `--line-height-heading`.
- **Espaçamento:** use `--spacing-1` a `--spacing-8`. A escala segue incrementos de 8 px, com 4 px para ajustes compactos. Use 8–16 px dentro de controles, 24–32 px entre grupos e 48–64 px entre seções.
- **Forma e foco:** cards e botões usam `--radius-card` (12 px); campos usam `--radius-control` (8 px); selos e avatares podem usar `--radius-pill`. Controles e botões têm 44 px de altura. O foco usa o anel de 2 px com 2 px de afastamento.
- **Elevação:** não aplique sombra a cada card. Reserve `--shadow-overlay` para sobreposições e elementos que precisam se destacar.
- **Tema escuro:** os tokens se adaptam quando `data-theme="dark"` está no elemento `html`.

## Botões e controles

- Ofereça uma ação primária por contexto. Use ação secundária para alternativa e estilo fantasma para baixa prioridade.
- Reserve o estilo de perigo para ações destrutivas; peça confirmação e forneça uma saída segura.
- Botões seguem 44 px de altura, texto 14 px Semi Bold e raio de 12 px. Inclua estados de hover, foco, desabilitado e carregamento; foco não deve deslocar o conteúdo e carregamento deve impedir envios repetidos.
- Campos devem ter rótulo persistente, foco visível, estado de erro descritivo e estado desabilitado legível. Não use apenas placeholder como rótulo.
- Mantenha alvo de toque de pelo menos 44 × 44 px, ordem de teclado lógica e rótulos acessíveis para controles sem texto.

## CSS das telas

- Mantenha os estilos dentro da classe raiz exclusiva da tela para evitar vazamento entre rotas.
- Prefira tokens semânticos. Os aliases `--color-*`, `--space-*`, `--radius-md` e `--shadow-sm` são compatibilidade para código legado; use os nomes novos em componentes e estilos novos.
- Use `--text-2` ou `--muted` para texto secundário em vez de reduzir o contraste com opacidade.
- Não comunique estado usando apenas cor ou apenas peso tipográfico.
