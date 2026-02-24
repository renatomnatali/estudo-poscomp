# estudo-poscomp

Aplicação V1 de estudo para POSCOMP com foco em autômatos.

## Funcionalidades (V1)

1. Simulação didática de AFD com execução passo a passo.
2. Minimização de AFD com histórico de partições.
3. Conversão AFN (com ε) para AFD por subconjuntos.
4. Questões estilo POSCOMP com filtros, correção e métricas por subtópico.

## Arquitetura atual

1. Frontend: HTML/CSS/JS em `src/web`.
2. BFF/API: Express em `src/server.js`.
3. Núcleo de algoritmos: `src/lib/automata-core.js`.
4. Base de questões: `data/questions/automata/poscomp-automata-v1.json`.

Observação: esta versão não usa banco de dados; dados de conteúdo/questões estão em arquivo e métricas de sessão ficam em memória.

## Como rodar

```bash
npm install
npm run dev
```

Abra: `http://localhost:4173`

## Testes e lint

```bash
npm test
npm run lint
```
