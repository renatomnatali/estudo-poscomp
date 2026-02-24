# API Contracts V1 (BFF)

## GET /api/content/topics

Retorna lista de tópicos com incidência e progresso.

### Query params
- `macroArea` (`fundamentos|matematica|tecnologia`)
- `subTopic` (string)
- `difficulty` (`easy|medium|hard`)

### Response 200
```json
{
  "items": [
    {
      "id": "topic-automatos-afd",
      "slug": "automatos-finitos-afd",
      "title": "Autômatos Finitos Determinísticos",
      "macroArea": "fundamentos",
      "subTopic": "afd_modelagem_execucao",
      "difficulty": "medium"
    }
  ]
}
```

## GET /api/content/topics/:slug

Retorna detalhes da trilha (unidades de aula, objetivos e links de exercícios).

## GET /api/questions

Retorna questões filtradas.

### Query params
- `year` (number)
- `macroArea`
- `subTopic`
- `difficulty`
- `limit`

## POST /api/simulator/afd/run

Executa simulação de AFD.

### Body
```json
{
  "automaton": {
    "alphabet": ["a", "b", "c"],
    "states": ["e1", "e2", "e3"],
    "initialState": "e1",
    "acceptStates": ["e2"],
    "transitions": {
      "e1": {"a": "e1", "b": "e1", "c": "e2"},
      "e2": {"a": "e3", "b": "e3", "c": "e3"},
      "e3": {"a": "e3", "b": "e3", "c": "e3"}
    }
  },
  "inputWord": "ababc"
}
```

## POST /api/simulator/afd/minimize

### Body
```json
{
  "automaton": {
    "alphabet": ["a", "b", "c"],
    "states": ["e1", "e2", "e3"],
    "initialState": "e1",
    "acceptStates": ["e2"],
    "transitions": {
      "e1": {"a": "e1", "b": "e1", "c": "e2"},
      "e2": {"a": "e3", "b": "e3", "c": "e3"},
      "e3": {"a": "e3", "b": "e3", "c": "e3"}
    }
  }
}
```

### Response 200
- `original`
- `reachableStates`
- `partitions`
- `minimized`

## POST /api/simulator/afn/convert

Converte AFN (com epsilon) para AFD.

### Body
```json
{
  "automaton": {
    "alphabet": ["a", "b"],
    "states": ["q0", "q1", "q2"],
    "initialState": "q0",
    "acceptStates": ["q2"],
    "transitions": {
      "q0": {"a": [], "b": [], "ε": ["q1"]},
      "q1": {"a": ["q1"], "b": ["q2"], "ε": []},
      "q2": {"a": [], "b": [], "ε": []}
    }
  }
}
```

### Response 200
- `subsetMap`
- `dfa`

## POST /api/assessment/submit

Submete respostas e atualiza métricas.

### Body
```json
{
  "attemptId": "attempt-1",
  "answers": [
    {"questionId": "q-2022-40", "choice": "D"}
  ]
}
```

### Response 200
- `score`
- `byTopic`
- `recommendedNextTopics`
- `recommendedActivities`
