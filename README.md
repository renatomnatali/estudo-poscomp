# estudo-poscomp

Aplicação V1 de estudo para POSCOMP com foco em autômatos.

## Funcionalidades (V1)

1. Simulação didática de AFD com execução passo a passo.
2. Minimização de AFD com histórico de partições.
3. Conversão AFN (com ε) para AFD por subconjuntos.
4. Questões estilo POSCOMP com filtros, correção e métricas por subtópico.
5. Autenticação com Clerk (login/cadastro + sessão persistente) com demo pública sem login.

## Arquitetura atual

1. Frontend: Next.js 15 (App Router) em `app/` e `components/`.
2. BFF/API: Route Handlers em `app/api/*`.
3. Núcleo de algoritmos: TypeScript em `lib/automata-core.ts`.
4. Banco de questões persistente em PostgreSQL via Prisma.
5. Fallback local de questões: `data/questions/automata/poscomp-automata-v1.json`.

Ingestão oficial de questões:

```bash
npm run questions:ingest:dry
npm run questions:ingest
```

## Como rodar

```bash
npm install
npm run dev
```

Abra: `http://localhost:3000`

Rotas principais:

1. `/` landing pública.
2. `/entrar` login.
3. `/cadastro` criação de conta.
4. `/estudo` aplicação completa (protegida quando Clerk está configurado).
5. `/demo` simulador em modo visitante.

Variáveis para Clerk (opcional em desenvolvimento local):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

## Testes e lint

```bash
npm test
npm run lint
```
