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

  Cenário: Executar rotas com auth sem erro de middleware do Clerk
    Dado que o Clerk está configurado
    Quando eu acesso "/dashboard"
    Então a aplicação deve possuir middleware Next com clerkMiddleware ativo
    E a rota não deve falhar com erro "auth() was called but Clerk can't detect usage of clerkMiddleware()"

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

  Cenário: Resolver plano do usuário com fonte de entitlement
    Dado que estou autenticado com Clerk
    Quando a aplicação resolve meu perfil de estudo
    Então o sistema deve retornar "isPremium"
    E deve retornar a origem do acesso premium como "billing", "vip" ou "none"
    E o plano exibido na sidebar deve refletir "Plano Free", "Plano Premium" ou "Plano VIP"

  Cenário: Conceder acesso VIP manual sem pagamento
    Dado que existe uma concessão ativa de acesso com tipo "vip" para meu usuário
    Quando eu acesso rotas premium
    Então devo ter os mesmos privilégios de um usuário premium pago
    E a origem do entitlement deve ser "vip"

  Cenário: Priorizar segurança quando assinatura expira
    Dado que minha assinatura premium está "expired" ou "canceled"
    E não existe concessão VIP ativa
    Quando eu acesso recursos premium
    Então o sistema deve me tratar como "Plano Free"
    E devo visualizar bloqueio explícito de funcionalidades premium

  Cenário: Administrar usuários VIP por tela interna
    Dado que estou autenticado como administrador
    Quando eu acesso "/admin/usuarios"
    Então devo visualizar listagem de usuários com plano e origem de entitlement
    E devo visualizar ação "Marcar VIP" para usuários free
    E devo visualizar ação "Desmarcar VIP" para usuários com grant VIP ativo

  Cenário: Conceder e revogar VIP pela tela administrativa
    Dado que estou em "/admin/usuarios"
    Quando marco um usuário free como VIP
    Então o backend deve criar um grant com scope "premium_access" e tipo "vip"
    E a listagem deve atualizar o usuário para "Plano VIP"
    Quando desmarco um usuário VIP
    Então o backend deve revogar o grant VIP ativo
    E a listagem deve atualizar o usuário para o plano resolvido sem o grant
