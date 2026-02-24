# POSCOMP - Plano de Negócio

## Metadados
- Projeto: POSCOMP Prep App
- Project ID: `cmlydyfny003xt3zxx7r9do28`
- Status: `PLANNING`
- Business aprovado: `sim`
- Technical aprovado: `sim`
- UX aprovado: `não`
- Última atualização: `2026-02-24`

## Resumo Executivo
POSCOMP é uma plataforma SaaS para preparação em Fundamentos da Computação, com foco em visualização interativa de máquinas teóricas (autômatos, gramáticas e máquinas de Turing). O produto resolve a principal dor de quem estuda para o exame: transformar conceitos abstratos em experiências visuais e testáveis.

## Problema
Estudantes que se preparam para o POSCOMP têm dificuldade em:
- visualizar execução de máquinas teóricas;
- conectar formalismo matemático com comportamento prático;
- manter consistência de estudo com pouco tempo diário.

## Público-Alvo
## Primário
Estudantes de graduação e profissionais que vão prestar POSCOMP para ingresso em mestrado.

## Secundário
Docentes de Teoria da Computação que buscam recurso visual para sala de aula e reforço extraclasse.

## Dores Principais
- materiais excessivamente textuais e pouco interativos;
- baixa retenção de conteúdo abstrato;
- falta de feedback imediato durante estudo.

## Proposta de Valor
"Aprenda teoria da computação vendo o algoritmo acontecer."  
A plataforma permite inserir expressões, simular execução passo a passo e consolidar aprendizado por trilhas de estudo, flashcards e exercícios no estilo POSCOMP.

## Diferenciais Competitivos
- Simulador visual com execução real (sem modo simulado).
- Integração entre teoria, prática guiada e revisão espaçada.
- UX orientada a progresso rastreável e feedback claro de estado.

## Funcionalidades
## Must-have (MVP)
- Simulação de expressões e autômatos com timeline de execução.
- Trilhas por tópico (Autômatos, ER, GLC, AP, MT, Computabilidade).
- Progresso por tópico e histórico de estudo.
- Exercícios de múltipla escolha com explicação.

## Nice-to-have (fase seguinte)
- Flashcards personalizados.
- Simulados completos no formato POSCOMP.
- Recomendação adaptativa de estudo.

## Modelo de Monetização
## Estratégia
Freemium com upgrade para Premium.

## Plano Gratuito
- acesso a tópicos essenciais;
- simulador com limites de uso;
- exercícios básicos.

## Plano Premium
- simulador avançado e histórico estendido;
- flashcards personalizados;
- trilhas completas e simulados;
- analytics de desempenho e recomendação.

## Estratégia de Plataforma
Para suportar crescimento sem gargalo do simulador, o produto adota arquitetura com fronteiras de domínio:
- `web-app` (experiência do usuário);
- `api-bff` (orquestração e autorização);
- serviços especializados para estudo, simulação, billing e analytics.

Essa decisão reduz risco de indisponibilidade geral quando há picos de simulação.

## Métricas de Sucesso
## 6 meses
- Conversão free → premium: `>= 20%`.
- Retenção mensal de usuários ativos: `>= 45%`.

## 12 meses
- Usuários ativos totais: `10.000`.
- Tempo médio semanal de estudo por usuário ativo: `>= 90 min`.
- Taxa de conclusão da trilha base: `>= 35%`.

## Go-to-Market
- aquisição orgânica em comunidades de computação e pós-graduação;
- parcerias com professores e ligas acadêmicas;
- conteúdo demonstrativo curto (simulações reais) para onboarding.

## Riscos e Mitigações
- Risco: baixa adoção inicial.
  Mitigação: foco em onboarding rápido + demonstração imediata do simulador.
- Risco: custo de infraestrutura por uso intensivo de simulação.
  Mitigação: fila assíncrona, limites por plano e cache por cenário equivalente.
- Risco: percepção de complexidade da ferramenta.
  Mitigação: trilha guiada para primeiro uso e linguagem didática em PT-BR.

## Critério de Pronto (Negócio)
O plano de negócio será considerado aprovado quando houver:
- proposta de valor validada com usuários-alvo;
- metas de receita e retenção com baseline de medição;
- estratégia freemium instrumentada em analytics.
