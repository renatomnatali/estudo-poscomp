# language: pt
Funcionalidade: Simulado POSCOMP por modalidade
  Como estudante do POSCOMP
  Quero iniciar um simulado parcial no fluxo do mockup
  Para praticar em formato próximo da prova

  Cenário: Exibir modalidades do simulado
    Quando eu acesso "/simulado"
    Então devo visualizar as modalidades "Simulado Parcial", "Simulado Completo" e "Simulado por Área"
    E modalidades premium devem aparecer bloqueadas para usuário free

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
