# POSCOMP - Plano Técnico

## Metadados
- Projeto: POSCOMP Prep App
- Project ID: `cmlydyfny003xt3zxx7r9do28`
- Status: `PLANNING`
- Arquitetura alvo: `BFF + serviços por domínio`
- Business aprovado: `sim`
- Technical aprovado: `sim`
- UX aprovado: `não`
- Última atualização: `2026-02-24`

## Objetivos Técnicos
- Garantir simulação visual com latência previsível mesmo em picos.
- Escalar domínios de forma independente (simulação, estudo, billing).
- Manter base de código legível com fronteiras claras de responsabilidade.
- Preservar DX com TypeScript ponta a ponta e testes automatizados.

## Arquitetura de Referência
## Visão Geral
- `web-app` (Next.js 15 + React 19): UI, App Router, SSR/RSC.
- `api-bff` (Node.js com Fastify ou NestJS): autenticação, autorização, agregação e contratos públicos.
- `learning-service`: tópicos, progresso, flashcards e exercícios.
- `simulation-service`: parser, simulação, execução passo a passo e fila.
- `billing-service`: checkout, assinatura e webhooks Stripe.
- `analytics-service`: coleta de eventos e indicadores de produto.

## Fluxo
1. Cliente autentica via Clerk no `web-app`.
2. `web-app` chama apenas o `api-bff`.
3. `api-bff` orquestra chamadas síncronas e assíncronas entre serviços.
4. `simulation-service` processa jobs em fila e publica progresso.
5. `api-bff` repassa atualizações ao cliente via SSE.

## Motivo da Mudança
A arquitetura anterior (monólito modular no App Router) simplificava início, mas cria risco de acoplamento entre domínios com perfil de carga muito diferente. A nova arquitetura separa simulação (CPU-bound) de jornadas CRUD/pagamento, reduzindo blast radius e melhorando escalabilidade.

## Stack Tecnológica
## Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Canvas API + D3.js

## Backend
- Node.js 22
- API BFF: Fastify (preferência por baixo overhead)
- Serviços: Fastify/NestJS por domínio
- Prisma ORM
- PostgreSQL
- Redis (fila e cache)

## Autenticação e Autorização
- Clerk (JWT)
- OAuth Google/GitHub
- RBAC (`USER`, `ADMIN`)
- Guardas de assinatura (`FREE`, `PREMIUM`)

## Pagamentos
- Stripe Checkout
- Stripe Webhooks

## Infraestrutura
- `web-app`: Netlify ou Vercel
- Serviços + workers: Fly.io/Render (containers)
- Banco: Supabase Postgres
- Observabilidade: Sentry + OpenTelemetry + Grafana/Loki

## Organização de Repositório
```text
src/
├── apps/
│   ├── web-app/
│   └── api-bff/
├── services/
│   ├── learning-service/
│   ├── simulation-service/
│   ├── billing-service/
│   └── analytics-service/
├── packages/
│   ├── shared-types/
│   ├── auth/
│   ├── ui/
│   └── config/
└── prisma/
```

## Domínios e Responsabilidades
## `learning-service`
- catálogo de tópicos;
- progresso do usuário;
- flashcards e exercícios;
- cálculo de métricas pedagógicas.

## `simulation-service`
- validação e parse de expressão;
- execução do autômato;
- geração de snapshots de estados;
- controle de fila (`BullMQ`) e persistência de execuções.

## `billing-service`
- criação de sessão de checkout;
- sincronização de assinatura;
- cancelamento e histórico de cobrança.

## `analytics-service`
- ingestão de eventos;
- agregações para dashboards;
- exportação de métricas de produto.

## Banco de Dados
## Estratégia
- Postgres com schemas por domínio:
  - `learning`
  - `simulation`
  - `billing`
  - `analytics`
- Um único cluster no início, com possibilidade de separar por serviço conforme crescimento.

