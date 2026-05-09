# CLAUDE.md — aprovado.xyz

Instruções para o Claude Code neste repositório.

## Sobre o projeto

**aprovado.xyz** — plataforma de estudos para o exame **POSCOMP** (Pós-Graduação em Computação, organizado pela SBC anualmente). Tese central: profundidade técnica + simulação interativa + cuidado didático ocupa o cruzamento entre livros acadêmicos rigorosos (mas estáticos) e cursinhos comerciais (interativos mas rasos).

Stack: Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, Postgres (Neon), Clerk, Vitest.

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção (inclui prisma generate)
npm run lint         # ESLint
npm test             # Vitest (unit + integration + UI)
npm run test:watch   # Vitest em modo watch
npm run db:generate  # Prisma Client (após editar schema)
npm run db:push      # Aplica schema no DB sem migrations (workflow padrão)
npm run db:migrate   # Cria migration (se workflow exigir)
npm run db:studio    # Prisma Studio
```

## Workflow

1. **Sempre rode `npm test` e `npm run lint` antes de finalizar qualquer entrega.**
2. Convenção de commits: `tipo(escopo): descrição` (Conventional Commits).
3. PRs pequenos (idealmente < 400 linhas).
4. Branches curtas (max 2 dias).
5. Trunk-based development conforme `docs/trunk-based-development.md`.
6. Fluxo do produto: `mockup → gherkin → teste → código → teste`.

## Regras obrigatórias

**Regra 1 — Gherkin é a fonte de verdade para comportamento.**

Antes de implementar ou alterar qualquer comportamento, ler o `.feature` correspondente em `docs/specifications/`. Se o código diverge do Gherkin, o Gherkin define o que está correto. Se o Gherkin está outdated, atualizar Gherkin PRIMEIRO, depois código.

**Regra 2 — Não trocar de branch no meio de uma tarefa.**

Se um PR externo precisa de atenção (review pendente, CI falhou), anotar e voltar depois. Nunca fazer stash → checkout outra branch → trabalho → push → voltar. Multiplica contexto e gasta créditos sem valor.

**Regra 3 — Sugestões do Code-Reviewer são para avaliar, não aplicar cegamente.**

Quando o reviewer diz "suggestion", avaliar contra: (a) o que o Gherkin diz, (b) a intenção do usuário. Se houver conflito, o usuário decide. Nunca aplicar sugestão que muda comportamento sem validar contra as specs.

**Regra 4 — Testes devem cobrir as assertions do Gherkin.**

Se o Gherkin diz que a tela de simulado mostra "Modo: Exame Real", deve existir um teste que verifica essa assertion. Testes que verificam apenas "não crashou" não protegem contra regressões. Antes de mergear PR, cruzar referências entre assertions dos testes e cenários do `.feature` relevante.

**Regra 5 — Uma tarefa por vez.**

Não abrir PR B enquanto PR A não estiver mergeado, a menos que sejam verdadeiramente independentes. Reduz branches ativas, evita merge conflicts e confusão de contexto. Caso clássico de erro a evitar: múltiplas PRs paralelas com dependências cruzadas que não buildam isoladamente.

**Regra 6 — Todo texto visível ao usuário deve estar em português brasileiro com acentuação correta.**

Nunca gerar texto em pt-BR sem acentos (ex: "Nao" em vez de "Não", "voce" em vez de "você"). Inclui: HTML, strings de UI, mensagens de chat, labels, placeholders, títulos e botões. Nomes de arquivos, classes CSS, variáveis JS e URLs podem permanecer ASCII-safe.

**Regra 7 — Testes de UI verificam comportamento, não estilo.**

1. NUNCA `toHaveClass('bg-*'|'text-*'|'h-*'|'w-*'|'border-*'|'font-*'|'rounded-*'|'p[xy]?-*'|'m[xy]?-*')` em Vitest. Cor/tamanho/spacing são DS, não unit test.
2. NUNCA `getByText('copy literal')` para microcopy livre (títulos, labels, helpers). Use `data-testid` + asserção de comportamento.
3. **Exceções** (texto literal OK):
   - Definido em `docs/specifications/*.feature` (Regra 1).
   - Importado de `lib/copy/*` ou módulo central de strings (sem duplicar literal).
   - Mensagem de erro com semântica obrigatória ("Email inválido", "Campo obrigatório").
   - Formato de identificador (`APR-FEAT-001`).
4. Antes de escrever asserção: *"Se um designer trocar essa string/cor amanhã sem mudar JS, o teste deve quebrar?"*. Se "não", testar diferente.
5. Padrão DS: primitivas expõem `data-variant`/`data-size`/`data-state`/`data-tone`.

**Regra 8 — Orquestrador é PO; subagent é dev. Notion é a story.**

Framing: main session é o PO conversando com o dev (subagent) na hora que ele pega a story. Dev lê a story na fonte; PO dá o contexto que vive fora dela.

**O que o PO faz** (irreduzível): discovery do código existente, estado vivo do projeto (PRs em flight, branches), ADRs recentes, memórias persistentes relevantes, restrições operacionais, decisões de orquestração (PRs, ordem de merge), auditoria pós-execução 1:1 contra sub-tasks.

**O que o PO NÃO faz**: ler conteúdo bruto do Notion para reproduzir no briefing; parafrasear, simplificar ou reduzir escopo; inventar "Bloco A/B/C", "por enquanto mock".

**Estrutura do briefing** (~50 linhas):

```
## 1. Tarefa (FONTE DE VERDADE)
Use mcp__plugin_Notion_notion__notion-fetch ANTES de codar:
- Épico: <link>; Sub-tasks: <link, link, ...>
Cobrir TODAS. Ambiguidade → PARAR e reportar.

## 2. Discovery (já fiz — não recriar)
- <paths absolutos do que já existe>

## 3. Estado vivo
- Branch base, PRs em flight, ADRs recentes que afetam.

## 4. Restrições operacionais
- Pipeline congelada, vocabulário, format commit.

## 5. Entrega
Branch <padrão>, PR via gh, reportar URL + auditoria 1:1.
```

**Sequência canônica** de qualquer execução:

1. **Ler primeiro** Notion completo (épico + sub-tasks). Sem pular.
2. **Executar o que está pedido** — exatamente, sem reduzir escopo, sem inventar.
3. **Se durante execução** perceber problema não mapeado / risco / ideia melhor → **trazer para discussão antes de codar**. Não decidir sozinho.

A diferença entre "ideia melhor" (válido) e "simplificação" (proibido) é se a alternativa foi conversada **antes** ou **depois** de codar.

**Regra 9 — Atualização de status no Notion é operação ATÔMICA com o merge.**

No mesmo turno em que rodo `gh pr merge`, em paralelo via `mcp__plugin_Notion_notion__notion-update-page`:

1. **Épico** (Tasks com `[EPIC]`) → `Status: DONE` (se for o último PR do épico).
2. **Cada sub-task entregue pelo PR** → `Status: DONE`.
3. **Corpo do épico** → adicionar linha em "Entregue" com link do PR.
4. **Feature Registry** → atualizar `Status` (`📋 Planejada` → `🚧 Parcial` ou `✅ Desenvolvida`) conforme o caso.

Auditoria 1:1: cada sub-task ou foi entregue ou tem justificativa registrada. Entrega parcial = marcar só as entregues + motivo no corpo do épico. Não postergar para "batch no fim".

**Regra 10 — Toda issue/story/chore/épico no Notion tem `Product` populado.**

Ao criar **qualquer** página em Tasks (tasks operacionais, épicos `[EPIC]`), a propriedade `Product` deve ter relação para a página do produto **aprovado.xyz** (`https://www.notion.so/aprovado-xyz-3590d9578db3807ca14dc330d23458eb`). Sem `Product` setado = órfã → red flag em review.

**Regra 11 — Anatomia mínima de feature/épico novo no Notion.**

Ao criar nova entry em **Feature Registry** ou novo **épico** em Tasks (`[EPIC]`), preencher no body os 4 blocos:

1. **Por quê / Theme** — link explícito ao Theme que esta entrega realiza. Se for tech-only (sem user story direto), `⚙ Tech-only — habilita [feature/épico X]` apontando ao trabalho de produto que destrava.
2. **Story** — uma frase no formato "Como [persona], quero [ação], para [valor]". Persona referencia database `Personas`. Tech-only OK com callout do item 1.
3. **Goals** — 1-3 outcomes mensuráveis que definem sucesso. Cada um com métrica observável (não "melhorar UX" — sim "tempo médio para concluir simulado cai abaixo de 4h em 80% dos casos").
4. **Anti-goals / Out of scope** — o que esta entrega **NÃO** faz. Evita feature creep e clarifica fronteiras antes da execução.

Sub-tasks dentro do épico podem ser chore técnico sem story própria, mas o épico pai precisa ter user story (ou justificativa tech-only documentada). Entry sem os 4 blocos = órfã → red flag em review.

## Fluxo de PR (OBRIGATÓRIO)

1. Criar branch e fazer commits.
2. Criar PR via `gh pr create`.
3. **Rodar Code-Reviewer em background** ANTES de mergear.
4. **AGUARDAR o resultado do review antes de prosseguir.**
5. Se houver **blockers**: corrigir ANTES de fazer merge.
6. Somente após blockers resolvidos: `gh pr merge --squash`.

**IMPORTANTE**: NUNCA fazer merge de PR enquanto o Code-Reviewer estiver rodando ou tiver retornado blockers não resolvidos. O resultado do review DEVE ser aguardado e considerado.

## Agentes disponíveis

- `@Code-Reviewer` — orquestrador de code review (delega para especializados).
- `@Coder-TypeScript` — desenvolvimento TypeScript/Node.
- `@Security-Reviewer` — revisão de segurança (OWASP, secrets, pagamentos, auth).
- `@Architecture-Reviewer` — revisão de arquitetura, código, performance, dependências.
- `@Data-Reviewer` — revisão de schema, migrations, privacidade, environment.
- `@UX-Reviewer` — revisão de acessibilidade, i18n, experiência do usuário.
- `@ux-planner-pt` — planejamento UX/UI, jornadas, mockups HTML/CSS navegáveis.
- `@test-generator` — testes de comportamento (não de implementação).
- `@Plan` — planejamento de implementação (step-by-step plans).
- `@Explore` — busca rápida em código (read-only).

Use Task com `subagent_type` adequado.

## Estrutura do repo

```
app/                  # Next.js App Router
├── admin/            # Painel administrativo
├── api/              # API routes
├── dashboard/        # Dashboard do aluno
├── flashcards/       # Flashcards SRS
├── premium/          # Tela premium
├── simulado/         # Simulado
└── trilhas/          # Trilhas de estudo (rotas dinâmicas)
components/           # Componentes React
├── admin/
├── auth/
├── modules/
└── study/
lib/                  # Utilitários e clientes
├── admin-*           # Admin auth, types, repo
├── entitlements.ts   # Fonte única de verdade de acesso
├── server-viewer.ts  # Camada de leitura no servidor
├── flashcards-repo.ts
├── topics-repo.ts
└── simulado-attempts-repo.ts
data/study/modules/   # Source JSONs por módulo (F1-F4 ingerido)
prisma/               # Schema Prisma (workflow `db push`)
scripts/              # Scripts CLI (ingest, access-grants)
docs/specifications/  # Gherkin .feature (FONTE DE VERDADE de comportamento)
Spec/                 # Mockups e design system
├── mockup/           # HTML mockups por tela
├── aprovado_ design system/  # Design system canônico
└── import/           # Mockups em fase de ingestão
tests/
├── api/              # Tests de rotas
├── ui/               # Tests de componentes
├── unit/             # Tests unitários
└── next/             # Tests estruturais (design-standards, structure)
```

## Specs do projeto

- `docs/specifications/*.feature` — Gherkin em pt-BR, fonte de verdade de comportamento.
- `Spec/mockup/` — HTML mockups por tela do produto (canônicos).
- `Spec/aprovado_ design system/` — design system canônico (Geist tokens, neutral palette, regras de DS).
- `Spec/import/` e `Spec/mockup/import/` — mockups em fase de ingestão (não-canônicos).

Todo mockup canônico tem um `.feature` correspondente. Todo `.feature` tem testes que cobrem suas assertions (Regra 4).

## Notion (workspace aprovado.xyz)

Página raiz do produto: `https://www.notion.so/aprovado-xyz-3590d9578db3807ca14dc330d23458eb`

**Databases canônicos:**

- **Themes** — apostas estratégicas (5 atualmente).
- **Feature Registry** — features (`APR-FEAT-NNN`).
- **Tasks** — tasks operacionais e épicos (`APR-NNN [EPIC]`, padrão importado do TC).
- **Risk Log** — riscos genuínos (`APR-RISK-NNN`).
- **Decision Log** — ADRs (`APR-ADR-NNN`, MADR + Y-statement).
- **Document Hub** — strategy docs, PRDs, Vision, Pitch, Product Context.
- **Policies** — policies operacionais (`APR-POLICY-NNN`).
- **Personas** — arquétipos de usuário.

**Convenções de prefixo no título:** APR-FEAT, APR-RISK, APR-EPIC (no Tasks com marcador `[EPIC]`), APR-ADR, APR-POLICY.

**Document Hub `data_source_id`:** `3ce0d957-8db3-8372-9f95-87bc7e87cf3f`.

**Convenções de captura** (universais para qualquer database):

- Parágrafos em linha única no markdown (sem soft breaks artificiais).
- Não duplicar property↔property nem property↔body.
- Body como narrativa de contexto que NÃO cabe em property.
- Title como ID estável + nome legível.
- Relations vivem em property relation, nunca como seção "Ver também" no corpo.

## Skills globais relevantes

Skills em `~/.claude/skills/` (globais do user) que se aplicam a este produto. São carregadas automaticamente quando triggers batem na conversa:

- **`docs-risk`** — captura canônica de Risk com gate de admissão (PMBOK 8 + ISO 31000:2018), 4 critérios de admissão, matriz P×I, 5 estratégias de tratamento (Avoid/Transfer/Mitigate/Accept/Escalate), KRI vs Trigger, Owner accountability. Workspace-aware (APR-/TRC-). **Usar antes de qualquer operação no Risk Log.**

Skills futuras planejadas (criar quando demanda real aparecer): `docs-adr`, `docs-prd`, `docs-epic`, `docs-feature`, `docs-vision`, `docs-product-context`, `docs-pitch`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores antes de rodar `npm run dev`.
