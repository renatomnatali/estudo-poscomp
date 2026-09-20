<!-- v1.1 — 2026-05-10 -->

# Padrões de simulador interativo

Catálogo de padrões reusáveis observados **nos módulos efetivamente ingeridos** do produto. Cada padrão indica módulo de referência onde foi verificado.

## Escopo deste catálogo

Este documento lista **somente padrões verificados** em `data/study/modules/*.source.json` (atualmente F6, 9 módulos: AFD, AFN, Operações, Minimização, ER, GLC/PDA, Bombeamento, P/NP).

Outras trilhas (F1–F5, F7–F10, M, T) ainda não foram ingeridas. Quando módulos novos chegarem ao `data/study/modules/`, novos padrões observados (ex.: calculadora numérica, comparador de algoritmos em grafo, BFS/DFS animado) entram aqui — sempre com módulo de referência verificável.

A versão anterior deste documento (v1.0) tinha 6 padrões com referências a arquivos que foram deletados ou nunca existiram; foi descartada.

## Funções JS reconhecidas pelo pipeline

`scripts/ingest-study-modules.ts` converte `onclick` para `data-*` em 3 padrões específicos:

| `onclick=` | Vira | Onde verifiquei |
|---|---|---|
| `simInit()` `simStep()` `simRun()` `simReset()` | `data-sim-action="init/step/run/reset"` | modulo-02 (4 ocorrências) |
| `loadPreset('id')` | `data-preset-id="id"` | modulo-02 (4), modulo-05 (3) |
| `check('qid','A','expid')` | `data-question-id`, `data-answer-key`, `data-explanation-id` | todos os 9 módulos F6 (5-7 quiz-btn cada). O 3º argumento pode ser o texto completo da justificativa ou um id de bloco; aspas simples internas quebram a conversão — use ‘aspas curvas’. |

**Achado relevante:** outros módulos (modulo-03, 04, 06, 07, 08) usam `<canvas>` interativo mas **não** seguem a convenção `simInit/simStep/simRun/simReset`. Usam handlers próprios via `addEventListener` (sem `onclick` reconhecido). Isso é aceito pelo pipeline — `onclick` reconhecido é opcional, não obrigatório. **Use a convenção quando os botões fazem init/step/run/reset clássicos; use `addEventListener` direto quando o controle é mais customizado.**

---

## Padrão 1 — Diagrama de máquina em `<canvas>`

**Verificado em:** `modulo-02` (AFD), `modulo-03` (AFN), `modulo-08` (hierarquia de Chomsky).

**Quando usar:** o tema é uma máquina de estados / hierarquia / sistema com nós e relações que cabe em um único canvas.

**Atributos observados:**

```html
<canvas id="afd-canvas"></canvas>
<canvas id="afn-canvas"></canvas>
<canvas id="chomsky-canvas" style="height: 320px;"></canvas>
```

**Convenção:** id descritivo do tema (`<tema>-canvas`); altura inline quando o canvas precisa de espaço específico.

**Combinação típica:** canvas + 1-2 `<table>` próximas (definição formal e/ou transições) + botões de simulação (sim-btn) acima ou abaixo.

---

## Padrão 2 — Múltiplos canvases pequenos para variações do mesmo conceito

**Verificado em:** `modulo-04` (Operações: 5 canvases — union, concat, star, complement, intersection); `modulo-06` (ER, construção de Thompson: 5 canvases — base, union, concat, star + árvore).

**Quando usar:** o módulo apresenta uma operação/construção em N variantes, e cada variante merece sua própria visualização compacta.

**Atributos observados:**

```html
<!-- modulo-04 -->
<canvas id="canvas-union"></canvas>
<canvas id="canvas-concat"></canvas>
<canvas id="canvas-star"></canvas>
<canvas id="canvas-complement"></canvas>
<canvas id="canvas-intersection"></canvas>

<!-- modulo-06 (com classe utilitária .tc para padronizar tamanho) -->
<canvas id="tc-base"   class="tc" style="height:160px;"></canvas>
<canvas id="tc-union"  class="tc" style="height:180px;"></canvas>
<canvas id="tc-concat" class="tc" style="height:130px;"></canvas>
<canvas id="tc-star"   class="tc" style="height:160px;"></canvas>
```