## Modelos Principais
- `User`, `UserProfile`, `Subscription`
- `Topic`, `UserProgress`, `Exercise`, `PracticeResult`
- `SimulationRun`, `SimulationStep`, `ExpressionHistory`
- `FlashcardSet`, `Flashcard`
- `UsageEvent`, `DailyAggregate`

## Índices Críticos
- progresso: `(user_id, topic_id)` único;
- simulação: `(user_id, created_at desc)`;
- billing: `(user_id, status)`;
- analytics: `(event_name, created_at)`.

## Contratos de API (BFF)
## Autenticação
- `GET /api/auth/me`
- `PUT /api/auth/profile`

## Tópicos e Progresso
- `GET /api/topics`
- `GET /api/topics/:slug`
- `POST /api/topics/:id/progress`

## Simulação
- `POST /api/simulations` cria execução
- `GET /api/simulations/:runId` consulta estado atual
- `GET /api/simulations/:runId/stream` stream de eventos SSE
- `GET /api/simulations/history` histórico do usuário

## Flashcards
- `GET /api/flashcards/sets`
- `POST /api/flashcards/sets` (premium)
- `PUT /api/flashcards/:id` (premium)

## Exercícios
- `GET /api/exercises`
- `POST /api/exercises/:id/answer`
- `GET /api/exercises/results`

## Assinatura
- `POST /api/subscription/checkout`
- `GET /api/subscription/status`
- `POST /api/subscription/cancel`

## Analytics
- `POST /api/analytics/track`
- `GET /api/analytics/progress`
- `GET /api/analytics/time-spent`

## Comunicação Entre Serviços
## Síncrona
- HTTP interno via rede privada.
- Timeouts curtos e retry com backoff no BFF.

## Assíncrona
- Redis Streams ou NATS para eventos:
  - `simulation.run.created`
  - `simulation.run.updated`
  - `subscription.updated`
  - `exercise.answered`

## Estado de Simulação
- Status permitidos: `queued`, `running`, `completed`, `failed`, `canceled`.
- Não há modo simulado: todo run representa execução real.
- Falha de infraestrutura deve retornar erro explícito e acionável.

## Segurança
- LGPD: consentimento e endpoint de exclusão de dados.
- Rate limiting:
  - autenticado: `100 req/min`
  - anônimo: `10 req/min`
- Zod para validação de input.
- Segredos em variáveis de ambiente por serviço.
- Logs sem dados pessoais sensíveis.

## Performance e SLOs
- `FCP < 1.5s`
- `LCP < 2.0s`
- `TTI < 3.0s`
- `CLS < 0.1`
- animações: `>= 55 fps`
- latência p95 BFF: `< 250ms` para endpoints não assíncronos.

## Estratégia de Testes
- Unitário: Vitest (parser, simulador, regras de progresso).
- Integração: Testing Library + testes de contrato BFF/serviços.
- E2E: Playwright para jornadas críticas.
- Performance: Lighthouse CI + testes de carga em simulação.

## CI/CD e Gates Obrigatórios
1. `db-schema-smoke` (gate obrigatório) com Postgres efêmero:
   - roda `prisma db push`;
   - valida leitura das tabelas de desenvolvimento autônomo.
2. Só após gate verde executar:
   - `npm test`
   - `npm run lint`
   - `npm run build`

## Plano de Migração
1. Extrair `simulation-service` e manter BFF no próprio Next.js temporariamente.
2. Introduzir `api-bff` dedicado e mover orquestração.
3. Separar `billing-service` e `analytics-service`.
4. Consolidar contratos e remover endpoints legados do monólito.

## Riscos Técnicos
- maior custo operacional inicial;
- necessidade de tracing distribuído desde o início;
- gestão de contratos entre serviços.

## Mitigações
- começar com 4 serviços máximos (sem fragmentação excessiva);
- versionar contratos no BFF;
- observabilidade mínima obrigatória por serviço antes de produção.
