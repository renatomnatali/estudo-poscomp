# Paridade Mockup ↔ Implementação

## Objetivo

Sincronizar, por módulo, o que é referência de produto entre mockups HTML e app Next.js para evitar divergência de jornada.

## Regra de referência por módulo (vigente)

1. Autenticação, menu lateral, estados de sessão e rotas públicas: **App real**.
2. Simulador AFD (UX V2): **App real** + mockups como apoio visual.
3. Flashcards (UX simplificada): **App real** + mockup sincronizado.
4. Exercícios e Tópicos: **App real**.
5. Dashboard e Premium: **App real** + mockups sincronizados.

## Divergências mapeadas

| Módulo | Situação atual | Fonte escolhida | Ação |
|---|---|---|---|
| Sidebar/Auth | ✅ sincronizado | App real | Mockups atualizados com estado autenticado e menu de usuário |
| Landing/Auth | ✅ sincronizado | App real | Links mockup alinhados a `/entrar`, `/cadastro`, `/demo`, `/estudo` |
| Flashcards | ✅ sincronizado | App real | Fluxo simples refletido no mockup |
| Dashboard | ✅ sincronizado | `Spec/mockup` | Composição e topbar refatoradas para paridade com `dashboard.html` |
| Módulos F6 | 🔄 em ajuste | `Spec/mockup` | Implementar paridade por módulo (início em `modulo-01.html`) |
| Premium | ✅ sincronizado | App real | Módulo implementado no app e mockup atualizado |
| Exercícios | ✅ sincronizado | App real | Mockup em sessão única com runner e métricas |
| Trilhas | ✅ sincronizado | `Spec/mockup` | Catálogo refatorado com filtros, seções por área e status visuais do `trilhas.html` |
| Tópicos | ✅ sincronizado | App real | Mockup com catálogo, detalhe, quick-check, progresso e relacionadas |

## Sequência de execução

1. Mockups de auth/menu/logado.
2. Gherkin e testes de flashcards novos.
3. Migração do módulo de flashcards no app.
4. Dashboard e Premium no app.
5. Atualização final dos mockups de Exercícios e Tópicos.
6. Conclusão parcial em 2026-02-27; dashboard revalidado e sincronizado em 2026-03-01.

## Checklist de aceite por etapa

1. Mockup refletindo estado autenticado + visitante quando aplicável.
2. Gherkin cobrindo jornada real da tela.
3. Testes UI alinhados ao Gherkin (sem asserts legados).
4. `npm test`, `npm run lint`, `npm run build` verdes.