**Convenção:** id `<grupo>-<variante>` ou `<grupo>-<sufixo>`; classe utilitária quando há um grupo coeso (ex.: `.tc` para "thompson construction"); altura inline ajustada por variante (cada construção tem altura natural diferente).

**Importante:** consulte o DS antes de adicionar `.tc` ou similar. Se não existir, abrir PR ao DS para adicionar antes de usar.

---

## Padrão 3 — Comparador antes/depois com 2 canvases em `split`

**Verificado em:** `modulo-05` (Minimização: `canvas-original` vs `canvas-minimal` lado a lado).

**Quando usar:** o módulo mostra uma transformação (minimização, otimização, conversão) e o aluno precisa ver "antes ⇄ depois" simultaneamente.

**Atributos observados:**

```html
<canvas id="canvas-original" class="min-canvas"></canvas>
<canvas id="canvas-minimal"  class="min-canvas"></canvas>
```

**Layout:** ambos canvases dentro de um wrapper com `class="split"` (2 colunas). Classe utilitária `.min-canvas` padroniza tamanho.

**Modulo-05 também usa 3 `preset-btn` com `loadPreset(...)`** — então é exemplo verificado de **preset + comparação lado-a-lado** combinados.

**Combinação típica:** preset-row no topo + 2 canvases em split + tabela de explicação.

---

## Padrão 4 — Árvore de derivação em `<canvas>`

**Verificado em:** `modulo-07` (GLC/PDA: 3 árvores — `tree-aabb`, `tree-arith`, `tree-ambig`).

**Quando usar:** estruturas recursivas (árvore de parsing, árvore de derivação, árvore de expressão).

**Atributos observados:**

```html
<canvas id="tree-aabb"  class="tree-canvas" style="height:200px;"></canvas>
<canvas id="tree-arith" class="tree-canvas" style="height:220px;"></canvas>
<canvas id="tree-ambig" class="tree-canvas" style="height:230px;"></canvas>
```

**Convenção:** id `tree-<exemplo>`; classe `.tree-canvas`; altura inline calibrada à profundidade da árvore.

**Combinação típica:** `<h4>` curto explicando o exemplo da árvore + canvas + texto comentando o que destacar.

Modulo-07 também tem `<h4>` próximo a cada canvas (ex.: "Árvore de derivação de 'aabb' — S → aSb | ε") — boa prática para contextualizar a visualização.

---

## Padrão 5 — Tabelas como suporte a definição formal

**Verificado em:** todos os 9 módulos F6 (3-7 `<table>` por módulo).

**Quando usar:** sempre. Toda definição formal, transição δ, comparação ou trace passo-a-passo é melhor servida por tabela.

**Casos observados em F6:**
- Tabela δ de transição (modulo-02, modulo-03).
- Tabela de comparação AFD vs AFN (modulo-03).
- Tabela de classes da Hierarquia de Chomsky (modulo-08).
- Tabela de operações regulares e seus fechamentos (modulo-04).
- Tabela de classes de complexidade (modulo-09).

**Convenção:** estilização vem do DS (não inline). Cabeçalho com `<thead>`, conteúdo com `<tbody>`. Em tabelas com linha "atual" durante simulação, marcar a linha viva via classe (consulte DS).

---

## Padrão 6 — Layout `split` em 2 colunas

**Verificado em:** todos os 9 módulos F6 (1-4 instâncias por módulo).

**Quando usar:** apresentar conceito + visualização lado a lado, ou comparar dois objetos relacionados.

**Estrutura:**

```html
<div class="split">
  <div>
    <!-- explicação textual -->
  </div>
  <div>
    <!-- visualização (canvas, tabela, lista) -->
  </div>
</div>
```

