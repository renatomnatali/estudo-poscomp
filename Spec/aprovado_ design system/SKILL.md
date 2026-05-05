# POSCOMP Visual Lab — design skill

Use this design system when designing for the **POSCOMP Visual Lab** product (a Brazilian study app for the POSCOMP CS grad-school exam). Audience speaks PT-BR. Voice is *animated academic* — confident about rigour, warm about the journey.

## How to use

1. **Read the [README](README.md) first.** It carries the voice rules, content density rules, and the three foundational rules (pill-or-12px, solid+tint pairing, mono earns its keep).
2. **Import the tokens.** Every HTML output should `<link>` or `@import` `colors_and_type.css`. Never hard-code hex values — use `var(--sap)`, `var(--em)`, etc.
3. **Match the surface to the goal.** Marketing/launch surfaces use the **dark hero treatment** (ink + radial + dot-grid + Syne 800 headline with one emerald verb). Product/study surfaces use the **bright canvas** (`--bg-2`, near-white) with module cards, sidebar nav, progress.
4. **Pick components from `preview/*.html`.** They are deliberately minimal HTML — copy the markup, keep the class/style intent.
5. **Lean on the automaton motif** when a surface needs visual richness without illustration. q₀ → q₁ → q₂ is the brand's signature.

## Quick checks before shipping

- [ ] All copy is in PT-BR.
- [ ] One emerald accent verb per headline, never two.
- [ ] Numbers are tabular.
- [ ] Mono is used for eyebrows, module codes, formal symbols — not for body or buttons.
- [ ] Pill OR 12px within a component, not both.
- [ ] Every solid colour appears with its `-bg` tint partner (except primary CTAs).
- [ ] No SVG icons — emoji on tinted squares, or formal-language tokens.
- [ ] No filler content. If a section is empty, fix the layout.

## What this system is NOT for

- Generic landing pages or non-POSCOMP educational products.
- English-language audiences (the voice is calibrated for PT-BR rhythm).
- Heavy illustrative work — the brand is type-driven and motif-driven, not illustration-driven.
