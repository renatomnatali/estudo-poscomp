# language: pt
Funcionalidade: Navegação principal por rotas de estudo
  Como estudante do POSCOMP
  Quero navegar entre telas reais por URL
  Para acessar rapidamente cada jornada de estudo sem depender de hash local

  Cenário: Exibir menu lateral na ordem canônica do mockup
    Dado que estou em "/dashboard"
    Quando a aplicação de estudo é renderizada
    Então devo visualizar os itens "Dashboard", "Trilhas de Estudo", "Flashcards", "Exercícios", "Simulado POSCOMP" e "Seja Premium"
    E a ordem dos itens deve seguir exatamente a ordem do mockup

  Cenário: Destacar item ativo no menu por rota
    Dado que estou em "/trilhas"
    Quando a tela é renderizada
    Então o item "Trilhas de Estudo" deve aparecer como ativo
    E somente um item do menu deve estar ativo por vez

  Cenário: Navegar para rota ao clicar no menu
    Dado que estou em "/dashboard"
    Quando eu clico no item "Flashcards"
    Então devo ser navegado para "/flashcards"

  Cenário: Exibir breadcrumbs coerentes com a rota atual
    Dado que estou em "/trilhas/f6/modulo-03"
    Quando a tela é renderizada
    Então devo visualizar breadcrumb "Trilhas de Estudo > Linguagens Formais e Autômatos > Módulo 03 — AFN e epsilon-Transicoes"
    E os níveis "Trilhas de Estudo" e "Linguagens Formais e Autômatos" devem ser links clicáveis

  Cenário: Exibir navegação de atalhos no mobile
    Dado que estou em viewport mobile
    Quando eu abro "/simulado"
    Então devo visualizar drawer lateral com overlay para navegação

  Cenário: Colapsar sidebar no desktop e persistir preferência
    Dado que estou em viewport desktop
    Quando eu aciono o botão de colapso da sidebar
    Então a sidebar deve alternar entre expandida e colapsada
    E a preferência deve ser persistida no navegador

  Cenário: Exibir menu do usuário logado no rodapé da sidebar
    Dado que estou autenticado em uma rota de estudo
    Quando eu clico no bloco do usuário no final da sidebar
    Então devo visualizar as opções "Perfil", "Opções" e "Sair"
    E ao clicar em "Sair" devo executar logoff da sessão

  # Multi-curso: o menu é do site, não do curso (correção do dono, 2026-09-24)

  Cenário: Manter o menu completo ao trocar de curso
    Dado que estou com o curso "Infantil" ativo
    Quando qualquer tela da área de estudo é renderizada
    Então devo visualizar os itens "Dashboard", "Trilha Matemática", "Flashcards", "Exercícios", "Simulado POSCOMP", "Meu progresso" e "Seja Premium"
    E o item de trilhas deve apontar para a trilha do curso ativo
    E o badge de trilhas do edital ("25") e o bloco "Progresso geral" só devem aparecer no curso POSCOMP

  Cenário: Trocar de curso leva à home do curso
    Dado que estou em uma rota fora do dashboard com o curso "POSCOMP" em estudo
    Quando eu troco o curso em estudo para "Infantil" no seletor da sidebar
    Então devo ser navegado para "/dashboard"
    E o dashboard deve renderizar no contexto do curso "Infantil"

  Cenário: Renderizar páginas públicas do Infantil no padrão do site
    Dado que visito "/infantil/5-ano/matematica/fracoes" sem estar autenticado
    Quando a página é renderizada
    Então devo visualizar a sidebar com o menu de navegação completo do site
    E o seletor de curso em estudo no topo da sidebar
    E o breadcrumb do tema
    E a página deve ser servida estaticamente para buscadores
