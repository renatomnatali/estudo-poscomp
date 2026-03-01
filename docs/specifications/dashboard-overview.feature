# language: pt
Funcionalidade: Dashboard de estudo fiel ao mockup
  Como estudante do POSCOMP
  Quero abrir o dashboard com visão consolidada de progresso
  Para iniciar a próxima sessão de estudo com contexto claro

  Cenário: Exibir cabeçalho com saudação e CTA de continuidade
    Dado que estou em "/dashboard"
    E estou autenticado como "Renato Natali"
    Quando o dashboard é carregado
    Então devo visualizar a saudação "Bom dia, Renato Natali"
    E devo visualizar o CTA "Continuar estudando"

  Cenário: Exibir hero de transição para próximo tópico
    Dado que estou no dashboard
    Quando a área principal é renderizada
    Então devo visualizar o hero com o título "Pronto para o próximo tópico?"
    E devo visualizar as ações "Começar F1" e "Ver currículo"

  Cenário: Exibir cartões de métricas principais
    Dado que estou no dashboard
    Quando os dados de resumo são carregados
    Então devo visualizar 4 cartões de estatísticas
    E devo visualizar os blocos "Módulos concluídos", "Currículo coberto", "Simulados realizados" e "Sequência de estudo"

  Cenário: Exibir grade com trilhas, atividade e widgets laterais
    Dado que estou no dashboard
    Quando a grade principal é renderizada
    Então devo visualizar o card "Trilhas de estudo"
    E devo visualizar o card "Atividade — últimas 4 semanas"
    E devo visualizar o card "Cobertura por área"
    E devo visualizar o widget de flashcards com CTA "Revisar agora"
    E devo visualizar o card "Próximas ações"
