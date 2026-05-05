# Padrões de UI (Obrigatório)

> Há dois sistemas visuais convivendo no repositório:
>
> - **Área logada (POSCOMP Visual Lab)** — fonte de verdade em `Spec/mockup/*.html`. Tokens em `:root` de `app/globals.css`. Fontes Syne (display) + DM Sans (body) + DM Mono (mono). Logo `sb-logo-icon` "PV" + "POSCOMP / Visual Lab".
> - **Landing pública (aprovado.xyz)** — fonte de verdade em `Spec/aprovado_ landing-page/`. Tokens e logo em `components/marketing/aprovado-tokens.css`, escopo limitado por `.marketing`. Fontes Geist + Geist Mono.
>
> Use o sistema correto pelo contexto. Nunca misture: Geist é da landing, Syne/DM Sans/DM Mono é da área logada.

## Tokens (área logada)

- **Cores:** `--ink`, `--ink2`, `--sap` / `--sap-d` / `--sap-l` / `--sap-bg` / `--sap-bg2`, `--em` / `--em-d` / `--em-bg`, `--amb` / `--amb-bg`, `--coral` / `--coral-bg`, `--n50` / `--n100` / `--n200` / `--n300` / `--n400` / `--n500` / `--n600` / `--n700`, `--white`. Os neutros usam nomenclatura **sem hífen** (`--n200`, não `--n-200`) para alinhar ao mockup.
- **Tipografia:** `--fd` (Syne), `--fb` (DM Sans), `--fm` (DM Mono). Carregadas via `next/font/google` em `app/layout.tsx`.
- **Raios:** `--r-sm` 6 / `--r-md` 10 / `--r-lg` 14 / `--r-xl` 20 / `--r-pill` 9999.
- **Sombras:** `--sh-xs` / `--sh-sm` / `--sh-md` / `--sh-cta` / `--sh-cta-hover`.
- **Layout shell:** `--sidebar-w` 240 / `--sidebar-c` 64 / `--topbar-h` 52 / `--transition`.

Hex direto só é permitido em `linear-gradient` ou `rgba()` quando a opacidade é parte do efeito visual (overlays, tints semi-transparentes do hero). Para qualquer outro uso, consumir tokens.

## Botões (padrão oficial)

A app convive com **dois formatos** de botão e a escolha é semântica:

1. **CTA primário (pill).** Ação principal do passo — "Iniciar simulado", "Assinar Premium". Usa `border-radius: var(--r-pill)`, `background: var(--sap)`, `box-shadow: var(--sh-cta)`, hover com `translateY(-1px)` + `--sh-cta-hover`. Exemplos: `.dash-btn-primary`, `.sim-action-btn-primary`, `.plan-cta.is-premium`, `.sim-btn-start`, `.flash-btn-flip`.
2. **Botões de ação usam formato semi-retangular** (`rounded-xl`, `--r-md` ≈ 10–12 px) para tudo que não é o CTA primário: secundários, ações de card, controles de form, abrir/fechar painéis. A classe base `.button` já vem com `@apply rounded-xl …` em `app/globals.css`. Exemplos: `.button.secondary`, `.sim-action-btn-secondary`, `.sim-action-btn-tertiary`, `.sim-option-row`.

Resumindo:
- **Pill é exclusivo do CTA principal.** Nunca aplicar pill em ações de card, badges navegáveis ou opções de formulário.
- Nunca usar `@apply rounded-full px-4 py-2 text-sm font-semibold;` no `.button` base — esse atalho era do antigo guia e está deprecado.
- Hover do CTA primário sempre eleva (`translateY(-1px)`) e troca a sombra para `--sh-cta-hover`.

## Badges, tags e chips

- Sempre pill (`var(--r-pill)`).
- Família `var(--fm)`, uppercase, tracking `1.1–1.5px`, peso 600.
- Pareamento solid + tint: `--em-bg` / `--em-d` para Free / done; `--sap-bg` / `--sap-d` para "atual" / next; `--amb-bg` / `#92400E` para alerta / streak; `--coral-bg` / `#9F1F12` para erro; `--n100` / `--n500` para neutro / locked.

## Cards e containers

- Cards de produto em `var(--r-lg)` (14 px), border `var(--n200)`, fundo `--white`, shadow `--sh-xs` (ou `--sh-sm` se ganhar hover).
- Hero ink em `var(--r-xl)` (20 px), fundo `--ink` ou `linear-gradient(135deg, var(--ink), var(--ink2), …)`, com radial overlays sap / em.
- Inputs em `var(--r-sm)` (6 px) com border `var(--n200)`, foco `1.5px var(--sap)` + outer ring `0 0 0 3px rgba(27,63,216,.12)`.

## Tipografia

- Headlines em `var(--fd)` (Syne), peso 700–800, tracking `-0.01em` a `-0.02em`. **Um único verbo destacado em `var(--em)` por headline** — usar `<span class="accent-em">…</span>` ou `<span class="em">…</span>`.
- Eyebrows e códigos de módulo (F1, F6) em `var(--fm)` (DM Mono), uppercase, tracking 1.2–1.5 px, peso 500–600, cor `--n400`.
- Números de stats sempre `tabular-nums` — aplicar a classe `.tabular`.
- Símbolos formais (δ, Σ, q₀, ε, ∅) em `.formal-token` (mono em chip `--sap-bg`).

## Iconografia

- **Lucide React** para ícones de UI (sidebar, topbar, ações). Stroke `1.75`, 18×18 dentro da sidebar, 16×16 em botões de topbar.
- Emoji é tolerado em conteúdo educacional (algoritmos, jogos, tópicos) e em "module-row icon-on-tint" (44×44). Para chrome / navegação / toolbar, sempre Lucide.
- Caixa tinta semântica (`tone-em`, `tone-sap`, `tone-amb`) para ícones de produto; caixa neutra (`--n100` + border `--n200`) para utilitários.

## Marca

- **Área logada:** logo `sb-logo-icon` (caixa 32×32 com gradient `--sap → --em` e iniciais "PV") + `sb-logo-text` ("POSCOMP" / "Visual Lab"). Renderizado em `components/study/study-shell.tsx`.
- **Landing pública:** lockup `aprovado-lockup` (ring esmeralda + word "aprov<span class='a'>a</span>do"). Definido em `components/marketing/aprovado-tokens.css`. Não usar fora do escopo `.marketing`.

## Onde olhar primeiro

- `Spec/mockup/dashboard.html`, `Spec/mockup/simulado.html`, `Spec/mockup/flashcards.html`, `Spec/mockup/premium.html` — marcação canônica da área logada.
- `Spec/aprovado_ landing-page/` — referência da landing pública.
- `app/globals.css` — `:root` com tokens canônicos + todas as classes da área logada.
- `components/marketing/aprovado-tokens.css` — tokens da landing (escopo `.marketing`).
