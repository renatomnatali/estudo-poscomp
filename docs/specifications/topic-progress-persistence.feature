# language: pt
Funcionalidade: Persistência de progresso por módulo da trilha
  Como estudante autenticado
  Quero salvar meu avanço por módulo
  Para continuar o estudo entre sessões

  Cenário: Salvar progresso de módulo
    Dado que estou autenticado
    E estou em "/trilhas/f6/modulo-05"
    Quando envio progresso em "POST /api/study/modules/modulo-05/progress"
    Então devo receber status e pontuação salvos

  Cenário: Recarregar progresso em nova sessão
    Dado que já possuo progresso salvo em "modulo-05"
    Quando consulto "GET /api/study/modules/modulo-05/progress"
    Então devo receber o progresso persistido

  Cenário: Restringir persistência para sessão anônima
    Dado que não estou autenticado
    Quando tento salvar progresso de um módulo
    Então devo receber erro de autenticação acionável
