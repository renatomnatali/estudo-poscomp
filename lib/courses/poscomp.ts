import type { Course } from '@/lib/courses/types';

/**
 * Curso fundador do aprovado.xyz: todo o catálogo atual de study-data
 * (trilhas, tópicos e módulos do edital) pertence a ele.
 */
export const POSCOMP_COURSE: Course = {
  slug: 'poscomp',
  name: 'POSCOMP',
  tagline: 'Estude para o POSCOMP de um jeito que faz sentido',
  description:
    'Preparação para o POSCOMP, o exame nacional usado como critério de ingresso em programas de pós-graduação em Computação no Brasil. Trilhas visuais pelos tópicos do edital, simulados no formato do exame e flashcards com repetição espaçada — tudo em português.',
  audience: 'Candidatos a mestrado e doutorado em Computação',
  features: {
    simulado: true,
    flashcards: true,
    premium: true,
  },
  trackSource: 'study-data',
};
