# CLAUDE.md

Instruções para o Claude Code neste repositório.

## Fonte de verdade

- Este arquivo está consolidado com `AGENTS.md`.
- Em caso de divergência, seguir `AGENTS.md`.

## Regras obrigatórias

1. Usar trunk-based development conforme `docs/trunk-based-development.md`.
2. Seguir sempre o fluxo: `mockup -> gherkin -> teste -> código -> teste`.
3. Tratar Gherkin como fonte de verdade para comportamento.
4. Não trocar de branch no meio da tarefa.
5. Não aplicar sugestão de review cegamente; validar contra Gherkin e intenção do usuário.
6. Garantir que textos visíveis ao usuário estejam em português brasileiro com acentuação correta.

## Qualidade e validação

- Quando houver `package.json`, rodar antes de finalizar:
  - `npm test`
  - `npm run lint`
- Se houver mudança em `prisma/schema.prisma`, aplicar schema no banco alvo (`db push` ou migration).

## Projeto

- Nome: `POSCOMP`
- Referências funcionais e técnicas: pasta `Spec/`.
