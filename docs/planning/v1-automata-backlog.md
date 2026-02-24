# Backlog V1 - Autômatos

## Objetivo da V1
Entregar módulo de autômatos para estudo orientado ao POSCOMP com:

1. Simulação AFD didática
2. Minimização de AFD
3. AFN com epsilon e conversão AFN→AFD
4. Exercícios de prova com feedback

## Épico 1 - Simulador AFD

### Histórias
1. Como estudante, quero inserir modelo e palavra para acompanhar o processamento símbolo a símbolo.
2. Como estudante, quero demos prontas para testar rapidamente sem digitar tudo.
3. Como estudante, quero teclado de símbolos para evitar erros de digitação.

### Tarefas
1. Motor de simulação determinística.
2. Visualização de estados/arestas ativas.
3. Sincronização com tabela δ.
4. Registro de trace por passo.

## Épico 2 - Minimização de AFD

### Histórias
1. Como estudante, quero ver os estados inalcançáveis removidos.
2. Como estudante, quero ver refinamento de partições até convergir.
3. Como estudante, quero comparar AFD original e minimizado.

### Tarefas
1. Algoritmo de minimização por partições.
2. Renderização da sequência de partições.
3. Renderização do autômato mínimo.

## Épico 3 - AFN e conversão

### Histórias
1. Como estudante, quero visualizar epsilon-fecho durante a execução do AFN.
2. Como estudante, quero converter AFN para AFD para entender equivalência.

### Tarefas
1. Motor de AFN com epsilon.
2. Construção por subconjuntos.
3. Tabela de mapeamento subconjunto→estado DFA.

## Épico 4 - Exercícios estilo prova

### Histórias
1. Como estudante, quero resolver questões de autômatos por ano.
2. Como estudante, quero feedback com justificativa e referência de aula.

### Tarefas
1. Dataset inicial com metadados.
2. UI de lista/filtro por ano/tópico.
3. Correção com explicação.

## Definição de pronto
1. Fluxo `mockup -> gherkin -> teste -> código -> teste` respeitado.
2. Critérios de aceite V1 atendidos.
3. Dados e interfaces documentados.
