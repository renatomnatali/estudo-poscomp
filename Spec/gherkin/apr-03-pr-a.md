# APR-3 — PR A (schema + libs de auth): cenários Gherkin

Fonte de verdade: spec da APR-3 no board (Notion, task 1292). Diretriz do dono:
espelho da implementação do sem-cilada ("faz exatamente do jeito que tá lá"),
com as adaptações declaradas na spec (sem `createdVia`; `Role` = USER|ADMIN;
textos user-facing em pt-BR).

## Funcionalidade: política de senha

```gherkin
Funcionalidade: senha de conta
  Regra: comprimento é checado ANTES do regex (mitigação de DoS em bcrypt)

  Cenário: senha válida
    Dado que a senha tem entre 8 e 128 caracteres
    E ao menos 1 maiúscula, 1 minúscula e 1 número
    Quando a política é aplicada
    Então a senha é aceita

  Cenário: senha curta, longa demais ou sem complexidade
    Dado que a senha viola qualquer requisito
    Quando a política é aplicada
    Então a senha é rejeitada
    E a mensagem de erro informa TODOS os requisitos em português
```

## Funcionalidade: segredo do JWT

```gherkin
Funcionalidade: JWT_SECRET
  Cenário: produção com segredo fraco
    Dado que o ambiente é de produção
    E o JWT_SECRET tem menos de 32 caracteres OU entropia abaixo de 4 bits/char (e não é 64 hex)
    Quando o servidor inicia a validação do segredo
    Então a inicialização FALHA (não existe fallback em produção)

  Cenário: dev sem segredo
    Dado que o ambiente é de desenvolvimento sem JWT_SECRET
    Quando o servidor sobe
    Então um segredo efêmero é gerado para aquele boot
```

## Funcionalidade: sessão JWT validada contra o banco

```gherkin
Funcionalidade: sessão
  Cenário: token íntegro
    Dado um JWT HS256 de 1h assinado com o segredo
    E a conta existe, não está excluída, com senha e papel inalterados
    Quando a sessão é validada
    Então a sessão é aceita com o papel lido do banco

  Cenário: troca de senha vence o token
    Dado um JWT emitido em um instante T
    E a senha da conta foi trocada em T ou DEPOIS de T (mesmo segundo inclusive)
    Quando a sessão é validada
    Então a sessão é REJEITADA — a troca vence (desigualdade: floor(passwordChangedAt/1000) >= iat)

  Cenário: conta excluída (soft-delete) ou papel divergente
    Quando a sessão é validada
    Então a sessão é rejeitada
```

## Funcionalidade: proteção dos fluxos de auth

```gherkin
Funcionalidade: proteção
  Cenário: POST vindo de outro site
    Dado um POST com o cabeçalho Sec-Fetch-Site apontando origem estranha (ex.: "evil.com")
    Quando a verificação CSRF roda
    Então a requisição é bloqueada com 403

  Cenário: POST sem o cabeçalho Sec-Fetch-Site
    Dado um POST de cliente legado (curl/server-side) que não envia o cabeçalho
    Quando a verificação CSRF roda
    Então a requisição PASSA e o evento CSRF_HEADER_ABSENT é registrado no log de segurança

  Cenário: limite de tentativas excedido
    Dado que o IP já fez o limite de chamadas no minuto para o fluxo
    Quando a próxima chamada chega
    Então responde 429

  Cenário: falha do Redis com fail-closed
    Dado um limitador fail-closed com Upstash em uso
    E o Redis está fora
    Quando a próxima chamada chega
    Então a chamada é NEGADA (não liberada)

  Cenário: Turnstile em produção sem chave
    Dado que o ambiente é de produção
    E TURNSTILE_SECRET_KEY não está configurada
    Quando a verificação Turnstile roda
    Então a verificação FALHA (fail-closed por desenho)
```

## Funcionalidade: e-mail normalizado

```gherkin
Funcionalidade: e-mail
  Cenário: e-mail com espaços e maiúsculas
    Dado "  Fulano@Exemplo.COM  "
    Quando o e-mail é normalizado
    Então vira "fulano@exemplo.com" (chave única do banco)
```
