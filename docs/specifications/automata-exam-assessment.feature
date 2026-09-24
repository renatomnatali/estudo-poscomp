# language: pt
Funcionalidade: Simulado POSCOMP por modalidade
  Como estudante do POSCOMP
  Quero iniciar um simulado parcial no fluxo do mockup
  Para praticar em formato próximo da prova

  Cenário: Exibir modalidades do simulado
    Quando eu acesso "/simulado"
    Então devo visualizar as modalidades "Simulado Parcial", "Simulado Completo" e "Simulado por Área"
    E modalidades premium devem aparecer bloqueadas para usuário free

  Cenário: Liberar modalidades premium para usuário pago
    Dado que meu entitlement premium tem origem "billing"
    Quando eu acesso "/simulado"
    Então devo conseguir iniciar "Simulado Completo"
    E devo conseguir iniciar "Simulado por Área"

  Cenário: Liberar modalidades premium para usuário VIP
    Dado que meu entitlement premium tem origem "vip"
    Quando eu acesso "/simulado"
    Então devo conseguir iniciar "Simulado Completo"
    E devo conseguir iniciar "Simulado por Área"

  Cenário: Bloquear modalidades premium no backend para usuário free
    Dado que meu entitlement premium tem origem "none"
    Quando eu tento iniciar sessão premium por chamada direta de API
    Então o backend deve responder "403"
    E a mensagem deve orientar assinatura premium ou grant VIP

  Cenário: Iniciar sessão parcial free
    Dado que selecionei "Simulado Parcial"
    Quando eu clico em "Iniciar simulado"
    Então devo iniciar uma sessão com 20 questões
    E devo visualizar timer da sessão

  Cenário: Corrigir respostas e mostrar desempenho
    Dado que existe sessão ativa de simulado
    Quando eu envio respostas
    Então o sistema deve corrigir via avaliação
    E deve exibir acurácia e recomendações de reforço

  Cenário: Registrar histórico recente de simulados
    Dado que finalizei um simulado
    Quando retorno à tela de simulado
    Então devo visualizar histórico recente com data, acurácia e duração
    E o histórico deve ser carregado do backend por usuário autenticado

  Cenário: Persistir tentativa finalizada no backend
    Dado que existe sessão ativa de simulado
    Quando eu encerro e corrijo a sessão
    Então o sistema deve registrar tentativa em "POST /api/simulado/attempts"
    E a tentativa deve conter modo, total, acertos e acurácia
