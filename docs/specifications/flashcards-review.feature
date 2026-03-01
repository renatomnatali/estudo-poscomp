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

  Cenário: Persistir revisão com id do usuário autenticado
    Dado que Clerk está habilitado e existe sessão ativa
    Quando eu acesso "/flashcards"
    Então o painel de flashcards deve receber o id do usuário autenticado
    E avaliações devem ser persistidas no histórico do mesmo usuário

  Cenário: Encerrar sessão ao avaliar a última carta
    Dado que existe apenas uma carta na fila de revisão
    Quando eu revejo a resposta e avalio a carta
    Então devo visualizar a mensagem "Sessão concluída. Volte amanhã para novas revisões."
    E não devo conseguir avaliar a mesma carta novamente

  Cenário: Exibir decks com estado free e premium
    Quando eu acesso "/flashcards"
    Então devo visualizar decks disponíveis
    E decks premium devem aparecer bloqueados para usuário free
