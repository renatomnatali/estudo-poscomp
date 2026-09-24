import type { Course } from '@/lib/courses/types';
import { getInfantilStudyEntryHref } from '@/lib/courses/infantil-catalog';

/**
 * Curso para crianças do 5º ano do ensino fundamental.
 *
 * O catálogo próprio (ano → matéria → tema → aulas) vive em
 * lib/courses/infantil-catalog.ts; as rotas públicas em /infantil.
 */
export const INFANTIL_COURSE: Course = {
  slug: 'infantil',
  name: 'Infantil · 5º ano',
  tagline: 'Matemática do 5º ano do ensino fundamental em pequenos passos',
  description:
    'Trilhas de matemática para crianças no 5º ano do ensino fundamental, com linguagem e ritmo adequados à idade. Comece pelo tema Frações: aulas gratuitas, com simuladores para ver cada fatia se mexer.',
  audience: 'Crianças no 5º ano do ensino fundamental',
  icon: '✏️',
  switcherSubtitle: 'Matemática · 5º ano · grátis',
  studyEntry: {
    label: 'Trilha Matemática',
    // Derivada do catálogo (primeiro tema) — sem duplicar a rota aqui.
    href: getInfantilStudyEntryHref(),
  },
  features: {
    simulado: false,
    flashcards: false,
    // premium: contratável por conteúdo — decisão do dono (2026-09-21),
    // registrada no PR #29 (description) e na estória APR-03 do db_Tasks
    // do aprovado.xyz (Notion). Preço e planos vêm depois, por
    // configuração; nada aqui os define.
    premium: true,
  },
  // Catálogo próprio (infantil-catalog.ts), não o study-data do POSCOMP.
  trackSource: 'future-registry',
};
