# APR-3 — PR B (rotas /api/auth/* + telas): cenários Gherkin

Fonte de verdade: spec da APR-3 no board (Notion, task 1292) — 9 rotas com os
limiters do sem-cilada (register 5/min · verify-email 5/min · resend-verification
2/min · login 10/min · forgot 3/min · reset 5/min · set 5/min). Regras de fundação
(senha, JWT, CSRF, rate limit, Turnstile, e-mail) já cobertas em `apr-03-pr-a.md`.

## Funcionalidade: cadastro (register)

```gherkin
Funcionalidade: criar conta
  Cenário: cadastro válido
    Dado e-mail válido e senha dentro da política
    Quando o cadastro é enviado (com desafio anti-bot válido)
    Então a conta é criada com passwordChangedAt = agora
    E um token de verificação de 24h é gerado
    E um e-mail de verificação é enviado
    E a resposta é "verifique seu e-mail" SEM sessão (sem login automático)

  Cenário: e-mail já cadastrado com senha
    Quando o cadastro é enviado
    Então a resposta é explícita de "já cadastrado" (decisão de produto do espelho)

  Cenário: e-mail normalizado antes de tudo
    Dado "  Fulano@Exemplo.COM  "
    Quando o cadastro é enviado
    Então a busca e a gravação usam "fulano@exemplo.com"

  Cenário: cadastro acima do limite
    Dado o IP já fez 5 cadastros no minuto
    Quando o próximo chega
    Então 429
```

## Funcionalidade: verificação de e-mail

```gherkin
Funcionalidade: verificar e-mail
  Cenário: token válido e não expirado
    Quando o link do e-mail é aberto / o token é enviado
    Então emailVerified é gravado com data
    E o token não pode ser reusado

  Cenário: token inválido, expirado ou já usado
    Então a verificação falha com mensagem clara
    E a conta não muda

  Cenário: reenvio da verificação
    Dado uma conta ainda não verificada
    Quando pede reenvio (2/min por IP)
    Então novo e-mail com novo token é enviado para o dono do endereço
    E a resposta não revela se o e-mail existe
```

## Funcionalidade: login

```gherkin
Funcionalidade: entrar
  Cenário: credenciais válidas e e-mail verificado
    Quando entra
    Então cookie de sessão httpOnly de 1h é emitido
    E a resposta traz {id, email, emailVerified, role}

  Cenário: credenciais erradas OU conta inexistente
    Então 401 genérico (mesma resposta e mesmo tempo para os dois casos — dummy compare)

  Cenário: e-mail não verificado
    Então 403 com instrução para verificar/reenviar o link

  Cenário: 11ª tentativa no minuto
    Então 429

  Cenário: POST vindo de outro site
    Então 403 (CSRF) antes de qualquer lógica
```

## Funcionalidade: sessão corrente

```gherkin
Funcionalidade: quem eu sou
  Cenário: com sessão válida
    Então /api/auth/me devolve os dados da conta

  Cenário: sem sessão
    Então 204 (sem erro — tela decide o que mostrar)

  Cenário: logout
    Então o cookie é limpo
```

## Funcionalidade: recuperação de senha

```gherkin
Funcionalidade: esqueci a senha
  Cenário: esqueci com e-mail existente
    Então e-mail com link de redefinição (token único, expiração)

  Cenário: esqueci com e-mail inexistente
    Então a MESMA resposta genérica (sem oráculo de enumeração)

  Cenário: redefinição válida
    Quando a nova senha (dentro da política) é enviada com token válido
    Então a senha é trocada em transação com o uso do token
    E passwordChangedAt = agora (sessões antigas morrem)
    E emailVerified é promovido se ainda nulo (posse do link prova o e-mail)

  Cenário: token inválido, expirado ou já usado
    Então 400 sem nenhuma troca

  Cenário: redefinir acima do limite
    Dado 5 redefinições no minuto no IP
    Então 429
```

## Funcionalidade: telas

```gherkin
Funcionalidade: telas de conta
  Cenário: /entrar
    Dado visitante sem sessão
    Então vê formulário com widget do desafio anti-bot
    Dado visitante com sessão
    Então é levado ao /dashboard

  Cenário: /cadastro
    Então cria conta e vê "verifique seu e-mail" (sem entrar)

  Cenário: /verificar-email com token na URL
    Então consome o token e mostra o resultado (confirmado ou falha com reenvio)

  Cenário: /esqueci-senha e /redefinir-senha
    Então seguem os fluxos acima com mensagens em português com acento
```