**Combinações observadas:**
- texto + canvas (Padrão 1).
- canvas + tabela (Padrão 5).
- canvas + canvas (Padrão 3).
- texto + lista de pontos.

---

## Padrão 7 — Quiz com `quiz-btn` e justificativa

**Verificado em:** todos os 9 módulos F6 (5-7 quiz-btn cada).

**Estrutura observada (após pipeline):**

```html
<button class="quiz-btn"
        data-question-id="q1"
        data-answer-key="B"
        data-explanation-id="expQ1">
  B) Texto da alternativa
</button>
```

Antes do pipeline (no fragmento que você entrega):

```html
<button class="quiz-btn" onclick="check('q1','B','expQ1')">B) Texto da alternativa</button>
```

O pipeline converte `onclick` em `data-*` e remove `onclick`.

**Convenção verificada:**
- 4-5 alternativas por questão.
- `data-question-id` único por questão (`q1`, `q2`, …).
- `data-answer-key` em maiúscula (`A`, `B`, `C`, `D`, `E`).
- `data-explanation-id` aponta para um elemento (ex.: `<div id="expQ1">…</div>`) com a justificativa completa — por que a correta é correta E por que cada errada falha.

---

## Resumo — qual padrão escolher

```
Tema é máquina/sistema único?              → Padrão 1 (canvas único)
Tema apresenta N variantes do mesmo?        → Padrão 2 (múltiplos canvases pequenos)
Tema mostra transformação A→B?              → Padrão 3 (split + 2 canvases)
Tema é estrutura recursiva (árvore)?        → Padrão 4 (canvas árvore)
Sempre que houver definição formal/trace.  → Padrão 5 (tabela)
Apresentar conceito + visual juntos.       → Padrão 6 (split)
Avaliação de cada módulo.                  → Padrão 7 (quiz)
```

Combinações são bem-vindas (modulo-05 combina 1 + 2 + 3 + 5 + 6 + 7 num único módulo).

## Lacunas conhecidas (a preencher quando ingerirmos)

Padrões que provavelmente existem mas **não foram ingeridos ainda no `data/study/modules/`**, portanto não posso verificar nem catalogar:

- Calculadora de fórmula matemática numérica em tempo real (input → resultado, ex.: `V − E + F = 2`).
- Comparador de 2 algoritmos no mesmo grafo (ex.: Prim vs Kruskal lado a lado).
- BFS/DFS animado com fila/pilha auxiliar visualizada.
- Pseudocódigo com linha destacada sincronizada com passo do simulador.

Quando os módulos novos chegarem ao `data/study/modules/`, atualize este catálogo extraindo os padrões reais — não invente.

## Checklist antes de entregar simulador

- [ ] Pelo menos 1 preset (idealmente 2-4) com `loadPreset('id')` se o simulador aceita entrada variável.
- [ ] Botões de controle se aplicável: init / step / run / reset (use `simInit` etc. para ganhar o `data-sim-action`, OU `addEventListener` se o controle é mais customizado).
- [ ] Canvas/SVG/tabela com id descritivo (`<tema>-canvas`, não `canvas1`).
- [ ] Funciona standalone (testar abrindo o `.html` no navegador antes de ingerir).
- [ ] JS contém TODAS as funções que `onclick` invoca — pipeline não cria stubs.
- [ ] Quiz com `data-question-id`, `data-answer-key`, `data-explanation-id` (ou via `onclick="check(...)"` antes do pipeline).

## Changelog

| Versão | Data | Mudança |
|---|---|---|
| **1.1** | 2026-05-10 | Reescrito após audit. Catálogo agora baseado SOMENTE em padrões verificados em `data/study/modules/` (F6, 9 módulos). Padrões 1-7 cada um com módulo de referência verificável. Lacunas conhecidas listadas explicitamente. |
| 1.0 | 2026-05-10 | **Descartada.** Tinha 6 padrões com 5 referências a arquivos deletados/inexistentes. Confiável apenas no Padrão 1. |
