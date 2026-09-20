<!-- v1.3 — 2026-05-10 -->

# Briefing — Criação de Módulo POSCOMP (aprovado.xyz)

Use este briefing como prompt do Claude Code Web (ou outro agente) ao criar um módulo novo.

## Contexto do produto

**aprovado.xyz** — plataforma de estudos para o exame **POSCOMP** (Pós-Graduação em Computação, SBC). Tese central: **profundidade técnica + simulação interativa + cuidado didático** ocupa o cruzamento entre livros acadêmicos rigorosos (mas estáticos) e cursinhos comerciais (interativos mas rasos). Você está produzindo um dos módulos que materializa essa tese.

Cada módulo é uma unidade de estudo de ~40-70 minutos, exibida em uma única página dentro de uma trilha. O conteúdo deve ter rigor de livro acadêmico **e** interatividade que livro não tem (simulador, traces visuais, quiz com explicação).

## Design system — fonte da verdade

Toda decisão visual (classes CSS, tokens, paleta, tipografia, componentes) vive em:

```
Spec/aprovado_ design system/
```

**Consulte o DS antes de escrever HTML.** Não invente classes. Não use cor hex inline. Se uma classe necessária não existe no DS, **abra PR ao DS adicionando** antes de usar — não improvise prefixos `_temp` no fragmento.

Este briefing **não lista classes** intencionalmente. Listas duplicadas divergem; o DS é o registro autoritativo.

## Formato do entregável

HTML standalone seguindo `Spec/aprovado_ design system/MODULE-TEMPLATE.html`.

O pipeline de ingestão (`scripts/ingest-study-modules.ts`) extrai 3 partes:

| Origem no HTML | Vira no `.source.json` |
|---|---|
| `<header class="lesson-header">` | `header` (badge, title, subtitle, meta, progressLabel) |
| `<nav class="section-nav">` | `navLinks[]` |
| `<main class="lesson-content">` | `html` (fragmento) |

Tudo fora desses três blocos é descartado.

### Estrutura exigida

```html
<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>...</title></head>
<body>

<header class="lesson-header">
  <span class="module-badge">Módulo N de M</span>
  <h1>Título do Módulo</h1>
  <p class="subtitle">...</p>
  <div class="header-meta">
    <span>~XX min</span>
    <span>Nível: ...</span>
    <span>Característica-chave</span>
  </div>
  <span class="progress-label">Módulo N de M — Slug Curto</span>
</header>

<nav class="section-nav">
  <a href="#conceito">Conceito</a>
  <a href="#definicao">Definição</a>
  ...
</nav>

<main class="lesson-content">
  <section id="conceito">
    <h2><span class="num">1</span> ...</h2>
    ...
  </section>
  <section id="definicao">
    <h2><span class="num">2</span> ...</h2>
    ...
  </section>
  ...
</main>

</body>
</html>
```

### Regras dos campos do `header`

| Campo | Onde | Formato | Exemplo |
|---|---|---|---|
| badge | `.module-badge` | `Módulo N de M` | `Módulo 2 de 9` |
| title | `<h1>` | Frase curta (3-7 palavras) | `Autômato Finito Determinístico` |
| subtitle | `.subtitle` | 1 frase explicando o que o aluno vai dominar | `Da definição formal à execução visual — construa, leia e simule um AFD do zero.` |
| meta | `.header-meta > span` | 2-4 spans (duração, nível, característica) | `~55 min` · `Nível: Fundamental` · `Simulador interativo` |
| progressLabel | `.progress-label` | `Módulo N de M — <Slug curto>` | `Módulo 2 de 9 — AFD` |

Não usar emojis no início dos campos meta — o pipeline remove via `stripHeaderIconPrefix`.

### Regras dos `navLinks`

- Cada link em `<nav class="section-nav">` é `<a href="#id">Label</a>`.
- O `id` deve bater com o `id` de uma `<section>` em `<main>`.
- Label curto (1-3 palavras).
- Ordem dos links = ordem das seções.

## Tratamentos automáticos do pipeline

Você não precisa se preocupar com:

