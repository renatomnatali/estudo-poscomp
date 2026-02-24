# POSCOMP - Roadmap Mestre de Cobertura

## Objetivo
Construir uma plataforma de preparação para o POSCOMP com cobertura progressiva das 3 macroáreas:

1. Fundamentos da Computação
2. Matemática
3. Tecnologia da Computação

A V1 foca em autômatos (AFD, minimização e AFN), com base nas aulas e questões de prova.

## Princípios de Priorização

1. Incidência nas provas (sinais de frequência por tópico)
2. Pré-requisitos didáticos
3. Ganho pedagógico por funcionalidade visual/interativa
4. Capacidade de validação objetiva por teste

## Fases

## Fase 0 - Fundação de conteúdo e avaliação

### Entregáveis
1. Taxonomia única de tópicos e subtópicos.
2. Matriz `conteúdo x provas x habilidades`.
3. Banco inicial de questões com rastreabilidade por ano.
4. Backlog priorizado de V1 (autômatos).

### Critério de pronto
1. Cada tópico tem fonte (aula/prova) e objetivos de aprendizagem.
2. Cada questão tem metadados mínimos (`year`, `number`, `macroArea`, `subTopic`).

## Fase 1 - V1 Autômatos

### Escopo fechado
1. Simulação AFD passo a passo.
2. Minimização de AFD.
3. AFN com epsilon e conversão AFN→AFD.
4. Exercícios com feedback e gabarito.

### Fontes
1. `aula_06`, `aula_08`, `aula_09`, `aula_10`, `aula_11`.
2. Questões de autômatos/ER/gramáticas em `caderno_2022..2025`.

### Critério de pronto
1. Usuário testa palavras (`c`, `abc`, `ababc`) com rastreio de estados.
2. Minimização retorna partições e AFD mínimo válido.
3. Conversão AFN→AFD preserva linguagem para casos de teste.
4. Questões de autômatos apresentam explicação pós-resposta.

## Fase 2 - Fundamentos restantes

### Escopo
1. Linguagens formais e gramáticas (aulas 04 e 05).
2. GLC e AP (aulas 12 e 13).
3. MT e decidibilidade (aulas 14, 15 e 16).

### Critério de pronto
1. Trilhas por subtópico com conteúdo, simulação quando aplicável e avaliação.

## Fase 3 - Matemática

### Escopo
1. Álgebra linear.
2. Geometria analítica.
3. Cálculo.
4. Discreta, lógica, combinatória, probabilidade/estatística.

### Critério de pronto
1. Questões por subárea com revisão adaptativa por erro.

## Fase 4 - Tecnologia

### Escopo
1. Algoritmos e estruturas de dados.
2. Linguagens/compiladores.
3. Grafos, BD, SO, redes e engenharia.

### Critério de pronto
1. Cobertura mínima por subárea com questões classificadas e explicações.

## Fase 5 - Consolidação

### Escopo
1. Simulados por macroárea.
2. Simulados mistos cronometrados.
3. Revisão adaptativa por lacuna.

### Critério de pronto
1. Relatório de desempenho por tema e probabilidade de acerto projetada.

## Estratégia de releases

1. Release curta por sprint com incrementos funcionais pequenos.
2. Revisão contínua por provas anuais novas.
3. Ciclo obrigatório por entrega: `mockup -> gherkin -> teste -> código -> teste`.
