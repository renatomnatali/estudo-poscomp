# language: pt
Funcionalidade: Trilha F6 por módulos
  Como estudante do POSCOMP
  Quero estudar a trilha F6 em módulos navegáveis
  Para avançar por capítulos com progresso rastreável

  Cenário: Exibir catálogo de trilhas com 25 tópicos
    Quando eu acesso "/trilhas"
    Então devo visualizar o título "Trilhas de Estudo"
    E devo visualizar os filtros "Todos", "Free", "Concluídos", "Fundamentos", "Matemática" e "Tecnologia"
    E devo visualizar cards de resumo com "Tópico concluído", "Em progresso", "Bloqueados" e "Currículo coberto"
    E cada tópico deve indicar estado visual "Concluído", "Não iniciado", "Em andamento" ou "Premium"

  Cenário: Liberar trilhas com conteúdo já importado
    Dado que estou em "/trilhas"
    Quando o catálogo é carregado com arquivos source importados para "F1", "F2", "F3" e "F4"
    Então os cards "F1", "F2", "F3" e "F4" não devem aparecer com status "Premium"
    E os cards "F1", "F2", "F3" e "F4" devem aparecer com status "Não iniciado"
    E ao clicar no card "F1" devo ser navegado para "/trilhas/f1/f1-1-analise-notacoes"
    E o card "F1" deve indicar "3 módulos" e "~2h"
    E o card "F2" deve indicar "3 módulos" e "~3h"
    E o card "F3" deve indicar "1 módulo" e "~1h"
    E o card "F4" deve indicar "1 módulo" e "~1h"

  Cenário: Filtrar trilhas por tipo e por área
    Dado que estou em "/trilhas"
    Quando aplico o filtro "Free"
    Então devo visualizar apenas tópicos com selo "Free"
    E as seções sem cards visíveis devem ser ocultadas
    Quando aplico o filtro "Matemática"
    Então devo visualizar apenas a seção "Matemática para Computação"

  Cenário: Abrir módulo da trilha F6
    Dado que estou em "/trilhas"
    Quando eu abro "F6"
    Então devo ser navegado para "/trilhas/f6/modulo-01"

  Cenário: Exibir módulo 1 fiel ao mockup
    Dado que estou em "/trilhas/f6/modulo-01"
    Quando o conteúdo é carregado
    Então devo visualizar o hero "Fundamentos Matemáticos"
    E devo visualizar o resumo de progresso "Módulo 1 de 9"
    E o primeiro capítulo deve iniciar com a numeração "1"
    E devo visualizar a navegação de seções com "Por quê?" até "Resumo"
    E não devo visualizar no cabeçalho o texto "Módulo 1 de 9 — Fundamentos"
    E não devo visualizar no cabeçalho os ícones "⏱", "📐" e "🧠"
    E ao rolar a página o menu de seções deve ficar fixo no topo da área de conteúdo
    E devo visualizar no rodapé o rótulo "Progresso na trilha"
    E devo visualizar navegação inferior com "1 / 9 módulos" e ação "Próximo módulo →"

  Cenário: Executar simulador Σ* no módulo 1 importado
    Dado que estou em "/trilhas/f6/modulo-01"
    Quando clico em "Gerar Σ*" no item "Simulador — Explore o Fecho de Kleene Σ*"
    Então devo visualizar níveis de geração incluindo "n = 0" e "n = 3"
    E devo visualizar o resumo "Strings geradas (n=0 até 3)"
    Quando clico em "Limpar"
    Então o resultado do simulador deve ser limpo

  Cenário: Exibir módulo 2 importado do mockup
    Dado que estou em "/trilhas/f6/modulo-02"
    Quando o conteúdo é carregado
    Então devo visualizar o hero "Autômato Finito Determinístico"
    E devo visualizar o resumo de progresso "Módulo 2 de 9"
    E devo visualizar a navegação de seções com "Definição" até "Resumo"
    E devo visualizar navegação inferior com "2 / 9 módulos"
    E devo visualizar ação "Módulo anterior" apontando para "/trilhas/f6/modulo-01"
    E devo visualizar ação "Próximo módulo →" apontando para "/trilhas/f6/modulo-03"
    E ao clicar em "Verificar" com uma alternativa marcada devo receber feedback de correção na própria questão
    E no item "Simulador interativo de AFD" devo conseguir iniciar, executar passo a passo e executar tudo com resultado final
    E o destaque ativo no menu de seções deve acompanhar a seção atualmente em foco

  Cenário: Exibir módulos 3 a 9 importados do mockup na trilha F6
    Dado que estou em "/trilhas/f6/modulo-03"
    Quando o conteúdo é carregado
    Então devo visualizar o hero "AFN e ε-Transições"
    E devo visualizar o resumo de progresso "Módulo 3 de 9"
    E devo visualizar navegação inferior com "3 / 9 módulos"
    E devo visualizar ação "Módulo anterior" apontando para "/trilhas/f6/modulo-02"
    E devo visualizar ação "Próximo módulo →" apontando para "/trilhas/f6/modulo-04"
    Quando eu acesso "/trilhas/f6/modulo-04"
    Então devo visualizar o hero "Operações e Fechamento"
    E devo visualizar navegação inferior com "4 / 9 módulos"
    Quando eu acesso "/trilhas/f6/modulo-05"
    Então devo visualizar o hero "Minimização de AFD"
    E devo visualizar navegação inferior com "5 / 9 módulos"
    Quando eu acesso "/trilhas/f6/modulo-06"
    Então devo visualizar o hero "Expressões Regulares"
    E devo visualizar navegação inferior com "6 / 9 módulos"
    Quando eu acesso "/trilhas/f6/modulo-07"
    Então devo visualizar o hero "GLC e Autômatos de Pilha"
    E devo visualizar navegação inferior com "7 / 9 módulos"
    Quando eu acesso "/trilhas/f6/modulo-08"
    Então devo visualizar o hero "Bombeamento, Chomsky e Computabilidade"
    E devo visualizar navegação inferior com "8 / 9 módulos"
    Quando eu acesso "/trilhas/f6/modulo-09"
    Então devo visualizar o hero "P, NP, NP-Completo e Teorema de Gödel"
    E devo visualizar navegação inferior com "9 / 9 módulos"
    E devo visualizar ação "Módulo anterior" apontando para "/trilhas/f6/modulo-08"
    E não devo visualizar ação "Próximo módulo →"

  Cenário: Executar simulador AFN e builder de subconjuntos no módulo 3 importado
    Dado que estou em "/trilhas/f6/modulo-03"
    Quando eu digito "aab" no simulador AFN e clico em "Iniciar"
    E clico em "Executar"
    Então devo visualizar resultado de aceitação no simulador
    E ao clicar em "Próximo passo" na construção de subconjuntos devo visualizar uma tabela parcial de estados do AFD
    E ao clicar em "Construir tudo" devo visualizar estado final da construção

  Cenário: Corrigir questões do quiz importado com explicação completa
    Dado que estou em "/trilhas/f6/modulo-03"
    Quando eu seleciono uma alternativa na "Questão 3" e clico em "Verificar"
    Então devo visualizar feedback imediato de acerto ou erro
    E devo visualizar a explicação oficial completa importada do mockup

  Cenário: Importar mockup no padrão hero das trilhas F1 a F4
    Dado um mockup com cabeçalho ".lesson-header" usando "hero-tag", "hero-title" e "hero-sub"
    E o mockup possui breadcrumb com o título atual da aula
    Quando executo a ingestão de módulos para gerar o arquivo source
    Então o header importado deve conter badge, title e subtitle sem valores vazios
    E o progressLabel deve ser preenchido com o título atual da breadcrumb quando não houver ".progress-label"
    E a navegação de seções deve ser extraída de ".section-nav"

  Cenário: Preservar formatação visual do conteúdo importado da trilha F1
    Dado que estou em "/trilhas/f1/f1-1-analise-notacoes"
    Quando o conteúdo importado é carregado
    Então devo visualizar cartões de notação com as classes "notation-grid" e "notation-card"
    E devo visualizar blocos de prova com as classes "proof-steps" e "proof-step"
    E devo visualizar gráfico de crescimento com a classe "complexity-chart"
    E devo visualizar quiz em caixas com a classe "quiz-box"
    E devo visualizar resumo final com a classe "summary-box"

  Cenário: Explicar regra de constantes no F1.2 com intuição antes da formalização
    Dado que estou em "/trilhas/f1/f1-2-notacoes-assintoticas"
    Quando leio a seção "Regra 1 — Eliminar constantes multiplicativas"
    Então devo encontrar primeiro um bloco com o rótulo "Intuição:"
    E depois devo encontrar a formalização com o rótulo "Formalizando:"
    E devo visualizar a prova com "c = 5 e n₀ = 1"

  Cenário: Expandir tradução símbolo a símbolo na definição formal do F1.2
    Dado que estou em "/trilhas/f1/f1-2-notacoes-assintoticas"
    Quando clico em "Ver tradução símbolo a símbolo"
    Então devo visualizar uma tabela com os cabeçalhos "Símbolo", "Lê-se" e "Significa"
    E devo visualizar linhas com termos formais como "∃" e "c > 0"

  Cenário: Exibir chamada premium ao final do catálogo
    Dado que estou em "/trilhas"
    Quando termino de percorrer a página
    Então devo visualizar o banner premium com CTA "Assinar Premium →"

  Cenário: Exibir conteúdo do módulo com TOC e capítulos
    Dado que estou em "/trilhas/f6/modulo-03"
    Quando o módulo é carregado
    Então devo visualizar sumário interno com âncoras
    E devo visualizar capítulos didáticos do módulo

  Cenário: Corrigir quiz embutido do módulo
    Dado que estou no quiz de um módulo
    Quando eu envio uma alternativa
    Então devo receber feedback imediato com indicação de acerto ou erro
    E devo visualizar a explicação oficial da questão conforme o mockup importado
    E o sistema deve aceitar correção por endpoint de quiz do módulo

  Cenário: Persistir progresso de módulo
    Dado que estou autenticado
    Quando salvo progresso de um módulo
    Então devo persistir status do módulo
    E ao recarregar o módulo devo visualizar o progresso salvo
