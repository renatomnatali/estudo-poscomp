# language: pt
Funcionalidade: Ingestão e persistência do banco de questões POSCOMP
  Como mantenedor da plataforma de estudos
  Quero importar cadernos e gabaritos oficiais para banco de dados
  Para garantir cobertura total das questões com rastreabilidade por ano e tema

  Cenário: Ingerir questões dos cadernos 2022 a 2025
    Dado os arquivos "caderno_2022.pdf", "caderno_2023.pdf", "caderno_2024.pdf" e "caderno_2025.pdf"
    Quando eu executo o pipeline de ingestão
    Então devo obter 280 questões
    E devo obter exatamente 70 questões por ano
    E cada questão deve conter enunciado e cinco alternativas

  Cenário: Anexar gabaritos oficiais a todas as questões
    Dado os arquivos de gabarito de 2022 a 2025
    Quando o pipeline vincula respostas por "ano + número da questão"
    Então 100% das questões importadas devem possuir gabarito
    E questões anuladas devem usar o marcador "*"

  Cenário: Persistir o resultado no banco de dados
    Dado um banco PostgreSQL acessível por "DATABASE_URL"
    Quando eu executo a persistência do pipeline
    Então a tabela de questões deve ser atualizada por upsert
    E a tabela de alternativas deve refletir exatamente cinco opções por questão
    E um relatório de ingestão deve registrar totais e inconsistências

  Cenário: Servir exercícios a partir do banco
    Dado que o banco de questões está populado
    Quando eu consulto "GET /api/questions" com filtros
    Então a API deve retornar dados provenientes do banco
    E deve manter os filtros por ano, macroárea, subtópico e dificuldade

  Cenário: Corrigir questão anulada sem penalizar o estudante
    Dado uma questão com gabarito "*"
    Quando eu envio uma resposta para correção
    Então a questão deve ser considerada correta para efeito de pontuação
    E o feedback deve informar que a questão foi anulada
