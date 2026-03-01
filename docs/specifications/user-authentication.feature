# language: pt
Funcionalidade: Autenticação de usuário com acesso às rotas de estudo
  Como estudante do POSCOMP
  Quero entrar com provedores externos e manter sessão ativa
  Para continuar meus estudos e métricas entre sessões

  Cenário: Exibir landing pública fiel ao mockup com CTA para dashboard
    Quando eu acesso "/"
    Então devo visualizar os blocos "hero", "logos strip", "estatísticas", "como funciona", "currículo", "passo a passo", "depoimentos", "planos", "cta final" e "footer"
    E devo visualizar CTA primário para iniciar a jornada

  Cenário: Mostrar tela de autenticação com provedores
    Dado que o Clerk está configurado
    Quando eu acesso "/entrar"
    Então devo visualizar opções para login e cadastro
    E devo visualizar instrução para usar Google ou outro provedor habilitado

  Cenário: Restringir rotas de estudo para usuário não autenticado
    Dado que o Clerk está configurado
    E eu não estou autenticado
    Quando eu acesso "/dashboard"
    Então devo visualizar aviso de acesso restrito
    E devo visualizar ações para "Entrar" e "Criar conta"

  Cenário: Permitir demo pública sem autenticação
    Quando eu acesso "/demo"
    Então devo conseguir usar o simulador em modo visitante

  Cenário: Manter sessão entre recargas nas rotas de estudo
    Dado que estou autenticado com Clerk
    Quando eu recarrego "/trilhas"
    Então devo permanecer autenticado
    E devo manter acesso à rota sem novo login manual

  Cenário: Encerrar sessão pelo menu do usuário na sidebar
    Dado que estou autenticado com Clerk
    Quando eu abro o menu de usuário no rodapé da sidebar
    E clico na ação "Sair"
    Então minha sessão deve ser encerrada
    E devo ser redirecionado para a página inicial
