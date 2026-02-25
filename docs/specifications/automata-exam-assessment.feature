# language: pt
Funcionalidade: Avaliação com questões estilo prova
  Como estudante do POSCOMP
  Quero resolver questões de autômatos por ano e tópico
  Para medir domínio e receber recomendações de revisão

  Cenário: Exibir sessão unificada de resolução
    Quando eu abro o módulo de exercícios
    Então devo visualizar filtros e questão atual no mesmo bloco principal
    E não devo visualizar lista lateral de questões como fluxo primário

  Cenário: Filtrar questões por ano e subtópico
    Dado um banco de questões com metadados de ano e subtópico
    Quando eu filtro por ano "2022" e subtópico "afd_modelagem_execucao"
    Então devo visualizar somente questões que atendem ao filtro

  Cenário: Filtrar questões por dificuldade
    Dado um banco de questões com campo de dificuldade
    Quando eu filtro por dificuldade "hard"
    Então devo visualizar somente questões classificadas como "hard"

  Cenário: Corrigir resposta com feedback explicativo
    Dado uma questão de autômatos com gabarito cadastrado
    Quando eu envio uma resposta
    Então o sistema deve informar se está correta
    E deve mostrar explicação do resultado
    E deve exibir o gabarito no mesmo bloco da questão atual

  Cenário: Navegar em fluxo linear por questão
    Dado que existe uma sessão com múltiplas questões filtradas
    Quando eu clico em "Próxima"
    Então devo visualizar a questão seguinte
    Quando eu clico em "Anterior"
    Então devo visualizar a questão anterior

  Cenário: Exibir progresso da sessão em tempo real
    Dado uma sessão de questões ativa
    Quando eu respondo uma questão
    Então o progresso deve atualizar "Respondidas" e "Corretas"
    E a barra de progresso deve refletir o percentual respondido

  Cenário: Atualizar métricas por subtópico
    Dado que resolvi um bloco de questões
    Quando a correção é finalizada
    Então o sistema deve atualizar acurácia por subtópico
    E deve destacar lacunas de desempenho
    E deve marcar status "reforçar" para subtópicos abaixo da meta

  Cenário: Recomendar próximos tópicos
    Dado que meu desempenho em "conversao_afn_afd" está abaixo da meta
    Quando o resultado do bloco é exibido
    Então o sistema deve recomendar revisão desse subtópico
    E sugerir uma lista de atividades de reforço

  Cenário: Exibir insights recolhidos por padrão
    Quando eu abro o módulo de exercícios
    Então devo visualizar "Métricas por subtópico" recolhido por padrão
    E devo visualizar "Atividades de reforço recomendadas" recolhido por padrão

  Cenário: Expor status em português brasileiro no payload
    Quando eu corrijo respostas com desempenho abaixo da meta
    Então o campo de status por subtópico deve usar "reforçar"
    E não deve usar variação sem acento