| Tratamento | Implicação para você |
|---|---|
| Renumeração de `<h2><span class="num">N</span>` | Pode escrever `1, 2, 3...` mas será reescrito sequencial 1..N pelo pipeline. Não dá para "pular" números. |
| `quiz-btn[onclick="check('qid','A','expid')"]` | Use o padrão `onclick`; pipeline converte para `data-*`. Veja seção Quiz. |
| `preset-btn[onclick="loadPreset('id')"]` | Idem; vira `data-preset-id`. |
| `sim-btn[onclick="simInit()|simStep()|simRun()|simReset()"]` | Idem; vira `data-sim-action`. |
| Outros `onclick` | Removidos. Use `data-*` ou listeners JS no `<script>`. |

## Estrutura recomendada do conteúdo

10 seções típicas (adaptar à natureza do tema):

| # | Seção | Propósito |
|---|---|---|
| 1 | Conceito central | Intuição, analogia concreta |
| 2 | Definição formal | Notação rigorosa |
| 3 | Exemplo construído | Problema resolvido passo a passo |
| 4 | Tabela / diagrama | Representação visual da estrutura |
| 5 | Execução manual | 2-3 traces com comentários |
| 6 | Simulador interativo | Aluno experimenta com input próprio |
| 7 | Casos especiais | Edge cases, estado morto, falhas comuns |
| 8 | Generalização teórica | Linguagem ou propriedade modelada |
| 9 | Quiz | 4-6 questões estilo POSCOMP |
| 10 | Resumo + ponte | O que dominou + o que vem no próximo módulo |

Não obrigatório seguir essa ordem se o tema pede outra; mas as funções (intuição → formal → exemplo → execução → interatividade → exercícios → resumo) devem estar presentes.

## Headings

- `<h1>` — só dentro de `<header class="lesson-header">`. Nunca em `<main>`.
- `<h2><span class="num">N</span> Título</h2>` — abre cada `<section>`.
- `<h3>` — subseção dentro de uma `<section>`.
- `<h4>` — sub-subseção (use com moderação; preferir reorganizar antes).

## Idioma e acentuação

- **Todo texto user-facing em pt-BR com acentuação correta.** Nunca "Nao" em vez de "Não", "voce" em vez de "você", "matematica" em vez de "matemática".
- Terminologia técnica precisa (ex.: "linguagem regular", "fecho de Kleene", "pivô" em ordenação).
- Não usar growth-speak ("user journey", "engagement", "funnel").
- Pode usar termos técnicos em inglês quando consagrados (DFA, NP-completo, hash table).

## Simulador interativo — diretrizes

Todo módulo de tema "estrutura/algoritmo" deve ter um simulador. Padrão:

- **Inputs claros**: campo de texto + botões "Executar", "Passo a passo", "Reset".
- **Presets**: 2-4 botões `<button class="preset-btn" onclick="loadPreset('id')">` com exemplos pré-definidos (string aceita, string rejeitada, edge case).
- **Visualização ao vivo**: estado atual destacado, tabela animada, fita de entrada com cabeçote — use componentes do DS.
- **Status final**: badge de aceito/rejeitado com texto explícito.
- **JS embutido (só para o estágio standalone)**: `<script>` imediatamente após o componente faz o mockup funcionar sozinho no navegador — mas o pipeline **não executa esse JS no produto**: o app renderiza o HTML ingerido sem rodar `<script>`. Um simulador novo só fica interativo no site quando ganhar seu componente React registrado no runtime (padrão do `modulo-02` em `components/study/module-page.tsx`). Ou seja: o `<script>` serve para validar a experiência no standalone; a interatividade em produção é implementação separada no app. Funções com conversão automática de `onclick` → `data-*` no ingest: `simInit`, `simStep`, `simRun`, `simReset`, `loadPreset`, `check`.

## Quiz — diretrizes

