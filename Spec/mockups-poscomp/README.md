# Mockups POSCOMP (Navegáveis)

Protótipos em HTML/CSS para validação de fluxo e interface antes da implementação funcional.

## Objetivo

Cobrir as jornadas definidas no plano de UX:

1. Primeiro uso
2. Sessão de estudo típica
3. Upgrade para premium

E manter os padrões:

- estados inequívocos (`queued`, `running`, `completed`, `failed`, `canceled`)
- mensagens acionáveis em falhas
- textos em português brasileiro
- fallback legível para data/hora indisponível (`—`)

## Como abrir

```bash
cd Spec/mockups-poscomp
open index.html
```

Ou use servidor local:

```bash
cd Spec/mockups-poscomp
python3 -m http.server 8080
```

## Estrutura

- `index.html`: hub de navegação
- `landing/` e `onboarding/`: primeiro uso
- `dashboard/`, `topics/`, `simulator/`, `flashcards/`, `exercises/`: sessão de estudo
- `premium/`: jornada de upgrade
- `states/`: loading/empty/error
- `mobile/`: versões mobile
- `css/`: design tokens e estilos compartilhados
- `js/simulator-afd.js`: simulação AFD (demos, teclado de símbolos e execução)
- `js/automata-core.js`: algoritmos de AFD/AFN/minimização para V1
- `js/minimization-demo.js` e `js/afn-conversion-demo.js`: interações dos módulos novos
- `js/exam-automata.js`: carregamento e correção de questões POSCOMP (mock)

## Mapa rápido

- Início recomendado: `landing/01-home.html`
- Fluxo completo: `landing -> onboarding -> dashboard -> topics -> simulator (AFD, minimização, AFN→AFD) -> flashcards -> exercises -> premium -> states -> mobile`
