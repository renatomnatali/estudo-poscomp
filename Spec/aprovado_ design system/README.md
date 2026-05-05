# Aprovado — Design System

> **aprovado.xyz** — Brazilian study app for the **POSCOMP** (national CS grad school exam, run by SBC). Marketing landing page + study app: dashboard, 25 topic modules, simulator, flashcards, exercises, premium tier. PT-BR throughout. Tone: animated academic — *"Estude para o POSCOMP de um jeito que faz sentido."*

The name is the promise: *aprovado* is the word every candidate is chasing. The logo — emerald accept-state ring with a check, sitting beside the wordmark — reads as "**✓ aprovado**", which is both a CS in-joke (q-final accept state) and the motivational headline the user wants to earn. Use the `.aprovado-lockup` class from `colors_and_type.css`; never re-roll the mark by hand.

This document is the source of truth. The CSS lives in [`colors_and_type.css`](colors_and_type.css). Every preview in `preview/*.html` consumes it.

---

## Index

- [Content fundamentals](#content-fundamentals)
- [Visual foundations](#visual-foundations)
- [Color](#color)
- [Typography](#typography)
- [Spacing, radii, elevation](#spacing-radii-elevation)
- [Components](#components)
- [Brand motifs](#brand-motifs)
- [Iconography](#iconography)

---

## Content fundamentals

### Voice & tone — PT-BR
- **Animated academic.** Confident about the rigour, warm about the journey. Never hype, never sales-speak.
- **Direct, second person, lowercase familiarity.** *"Estude"*, *"Continue"*, *"Veja"* — not *"Aprenda você também a..."*.
- **Concrete promises.** *"25 tópicos"*, *"15 minutos por dia"*, *"baseado no edital SBC 2025"* > vague *"prepare-se melhor"*.
- **Negative-positioning is allowed and on-brand.** *"Não é PDF, não é videoaula. É conteúdo estruturado visualmente para você entender — não só memorizar."*
- **Highlight one verb per heading in emerald** (`var(--em)`) — e.g. *"de um jeito que **faz sentido**"*. One accent, never two.
- **Numbers always tabular** (`font-variant-numeric: tabular-nums`). Stats are a feature.
- **Never use "AI"-flavoured words** (otimize, transforme, eleve, descomplique). The brand sells understanding, not transformation.

### Domain vocabulary
- The exam: **POSCOMP**, run by **SBC**, edital code references like **F6** (Linguagens Formais), **F1**, **F2**…
- Reference textbooks shown as outline pills: *Sipser 3ª ed.*, *Cormen*, *Hopcroft*.
- Formal-language symbols are part of the visual system: `δ`, `Σ`, `→`, `q₀`, `ε`, `∅`, `M = (E, Σ, δ, e₀, F)`. Always typeset in **DM Mono** or Georgia, never an icon.

### Content density rules
- Hero: one sentence headline + one sentence subhead + one CTA + one trust pill. Nothing else.
- Module rows: emoji-on-tint (44×44) + title + 1-line description + Free/Premium tag. No more.
- Stats strip: 4 numbers max, all whole, all meaningful (25 / 9 / 70 / 100%).
- **One thousand no's for every yes.** If a section feels empty, fix the layout — don't pad it.

---

## Visual foundations

### Aesthetic in one paragraph
Dark hero with sapphire/emerald radial light bleeding through a 32px dot-grid; bright product surfaces on a near-white cool-bias canvas; system sans at **weight 800 + tight tracking** turns headlines into confident textbook chapter titles; the same stack at 400–500 carries body copy and breathes; the system mono stack carries every micro-label, formal-language token and code snippet so the *computer-science-ness* is always visible. The signature visual is a styled finite automaton (`q₀ → q₁ → q₂`) — used in the hero and as decoration on empty states.

### Three rules that hold everything together
1. **Pill or 12px — never both.** CTAs and tags are pill (`9999`); cards and inputs are 12px. Mixing radii within a component breaks the system.
2. **Solid + `-bg` tint always travel as a pair.** Sapphire dot on `--sap-bg` surface. Emerald check on `--em-bg` surface. Never solid on white without its tinted partner unless it's a button.
3. **Mono earns its keep.** Use the mono stack (`--fm`) for: eyebrows, module codes (F6, M3), formal-language tokens, time/streak labels, stat units. Not for body, not for headlines, not for buttons.

---

## Color

Open the cards: [Brand](preview/colors-brand.html) · [Neutrals](preview/colors-neutrals.html) · [Semantic](preview/colors-semantic.html).

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0A0F1E` | Hero bg, headings on light, dark surfaces |
| `--sap` / `--sap-d` / `--sap-l` | `#1B3FD8` / `#1230A8` / `#4B6BF5` | Primary CTAs, links, "atual" state, gradients |
| `--em` / `--em-d` | `#00B37E` / `#009968` | Free tier, correct answer, completion, progress endpoint |
| `--amb` | `#F59E0B` | Streak, time warning |
| `--coral` | `#F04E37` | Wrong answer, error |
| `--sap-bg` / `--em-bg` / `--amb-bg` / `--coral-bg` | tinted | Always paired with the matching solid |
| `--n-50…700` | cool greys | Surfaces, borders, text |

**Foreground tokens:** `--fg-1` (ink, primary text) · `--fg-2` (n-600, secondary) · `--fg-3` (n-500, muted) · `--fg-4` (n-400, micro-labels).

**Brand gradient — `--grad-logo`:** `linear-gradient(135deg, sap, em)`. Used on the logo mark and on any large primary illustration. Never fill body copy with it.

---

## Typography

Open: [Display](preview/type-display.html) · [Body](preview/type-body.html) · [Mono](preview/type-mono.html).

**Geist** for display + body, **Geist Mono** for code — both loaded from Google Fonts. Geist is Vercel's open-source family: geometric, modern, premium. The display/body distinction is **purely weight + size + tracking** (same family, different role). If Geist fails to load, system sans takes over.

| Token | Family | Use |
|---|---|---|
| `--fd` (display) | **Geist** 700–800 | All headings (`h1–h4`). Tight tracking (-0.02em on h1/h2). |
| `--fb` (body) | **Geist** 400–600 | Body, buttons, labels, form copy. |
| `--fm` (mono) | **Geist Mono** 400–500 | Eyebrows, code, module codes, formal-language tokens, timestamps. |

**Sizes (rem-based, body 15px):**
- h1: `clamp(2.4rem, 4.5vw, 3.6rem)` · h2: `clamp(1.8rem, 3vw, 2.5rem)` · h3: 1.2rem · h4: 1rem
- body: 1rem (1.65 leading) · small: 0.78rem · eyebrow: 0.66rem (1.5px tracking, uppercase)

---

## Spacing, radii, elevation

Open: [Spacing](preview/spacing.html) · [Radii](preview/radii.html) · [Shadows](preview/shadows.html).

- **Spacing.** 4px grid. Tokens `--sp-1` (4) → `--sp-16` (64). Most layouts live between 12 and 32.
- **Radii.** `sm 6` (chips, inputs) · `md 12` (buttons, inline cards) · `lg 16` (module cards) · `xl 24` (hero / feature) · `pill 9999` (CTAs, tags, badges, segmented switches).
- **Shadows.** All ink-tinted (`rgba(10,15,30, …)`). `--sh-cta` is the sapphire-glow variant — only on primary CTAs. Never combine elevation with a heavy border; pick one.

---

## Components

| Component | Card | Notes |
|---|---|---|
| [Buttons](preview/buttons.html) | primary pill / secondary 12px / tertiary tinted / segmented | Primary always carries `--sh-cta` and intensifies on hover (`-1px Y` + `--sh-cta-hover`). |
| [Badges & chips](preview/badges.html) | Free / Premium / streak / topic tags | Mono uppercase + 1.2–1.5px tracking. Free is the only badge with the ✓ glyph. |
| [Inputs](preview/inputs.html) | text / select / focus / kbd / toggle | Focus = `1.5px sap` border + `3px rgba(sap,.12)` outer ring. `kbd` uses DM Mono. |
| [Stat card](preview/stat-card.html) | stat strip + feature card | Numbers in DM Sans 700, sap, tabular-nums. |
| [Progress & level](preview/progress.html) | bar + step indicator | Bar uses `--grad-progress` (sap-l → em). Steps: em ✓ / sap current / n-100 locked. |
| [Sidebar nav](preview/sidebar-nav.html) | active = sap-bg + sap-bg-2 border + sap-d text | Right-aligned emoji at 0.7 opacity. |
| [Flashcard](preview/flashcard.html) | front (Georgia) / back (em-tinted gradient) / 4 buttons | Rating: Errei (coral) · Difícil (amber) · Bom (sap) · Fácil (em). |
| [Module card](preview/module-card.html) | topic group + Free / Premium rows | Module codes (F6, F1) on coloured 24×24 squares: emerald = unlocked, n-300 = locked. |
| [Float / toast](preview/float-toast.html) | glass on dark | bg at 16-18% alpha · matching border at 28-32% · `backdrop-filter: blur(12px)`. |

---

## Brand motifs

| Motif | Card | Notes |
|---|---|---|
| [Automaton](preview/motif-automaton.html) | dark surface + dot-grid + 3-state diagram | The brand's signature visual. q₀ initial (sap), q₁ normal (glass), q₂ accept (em ringed). Use full-bleed in the hero, miniature in empty states, decorative on certificates. |
| [Hero treatment](preview/motif-hero.html) | ink + radial gradient + dot-grid + Syne 800 | Always: trust pill (• em dot) + headline with one emerald verb + 1-line subhead. Reused across landing, simulator-launched, certificate. |

The combination — **dark base + radial sapphire/emerald light + dot-grid + automaton + Syne 800 headline with one emerald verb** — is the brand. If you can recognise the product without reading the words, those five elements are doing the work.

---

## Iconography

Open: [Iconography](preview/iconography.html).

- **Use Lucide** (`lucide.dev`) — open-source, MIT, ~1500 icons, actively maintained. **Never hand-draw icons** — pick the closest Lucide name. Consistency &gt; semantic precision.
- Stroke `1.75`, 24×24, round caps. Caixa 46×46, raio 11.
- **Tinted box for product navigation** — semantic colour matches the destination (em for accomplishment/visualizations, sap for primary/study, amb for time/streak, coral for flashcards/wrong).
- **Plain box for neutral utilities** — search, settings, profile, edital. White background, `n-200` border, ink stroke.
- **Never use emoji.** No 📚, 🎯, 🔬 — they read as amateur. Real icons signal a paid product.
- **Formal-language symbols** (`δ Σ → q₀ ε ∅`) are typeset in mono, chipped in `--sap-bg`. They ARE the iconography for anything CS-specific.

**Current Lucide picks:** Trilhas → `route` · Visualizações → `workflow` · Simulado → `timer` · Flashcards → `layers` · Progresso → `trending-up` · Conquistas → `trophy` · Streak → `flame` · Edital → `file-text` · Tópicos → `book-open` · Conta → `user-round` · Config → `settings` · Premium → `sparkles` · Ajuda → `circle-help`.

---

## File map

```
colors_and_type.css         ← single source of truth (import this)
preview/_card.css           ← shared chrome for the design-system cards
preview/*.html              ← every component / token preview, registered as assets
README.md                   ← this doc
```
