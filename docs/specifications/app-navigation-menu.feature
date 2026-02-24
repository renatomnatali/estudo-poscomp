# language: pt
Funcionalidade: Navegação principal por menu lateral
  Como estudante do POSCOMP
  Quero navegar pelos módulos pelo menu principal
  Para acessar rapidamente cada jornada de estudo

  Cenário: Exibir menu lateral na ordem canônica do mockup
    Quando eu abro a aplicação no desktop
    Então devo visualizar os itens "Dashboard", "Tópicos", "Simulador", "Flashcards", "Exercícios" e "Premium"
    E a ordem dos itens deve seguir exatamente a ordem do mockup

  Cenário: Destacar item ativo no menu
    Dado que estou no módulo "Simulador"
    Quando a tela é renderizada
    Então o item "Simulador" deve aparecer como ativo
    E somente um item do menu deve estar ativo por vez

  Cenário: Trocar módulo ao clicar no menu
    Dado que o item ativo atual é "Simulador"
    Quando eu clico em "Exercícios"
    Então o item "Exercícios" deve ficar ativo
    E o módulo de questões deve ser exibido

  Cenário: Exibir navegação de atalhos no mobile
    Quando eu abro a aplicação em viewport pequena
    Então devo visualizar atalhos inferiores para "Dashboard", "Tópicos", "Simulador", "Exercícios" e "Premium"
