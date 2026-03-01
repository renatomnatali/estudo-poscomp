# API Contracts V2 (Tópicos Didáticos)

## GET /api/content/topics

Lista tópicos com metadados pedagógicos.

### Query params
1. `macroArea` (`fundamentos|matematica|tecnologia`)
2. `subTopic` (string)
3. `difficulty` (`easy|medium|hard`)
4. `incidence` (`high|medium|low`)
5. `limit` (number)

## GET /api/content/topics/:slug

Retorna conteúdo completo do tópico:
1. seções (`essential`, `advanced`)
2. exemplos resolvidos
3. aplicação real
4. referências
5. quick-check

## GET /api/content/topics/:slug/quick-check

Retorna somente os itens de quick-check do tópico.

## POST /api/content/topics/:slug/progress

Salva progresso do tópico para o usuário.

### Body
```json
{
  "userId": "user-123",
  "status": "completed",
  "score": 1
}
```

### Status válidos
1. `not_started`
2. `in_progress`
3. `completed`

## GET /api/content/topics/:slug/progress

Consulta progresso salvo para usuário.

### Query params
1. `userId` (string)
