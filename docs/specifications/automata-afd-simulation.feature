# language: pt
Funcionalidade: Simulação didática de AFD
  Como estudante do POSCOMP
  Quero simular palavras em um AFD passo a passo
  Para entender aceitação/rejeição com rastreabilidade completa

  Contexto:
    Dado que existe um AFD com estado inicial "e1"
    E estado final "e2"
    E transições "e1 --a,b--> e1" e "e1 --c--> e2"
    E estado sumidouro "e3" para transições inválidas

  Cenário: Reconhecer a palavra c
    Quando eu executo a simulação com a palavra "c"
    Então o status final deve ser "completed"
    E o resultado deve ser "ACEITA"
    E o último estado deve ser "e2"

  Cenário: Reconhecer a palavra abc
    Quando eu executo a simulação com a palavra "abc"
    Então o status final deve ser "completed"
    E o resultado deve ser "ACEITA"
    E a trilha de passos deve conter 3 transições

  Cenário: Reconhecer a palavra ababc
    Quando eu executo a simulação com a palavra "ababc"
    Então o status final deve ser "completed"
    E o resultado deve ser "ACEITA"
    E a tabela delta deve destacar a transição ativa em cada passo

  Cenário: Trocar rapidamente entre demonstrações pré-definidas
    Dado que a demo ativa é "demo-c"
    Quando eu seleciono a demo "demo-b"
    Então a expressão da máquina deve ser atualizada automaticamente
    E a expressão da linguagem deve ser atualizada automaticamente
    E a palavra de entrada padrão da demo deve ser carregada
    E o status da simulação deve voltar para "queued"

  Cenário: Rejeitar palavra com sufixo inválido
    Quando eu executo a simulação com a palavra "abca"
    Então o status final deve ser "completed"
    E o resultado deve ser "REJEITA"
    E o último estado deve ser "e3"

  Cenário: Falhar ao usar símbolo fora do alfabeto
    Quando eu executo a simulação com a palavra "abd"
    Então o status final deve ser "failed"
    E a mensagem de erro deve orientar que só são válidos os símbolos "a", "b" e "c"

  Cenário: Inserir símbolos via teclado clicável
    Dado que o foco está no campo de expressão da linguagem
    Quando eu clico no símbolo "Σ"
    E eu clico no símbolo "→"
    Então os símbolos devem ser inseridos no campo ativo na posição do cursor
