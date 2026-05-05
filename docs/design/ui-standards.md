# Padrões de UI (Obrigatório)

> Fonte de verdade visual: `Spec/aprovado_ design system/`. Este documento traduz as regras do design system para as decisões diárias na app (área pública e logada).

## Tokens

- Cores, tipografia, raios, sombras e gradientes vêm de `components/marketing/aprovado-tokens.css` (`:root`). Nunca repetir hex literais — usar `var(--sap)`, `var(--em)`, `var(--n-200)`, etc.
- Tipografia: `--fd` (Geist display), `--fb` (Geist body), `--fm` (Geist Mono). Carregadas via `next/font/google` em `app/layout.tsx`.
- Tailwind: `tailwind.config.ts` expõe `bg-sap`, `text-em`, `font-mono`, `font-display`, `rounded-pill`, etc. apontando para os mesmos tokens.

## Botões (padrão oficial)

A app convive com **dois formatos** de botão e a escolha é semântica:

1. **CTA primário (pill).** Botões de ação principal do passo — "Continuar estudando", "Iniciar simulado", "Assinar Premium". Usam `border-radius: var(--r-pill)`, `background: var(--sap)`, `box-shadow: var(--sh-cta)` e ganham `translateY(-1px)` + `--sh-cta-hover` no hover. Exemplos no código: `.dash-btn-primary`, `.sim-action-btn-primary`, `.premium-plan-cta`, `.tracks-premium-cta`.
2. **Botões de ação usam formato semi-retangular** (`rounded-xl`, `--r-md`/12 px) para tudo que não é o CTA primário do passo: secundários, ações de card, abrir/fechar painéis, formulários. A classe `.button` cobre esse padrão e já vem com `@apply rounded-xl ...` em `app/globals.css`. Exemplos: `.button.secondary`, `.sim-action-btn-secondary`, `.sim-action-btn-tertiary`.

Resumindo:
- **Pill é exclusivo do CTA principal.** Nunca aplicar pill em ações de card, badges navegáveis ou opções de formulário.
- Nunca usar `@apply rounded-full px-4 py-2 text-sm font-semibold;` no `.button` base — esse atalho era do antigo guia e está deprecado.
- O hover do CTA primário sempre eleva (`translateY(-1px)`) e troca a sombra para `--sh-cta-hover`.

## Badges, tags e chips

- Sempre pill (`var(--r-pill)`).
- Família `var(--fm)`, uppercase, tracking `1.1–1.5px`, peso 600.
- Pareamento solid + tint (regra do DS): `--em-bg`/`--em-d` para Free / done; `--sap-bg`/`--sap-d` para "atual"/next; `--amb-bg`/`#92400E` para alerta/streak; `--coral-bg`/`#9F1F12` para erro; `--n-100`/`--fg-3` para neutro/locked.

## Cards e containers

- Cards de produto em `var(--r-lg)` (16 px), border `var(--n-200)`, fundo `--white`, shadow `--sh-xs` (ou `--sh-sm` se ganhar hover).
- Hero / motif em `var(--r-xl)` (24 px), fundo `--ink`, com overlays `--grad-hero-radial` + `--grad-dotgrid`.
- Inputs em `var(--r-sm)`/8 px com border `var(--n-200)`, foco `1.5px var(--sap)` + outer ring `0 0 0 3px rgba(27,63,216,.12)`.

## Tipografia

- Headlines em `var(--fd)`, peso 700–800, tracking `-0.02em`. **Um único verbo destacado em `var(--em)` por headline.** Usar `<span class="accent-em">…</span>`.
- Eyebrows e códigos de módulo (F1, F6) em `var(--fm)`, uppercase, tracking 1.2–1.5 px, peso 500–600, cor `--fg-4`.
- Números de stats sempre `tabular-nums` (`.tabular`).
- Símbolos formais (δ, Σ, q₀, ε, ∅) em `.formal-token` (mono em chip `--sap-bg`).

## Iconografia

- **Lucide React** para ícones de UI (sidebar, topbar, ações). Stroke `1.75`, 18×18 dentro da sidebar, 16×16 em botões de topbar. Nunca emoji em navegação ou botões de ação.
- Emoji é tolerado apenas em "module-row icon-on-tint" (44×44) e em conteúdo educacional, nunca no chrome.
- Caixa tinta semantic (`tone-em`, `tone-sap`, `tone-amb`) para ícones de navegação produto; caixa neutra (`--n-100` border `--n-200`) para utilitários.

## Marca

- Logo via `.aprovado-lockup` (já portado em `aprovado-tokens.css`). Tamanho `is-sm` na sidebar, `is-lg` em hero, padrão (38 px) em footers.
- Acento na segunda "a" sempre via `<span class="a">a</span>` — nunca colorir a palavra inteira.

## Onde olhar primeiro

- `Spec/aprovado_ design system/README.md` para a regra ("pill ou 12px", "solid + tint pareados", "mono ganha seu lugar").
- `Spec/aprovado_ design system/preview/*.html` para a marcação canônica de cada componente.
- `components/marketing/aprovado-tokens.css` para os tokens.
- `app/globals.css` para a aplicação prática na área logada.
