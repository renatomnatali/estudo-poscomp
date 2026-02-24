# language: pt
Funcionalidade: Minimização de AFD
  Como estudante do POSCOMP
  Quero minimizar um AFD e visualizar as partições
  Para entender equivalência de estados e construção do autômato mínimo

  Cenário: Remover estados inalcançáveis antes de minimizar
    Dado um AFD com os estados "A", "B", "C", "D"
    E "D" não é alcançável a partir do estado inicial
    Quando eu executo a minimização
    Então o conjunto de estados considerados deve excluir "D"

  Cenário: Refinar partições até convergência
    Dado um AFD válido
    Quando eu executo a minimização
    Então deve existir ao menos uma partição inicial entre finais e não-finais
    E o algoritmo deve refinar partições até estabilizar
    E o resultado deve conter o histórico de partições
    E cada partição deve informar os blocos de estados equivalentes

  Cenário: Preservar linguagem reconhecida
    Dado um AFD original e seu AFD minimizado
    Quando eu comparo a aceitação para as palavras "c", "abc", "ababc" e "abca"
    Então os resultados de aceitação/rejeição devem ser equivalentes

  Cenário: Exibir comparação antes e depois
    Quando a minimização termina
    Então a interface deve mostrar o número de estados antes e depois
    E deve mostrar os estados mesclados por equivalência
    E deve marcar o status da execução como "completed"

  Cenário: Navegar passo a passo nas partições
    Dado que a minimização já calculou o histórico completo
    Quando eu aciono "Próxima partição"
    Então a interface deve avançar para o próximo passo do refinamento
    E ao atingir o último passo deve exibir "partições estabilizadas"

  Cenário: Rejeitar payload inválido na API de minimização
    Quando eu envio um payload sem "automaton" para "POST /api/simulator/afd/minimize"
    Então a API deve responder com status "400"
    E a mensagem deve indicar que "automaton" é obrigatório
