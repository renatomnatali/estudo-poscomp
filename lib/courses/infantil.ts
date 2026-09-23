import type { Course } from '@/lib/courses/types';

/**
 * Curso para crianças do 5º ano do ensino fundamental.
 *
 * O catálogo próprio deste curso (trilhas e módulos) chega nas próximas fases
 * do plano multi-curso; por ora o registry registra apenas a existência dele.
 */
export const INFANTIL_COURSE: Course = {
  slug: 'infantil',
  name: 'Infantil · 5º ano',
  tagline: 'Matemática do 5º ano do ensino fundamental em pequenos passos',
  description:
    'Trilhas de matemática para crianças no 5º ano do ensino fundamental, com linguagem e ritmo adequados à idade. O catálogo completo deste curso chega nas próximas fases.',
  audience: 'Crianças no 5º ano do ensino fundamental',
  features: {
    simulado: false,
    flashcards: false,
    // premium: contratável por conteúdo — decisão do dono (2026-09-21).
    // Preço e planos vêm depois, por configuração; nada aqui os define.
    premium: true,
  },
  // Catálogo próprio ainda não existe; registry não referencia study-data.
  trackSource: 'future-registry',
};
