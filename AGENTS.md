# AGENTS.md

Instruções consolidadas para agentes de desenvolvimento neste repositório.

## Fonte de verdade

- Este é o documento principal de instruções para agentes.
- O arquivo `CLAUDE.md` deve permanecer alinhado a este documento.

## Projeto

- Nome: `POSCOMP`
- Objetivo: plataforma de estudo para POSCOMP com foco em visualização de máquinas teóricas.
- Referências de produto e arquitetura: pasta `Spec/`.

## Processo obrigatório (sem exceção)

Ordem fixa de trabalho:

1. `mockup`
2. `gherkin`
3. `teste` (primeiro falhando quando aplicável)
4. `código`
5. `teste` (regressão) + `lint`

Regra prática:
- Não iniciar implementação antes de atualizar mockup e cenário Gherkin.
- Gherkin é a fonte de verdade para comportamento.

## Trunk-Based Development (obrigatório)

Seguir `docs/trunk-based-development.md`.

Regras mínimas:
1. Sempre partir de `main` atualizado.
2. Branch curta e com vida curta.
3. PR pequeno (alvo `< 400` linhas).
4. Merge rápido via `squash`.
5. Evitar branches longas, `develop`, release branch e hotfix branch paralela.

### Proteção local contra push direto na trunk

Este repositório inclui hook em `.githooks/pre-push` para bloquear push direto em `main`, `master` e `trunk`.

Ative no clone local:

```bash
git config core.hooksPath .githooks
```

## Regras de qualidade

1. Não aplicar sugestão de review cegamente; validar contra Gherkin e intenção do usuário.
2. Testes devem cobrir as assertivas de comportamento (não apenas “não crashou”).
3. Todo texto visível ao usuário deve estar em português brasileiro com acentuação correta.
4. Uma tarefa por vez, evitando troca de contexto desnecessária.
5. Não trocar de branch no meio da tarefa atual.

## Padrão de design obrigatório

1. Seguir `docs/design/ui-standards.md` para qualquer alteração visual nova.
2. Botões de ação devem usar formato semi-retangular (padrão do simulador), nunca pill.
3. Chips e botões devem ter semântica visual distinta.

## Validação antes de finalizar

Quando houver ambiente Node configurado (`package.json` presente), executar:

```bash
npm test
npm run lint
```

Se `prisma/schema.prisma` for alterado, executar também:

```bash
npm run db:push
# ou fluxo de migration equivalente
```

## CI/CD e gate de schema

Se o pipeline de aplicação estiver ativo com Prisma/Postgres, manter:

1. Job `db-schema-smoke` antes de `test`, `lint` e `build`.
2. Gate com Postgres efêmero + `prisma db push`.
3. Feature com impacto de schema só é considerada pronta com gate verde.

## Convenção de commits

Formato:

```text
tipo(escopo): descrição curta
```

Tipos usuais: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.

## Padrões de UX para status e progresso

1. Visibilidade do estado do sistema sempre inequívoca e rastreável.
2. Não mostrar mensagens contraditórias na mesma tela.
3. Erro deve ser explícito e acionável.
4. Datas/horários inválidos não devem aparecer; usar fallback legível (`—`).
5. Timeline deve priorizar o último estado por tarefa.