- 4-6 questões.
- Ao menos 1 questão com label `POSCOMP <ano>` ou `POSCOMP <ano> (adaptada)`.
- Cada questão tem 4-5 alternativas.
- Padrão do botão: `<button class="quiz-btn" onclick="check('q1','B','expQ1')">B) Texto</button>`. Pipeline converte em `data-question-id="q1" data-answer-key="B" data-explanation-id="expQ1"`. O 3º argumento aceita **o texto completo da justificativa** (padrão do corpus) ou um id de bloco; evite aspas simples dentro do argumento (use ‘curvas’ — aspas retas escapadas quebram a conversão).
- Justificativa **completa e visível**: por que a correta é correta E por que **cada** alternativa errada falha — escrita no `<details>` junto da questão (é o que o aluno lê no produto; o atributo é preservado para uso futuro pelo runtime).
- Use componentes do DS para renderizar (consulte DS).

## Quando uma classe necessária não existe no DS

1. Confirmar via `grep -r "\.classe-x" Spec/aprovado_\ design\ system/` que realmente não existe.
2. Abrir PR ao DS propondo a adição.
3. Aguardar merge.
4. Só então usar no módulo.

**Não criar classe inline ou com prefixo `_temp` no fragmento.** O DS é o registro autoritativo.

## Assets

Imagens, ícones SVG complexos, áudio, vídeo:

- **SVG inline** preferido para diagramas (entra direto no fragmento, sem dependência externa).
- **Imagens raster** (`.png`, `.jpg`): salvar em `public/study/<slug>/` e referenciar via `/study/<slug>/arquivo.png`.
- **Áudio/vídeo**: idem `public/study/<slug>/`.
- **Ícones simples**: usar Lucide (já no produto via `lucide-react`); no fragmento, inline SVG do Lucide.
- **Não usar CDN externo** sem justificativa explícita.

## Migração de módulos legados

Se está portando um HTML legado existente para o formato canônico:

1. Verificar que o legado tem `.lesson-header`, `.section-nav`, `.lesson-content`. Se não, envolver o conteúdo nessas classes.
2. Mover título do módulo para `<h1>` dentro de `<header class="lesson-header">`.
3. Verificar que `<h2>` em cada `<section>` segue o padrão exato `<h2><span class="num">N</span>` — o pipeline renumera **apenas** nesse formato (`<h2>` sem atributos extras; com classe, o número fica como está).
4. Padronizar `<button class="quiz-btn" onclick="check(...)">`, `preset-btn`, `sim-btn`.
5. Remover qualquer `<aside class="sidebar">`, `<header class="topbar">`, breadcrumb — descartado pelo pipeline mas polui o arquivo.
6. Remover **todo** `<style>`: o que está fora das `<section>` é descartado pelo ingest, e `<style>` dentro de section é **erro** no validador. Customização visual entra no DS (`globals.css`), nunca inline.
7. Salvar o standalone em `Spec/mockup/import/<slug>.html` (é de lá que o ingest lê; `--input <caminho>` para caso especial).
8. Rodar pipeline: `npm run study:modules:ingest -- --slug <slug>`.
9. Conferir `data/study/modules/<slug>.source.json`: `header.title` correto? `navLinks` completos? `html` sem ruído?
10. Rodar validação: `npm run study:modules:validate -- --slug <slug>`.

## Anti-padrões — não fazer

| ❌ | Por quê |
|---|---|
| Inventar classes | DS é fonte da verdade |
| Cores hex inline (`color: #1B3FD8`) | Tokens via classes |
| `<h1>` dentro de `<main>` | `<h1>` só no `lesson-header` |
| Numerar `<h2>` esperando que o número fique | Pipeline renumera |
| `<aside>`, `<header class="topbar">`, breadcrumb dentro do módulo | Descartado, polui o fragmento |
| Texto sem acento em pt-BR | Viola Regra 6 do produto (`CLAUDE.md`) |
| Quiz sem justificativa | Aluno não aprende com erro |
| Simulador sem presets | Aluno fica perdido sobre o que digitar |
| `<style>` com `:root` redefinindo tokens | Tokens vivem no DS; redefinir cria drift |

## Validação antes do PR (obrigatório)

Após o ingest gerar o `.source.json`, **antes de abrir o PR**, rodar:

```bash
npm run study:modules:ingest -- --slug <slug>          # gera .source.json
npm run study:modules:validate -- --slug <slug>        # valida
# ou
npm run study:modules:validate -- --all                # valida todos
# adicionar --strict para promover warnings a errors
```

