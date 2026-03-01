# Padrões de UI (Obrigatório)

Este documento define o padrão visual mínimo para novos fluxos e telas.

## 1. Botões (padrão oficial)

Objetivo: manter consistência entre simulador, exercícios, flashcards e autenticação.

### Formato

1. Botões de ação usam formato semi-retangular (`rounded-xl` / ~10-12px).
2. Botões de ação **não** usam formato pill.
3. Altura mínima de clique: `44px`.

### Classes oficiais

1. Base: `.button` ou `.sim-action-btn`.
2. Primário: `.button.primary` ou `.sim-action-btn-primary`.
3. Secundário: `.button.secondary` ou `.sim-action-btn-secondary`.
4. Terciário: `.sim-action-btn-tertiary` (quando necessário).

### Semântica

1. Primário: ação principal da etapa (ex.: `Próximo`, `Executar automático`, `Corrigir resposta`).
2. Secundário: ações úteis, mas não centrais.
3. Terciário: ações de apoio e navegação auxiliar.

### Proibições

1. Não usar estilo de chip para ação principal.
2. Não misturar botão pill de ação com botão semi-retangular na mesma barra de ações.
3. Não criar novo estilo de botão sem necessidade real de produto.

## 2. Chips vs Botões

1. Chips representam filtro, preset, categoria ou estado.
2. Botões representam ação.
3. Chips podem ser pill; botões de ação não.

## 3. Checklist de aceite UX (antes de merge)

1. A ação principal está visualmente dominante e única por bloco?
2. O usuário diferencia chip de botão em menos de 2 segundos?
3. Todos os botões de ação seguem formato semi-retangular?
4. Áreas clicáveis respeitam mínimo de 44px?
5. Mobile mantém legibilidade e alcance de toque?

