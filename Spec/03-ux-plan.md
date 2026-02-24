# POSCOMP - Plano de UX

## Metadados
- Projeto: POSCOMP Prep App
- Project ID: `cmlydyfny003xt3zxx7r9do28`
- Status: `PLANNING`
- Business aprovado: `sim`
- Technical aprovado: `sim`
- UX aprovado: `não`
- Última atualização: `2026-02-24`

## Objetivo de Experiência
Entregar uma experiência de estudo visual e confiável, em que o usuário compreenda rapidamente o estado atual do sistema e mantenha fluxo contínuo entre teoria, simulação e prática.

## Princípios de UX
- Visibilidade total de estado (Nielsen): status inequívoco e rastreável.
- Sem mensagens conflitantes: um único estado verdadeiro por tarefa.
- Execução real sempre: sem modo simulado para pipeline de simulação.
- Erros acionáveis: explicar causa e próximo passo.
- Conteúdo em português brasileiro com acentuação correta.

## Personas
## Lucas Mendes (24) - candidato ao mestrado
- Dor: entende código, mas não visualiza bem a teoria.
- Objetivo: aprender rápido com feedback visual.

## Rafael Santos (28) - desenvolvedor autodidata
- Dor: pouco tempo e base teórica irregular.
- Objetivo: sessões curtas com alto retorno.

## Ana Paula (35) - professora universitária
- Dor: falta ferramenta didática robusta para aula.
- Objetivo: demonstrar conceitos e acompanhar evolução.

## Jornadas
## 1) Primeiro Uso (descoberta e ativação)
1. Landing com demonstração real de simulação.
2. Cadastro via Google/GitHub.
3. Onboarding em 3 passos (simular, estudar tópico, resolver exercício).
4. Primeira simulação com feedback de estado (`queued` → `running` → `completed`).
5. Salvar progresso inicial e sugerir próxima ação.

## 2) Sessão de estudo típica
1. Usuário abre dashboard e vê progresso por trilha.
2. Faz revisão rápida com flashcards.
3. Estuda um tópico com exemplos animados.
4. Resolve exercício e recebe explicação imediata.
5. Executa simulação para validar hipótese.

## 3) Upgrade para premium
1. Usuário atinge limite de recurso premium.
2. Tela de valor apresenta ganhos concretos.
3. Checkout simples via Stripe.
4. Retorno automático ao contexto anterior com recurso liberado.

## Arquitetura da Informação
```text
Dashboard
├─ Visão geral
├─ Tópicos
├─ Simulador
├─ Flashcards
├─ Exercícios
└─ Premium
```

## Navegação
- Desktop: sidebar fixa, colapsável.
- Mobile: barra inferior com 5 abas principais.
- Breadcrumb em páginas de conteúdo longo.
- Navegação sequencial com anterior/próximo nos tópicos.

## Wireframes Funcionais
## Dashboard
- cards de progresso, tempo e sequência de estudo;
- atalhos para retomar simulação e exercícios pendentes.

## Simulador Interativo
- input de expressão;
- canvas principal da máquina;
- timeline de execução;
- controles: play/pause, passo, velocidade, reset;
- histórico de execuções.

## Tópico de Estudo
- conteúdo didático + animação contextual;
- indicador de progresso no tópico;
- ação clara de concluir e avançar.

## Flashcards
- card central com flip;
- resposta por dificuldade (fácil/médio/difícil);
- barra de progresso da sessão.

## Exercícios
- filtro por tópico e dificuldade;
- feedback imediato após resposta;
- explicação e recomendação de revisão.

## Estados de Interface
## Loading
- skeleton para listas;
- spinner curto para ações rápidas;
- barra de progresso em operações longas.

## Empty
- ilustração educativa;
- CTA explícito para primeira ação;
- sugestão contextual baseada no estágio do usuário.

## Error
- erro inline com correção sugerida em formulários;
- toast para erro não crítico;
- fallback de página para erro de sistema.

## Padrão de Status da Simulação
- `queued`: "Sua simulação entrou na fila."
- `running`: "Processando expressão em tempo real."
- `completed`: "Simulação concluída."
- `failed`: "Falha ao processar. Revise a expressão ou tente novamente."
- `canceled`: "Execução cancelada pelo usuário."

Regras:
- nunca mostrar data inválida; usar `—` quando indisponível;
- timeline prioriza o último estado de cada execução;
- não exibir "concluído" junto com passo interno "running" sem contexto.

## Microcopy (PT-BR)
- Botão principal: `Simular agora`
- Erro de expressão: `Não foi possível interpretar a expressão. Verifique os operadores e tente novamente.`
- Fila: `Estamos processando sua solicitação. Você pode continuar estudando enquanto isso.`
- Paywall: `Este recurso faz parte do plano Premium.`

## Acessibilidade
- contraste mínimo WCAG AA;
- navegação completa por teclado;
- `aria-live="polite"` para atualização de status;
- descrições textuais para elementos visuais de simulação;
- hierarquia semântica de headings.

## Design Tokens
## Cores
- primária: `#3b82f6`
- secundária: `#0f766e`
- acento: `#f59e0b`
- sucesso: `#22c55e`
- alerta: `#eab308`
- erro: `#ef4444`

## Tipografia
- títulos: `Inter 600/700`
- corpo: `Inter 400`
- código/expressões: `Fira Code 400`

## Espaçamento
Escala base 4px (`4, 8, 12, 16, 24, 32, 48, 64, 96`).

## Instrumentação de UX
Eventos obrigatórios:
- `onboarding_started`
- `simulation_started`
- `simulation_completed`
- `exercise_answered`
- `paywall_viewed`
- `checkout_completed`

KPIs de experiência:
- tempo até primeira simulação concluída;
- taxa de conclusão de onboarding;
- taxa de erro por execução;
- abandono em checkout.

## Critério de Pronto (UX)
Este plano será aprovado quando:
- jornadas críticas tiverem wireframes validados;
- estados de sistema cobrirem sucesso, loading e falhas;
- cópia principal estiver revisada em PT-BR;
- critérios de acessibilidade estiverem incluídos no QA.
