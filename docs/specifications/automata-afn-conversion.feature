# language: pt
Funcionalidade: Conversão de AFN para AFD
  Como estudante do POSCOMP
  Quero converter um AFN com epsilon para AFD
  Para compreender equivalência entre modelos

  Cenário: Calcular epsilon-fecho do estado inicial
    Dado um AFN com transições epsilon
    Quando eu inicio a conversão
    Então o estado inicial do AFD deve corresponder ao epsilon-fecho do estado inicial do AFN

  Cenário: Construir estados do AFD por subconjuntos
    Dado um AFN válido
    Quando eu executo a conversão AFN→AFD
    Então cada estado do AFD deve representar um subconjunto de estados do AFN
    E a tabela de mapeamento subconjunto→estado deve ser exibida
    E o estado inicial do AFD deve ser o subconjunto inicial normalizado

  Cenário: Definir estados finais do AFD convertido
    Quando a conversão termina
    Então todo estado do AFD que contém ao menos um estado final do AFN deve ser final

  Cenário: Preservar linguagem no convertido
    Dado o AFN e o AFD convertido
    Quando eu testo as palavras "ab", "aab", "bbb"
    Então o resultado de aceitação deve coincidir entre os dois autômatos

  Cenário: Testar palavra sem conversão prévia explícita
    Dado que não há resultado de conversão carregado na sessão
    Quando eu clico em "Testar ab"
    Então o sistema deve converter o AFN automaticamente
    E deve registrar o resultado da palavra "ab" na tabela de validação

  Cenário: Exibir status de execução da conversão
    Quando a conversão termina sem erro
    Então o status da execução deve ser "completed"
    E o log deve registrar o total de estados gerados no AFD

  Cenário: Rejeitar payload inválido na API de conversão
    Quando eu envio um payload sem "automaton" para "POST /api/simulator/afn/convert"
    Então a API deve responder com status "400"
    E a mensagem deve indicar que "automaton" é obrigatório
