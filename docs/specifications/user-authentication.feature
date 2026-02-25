# language: pt
Funcionalidade: Autenticação de usuário com sessão persistente
  Como estudante do POSCOMP
  Quero entrar com provedores externos e manter sessão ativa
  Para continuar meus estudos e métricas entre sessões

  Cenário: Exibir landing com entrada, cadastro e demo pública
    Quando eu acesso a página inicial
    Então devo visualizar as ações "Criar conta", "Entrar" e "Ver demo do simulador"
    E devo visualizar que a demo pode ser usada sem login

  Cenário: Mostrar tela de autenticação com provedores
    Dado que o Clerk está configurado
    Quando eu acesso a rota de autenticação
    Então devo visualizar opções para login e cadastro
    E devo visualizar instrução para usar Google ou outro provedor habilitado

  Cenário: Restringir trilha completa para usuário não autenticado
    Dado que o Clerk está configurado
    E eu não estou autenticado
    Quando eu acesso a rota "/estudo"
    Então devo visualizar aviso de acesso restrito
    E devo visualizar ação para "Entrar" e "Criar conta"

  Cenário: Exibir menu de perfil para usuário autenticado
    Dado que estou autenticado
    Quando eu abro a aplicação de estudo
    Então devo visualizar o botão de perfil do usuário
    E ao abrir o menu devo visualizar "Configurações" e "Sair"

  Cenário: Encerrar sessão pelo menu de perfil
    Dado que estou autenticado
    Quando eu clico em "Sair"
    Então devo encerrar a sessão
    E devo ser redirecionado para a landing

  Cenário: Manter sessão entre recargas
    Dado que estou autenticado com Clerk
    Quando eu recarrego a aplicação
    Então devo permanecer autenticado
    E devo manter acesso à rota "/estudo" sem novo login manual