O script `scripts/validate-module-fragment.ts` checa:

- **Header:** `title`, `badge`, `subtitle`, `progressLabel` não vazios; `meta` com 2-4 itens; `badge` no formato `Módulo N de M`; `progressLabel` no formato `Módulo N de M — Slug`.
- **navLinks:** array não vazio (≥4); cada `id` tem `<section>` correspondente no `html`.
- **Sections órfãs:** warning se uma `<section id>` no `html` não tiver entrada em `navLinks`.
- **html proibições:** sem `<html>`, `<head>`, `<body>`, `<style>`, `<link>`, `<h1>`.
- **Quiz buttons:** cada `<button class="quiz-btn">` tem `data-question-id` E `data-answer-key`.
- **Numeração de h2:** warning se `<h2><span class="num">N</span>` está fora de sequência (pipeline renumera, mas detecta gaps que indicam descuido).
- **Classes contra DS + globals.css:** warning para classes usadas que não existem em `Spec/aprovado_ design system/colors_and_type.css` nem em `app/globals.css` (fonte da verdade — falta nessa lista vira PR ao DS antes do uso).
- **pt-BR sem acentos:** warning para palavras detectadas como `nao`, `voce`, `matematica`, etc.

**Errors falham build** (exit 1). **Warnings só reportam** (exit 0), exceto com `--strict`.

## Checklist final antes de entregar

- [ ] HTML standalone com `<header class="lesson-header">`, `<nav class="section-nav">`, `<main class="lesson-content">`.
- [ ] Todos os 5 campos do `header` preenchidos no formato correto.
- [ ] Cada `<a>` em `<nav>` aponta para `<section>` existente em `<main>`.
- [ ] Pelo menos 1 callout com a "intuição central".
- [ ] Pelo menos 1 simulador interativo (se tema permite) com 2-4 presets.
- [ ] Quiz com 4-6 questões, ao menos 1 com `POSCOMP <ano>`, todas com justificativa completa.
- [ ] Resumo final com "O que você agora domina" + "O que vem no próximo módulo".
- [ ] Zero `<aside>`/`.sidebar`/`.topbar`/`<style>` redefinindo tokens.
- [ ] pt-BR com acentuação correta.
- [ ] Classes usadas existem no DS (consulta manual; v1.3 automatiza via script).

## Referências

- **Template canônico**: `Spec/aprovado_ design system/MODULE-TEMPLATE.html`
- **Padrões de simulador verificados**: `Spec/aprovado_ design system/SIMULATOR-PATTERNS.md`
- **Design system**: `Spec/aprovado_ design system/`
- **Pipeline de ingestão**: `scripts/ingest-study-modules.ts`
- **Validação**: `scripts/validate-module-fragment.ts` (npm `study:modules:validate`)
- **Módulos de referência (já ingeridos)**: `data/study/modules/modulo-01..09.source.json` (F6 completo)
- **Tese e princípios do produto**: `CLAUDE.md` (raiz do repo)

---

## Changelog

| Versão | Data | Mudança |
|---|---|---|
| **1.3** | 2026-05-10 | Script de validação implementado (`scripts/validate-module-fragment.ts`, npm `study:modules:validate`). Comandos reais documentados. Referência ao novo `SIMULATOR-PATTERNS.md` v1.1 (catálogo verificado). Lista de módulos de referência ampliada para F6 completo. |
| 1.2 | 2026-05-10 | (Pulada — mudanças incorporadas direto em 1.3.) |
| 1.1 | 2026-05-10 | Refeito após audit. Formato standalone alinhado ao pipeline (`.lesson-header`, `.section-nav`, `.lesson-content`). Removida lista de classes — DS é fonte da verdade. Adicionadas convenções JS do pipeline (check, simInit, etc.). Tabelas de regras dos campos `header`. Seção "Quando uma classe não existe no DS". Roteiro de migração de legados. Antipadrão de `<h1>` em `<main>`. |
| 1.0 | 2026-05-10 | Primeira versão (formato fragmento com `<script type="application/json">`, lista de classes). **Deprecada** — não compatível com o pipeline atual. |
