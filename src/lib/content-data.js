const topics = [
  {
    id: 'topic-automatos-afd',
    slug: 'automatos-finitos-afd',
    title: 'Autômatos Finitos Determinísticos',
    macroArea: 'fundamentos',
    subTopic: 'afd_modelagem_execucao',
    difficulty: 'medium',
    incidence: 'high',
    learningObjectives: [
      'Modelar AFDs para linguagens regulares simples.',
      'Executar leitura símbolo a símbolo com rastreabilidade de estado.',
      'Decidir aceitação e rejeição com justificativa formal.'
    ],
    sourceLessons: [
      { pdf: 'aula_06_AutomatosFinitosDeterministicos.pdf', pageStart: 1, pageEnd: 80 }
    ]
  },
  {
    id: 'topic-automatos-min',
    slug: 'minimizacao-de-afd',
    title: 'Minimização de AFD',
    macroArea: 'fundamentos',
    subTopic: 'minimizacao_afd',
    difficulty: 'hard',
    incidence: 'high',
    learningObjectives: [
      'Eliminar estados inalcançáveis.',
      'Aplicar refinamento de partições.',
      'Comparar autômato original e minimizado.'
    ],
    sourceLessons: [
      { pdf: 'aula_08_MinimizacaoDeAFDs.pdf', pageStart: 1, pageEnd: 60 },
      { pdf: 'aula_09_ExerciciosAFD.pdf', pageStart: 1, pageEnd: 40 }
    ]
  },
  {
    id: 'topic-afn-conv',
    slug: 'afn-e-conversao-afd',
    title: 'AFN com epsilon e conversão AFN→AFD',
    macroArea: 'fundamentos',
    subTopic: 'conversao_afn_afd',
    difficulty: 'hard',
    incidence: 'high',
    learningObjectives: [
      'Calcular epsilon-fecho.',
      'Simular execução não determinística.',
      'Converter AFN para AFD por subconjuntos preservando linguagem.'
    ],
    sourceLessons: [
      { pdf: 'aula_10_AFN.pdf', pageStart: 1, pageEnd: 50 },
      { pdf: 'aula_11_AFN_parte2.pdf', pageStart: 1, pageEnd: 60 }
    ]
  }
];

function listTopics(filters = {}) {
  return topics.filter((topic) => {
    if (filters.macroArea && topic.macroArea !== filters.macroArea) return false;
    if (filters.subTopic && topic.subTopic !== filters.subTopic) return false;
    if (filters.difficulty && topic.difficulty !== filters.difficulty) return false;
    return true;
  });
}

function getTopicBySlug(slug) {
  return topics.find((topic) => topic.slug === slug) || null;
}

module.exports = {
  listTopics,
  getTopicBySlug,
};
