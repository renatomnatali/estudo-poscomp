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
    E o diagrama do AFD deve destacar estado e aresta ativos em cada passo

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
    E o teclado contextual de símbolos está visível
    Quando eu clico no símbolo "Σ"
    E eu clico no símbolo "→"
    Então os símbolos devem ser inseridos no campo ativo na posição do cursor

  Cenário: Exibir teclado contextual apenas com campo em foco
    Quando eu abro o simulador AFD
    Então não devo visualizar o teclado de símbolos
    Quando eu foco o campo "Expressão da linguagem"
    Então devo visualizar o teclado de símbolos

  Cenário: Exibir demos como presets secundários compactos
    Quando eu abro o simulador AFD
    Então devo visualizar os presets "demo-c", "demo-b" e "demo-a"
    E os presets devem ter estilo visual secundário

  Cenário: Destacar ação principal de execução automática
    Quando eu abro o simulador AFD
    Então devo visualizar "Executar automático" como ação primária
    E as ações "Próximo passo", "Reset" e "Cancelar" devem ser secundárias

  Cenário: Exibir diagrama do AFD com labels sincronizados
    Dado que a demo ativa é "demo-c"
    Quando eu abro o simulador AFD
    Então devo visualizar os estados "e1", "e2" e "e3" no diagrama
    E devo visualizar as arestas "e1-loop", "e1-transition", "e2-e3" e "e3-loop"
    E os labels do diagrama devem refletir a demo selecionada

  Cenário: Exibir detalhes técnicos da execução sob demanda
    Quando eu abro o simulador AFD
    Então devo visualizar "Detalhes técnicos da execução" recolhido por padrão

  Cenário: Exibir perguntas didáticas recolhidas por padrão
    Quando eu abro o simulador AFD
    Então devo visualizar "Perguntas didáticas" recolhido por padrão

  Cenário: Exibir stepper mobile de etapas do simulador
    Quando eu abro o simulador AFD em viewport pequena
    Então devo visualizar os passos "1 Configurar", "2 Executar" e "3 Observar"
    Quando eu seleciono o passo "3 Observar"
    Então devo visualizar o bloco "Observar transições" como etapa ativa

  Cenário: Rejeitar payload inválido na API de simulação
    Quando eu envio um payload sem "automaton" para "POST /api/simulator/afd/run"
    Então a API deve responder com status "400"
    E a mensagem deve indicar que "automaton" e "inputWord" são obrigatórios
