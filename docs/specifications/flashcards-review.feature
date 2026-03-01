# language: pt
Funcionalidade: Sessão de flashcards no fluxo do mockup
  Como estudante do POSCOMP
  Quero revisar cartas com reveal e avaliação de dificuldade
  Para memorizar conteúdo com repetição espaçada

  Cenário: Exibir sessão de revisão com CTA de revelar resposta
    Quando eu acesso "/flashcards"
    Então devo visualizar uma carta ativa
    E devo visualizar ação "Ver resposta"
    E não devo visualizar botões de avaliação antes do reveal

  Cenário: Revelar resposta da carta atual
    Dado que existe uma carta ativa
    Quando eu clico em "Ver resposta"
    Então devo visualizar o verso da carta
    E devo visualizar os botões "Errei", "Difícil", "Bom" e "Fácil"

  Cenário: Persistir avaliação por carta
    Dado que revelei a carta atual
    Quando eu avalio como "Bom"
    Então o sistema deve registrar revisão em "POST /api/flashcards/review"
    E deve avançar para a próxima carta da fila

  Cenário: Exibir decks com estado free e premium
    Quando eu acesso "/flashcards"
    Então devo visualizar decks disponíveis
    E decks premium devem aparecer bloqueados para usuário free
