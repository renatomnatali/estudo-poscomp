import { notFound } from 'next/navigation';

import { isClerkEnabledServer } from '@/lib/auth-config';
import { getStudyModule, getStudyTrackCards } from '@/lib/study-data';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { ModulePage } from '@/components/study/module-page';
import { StudyShell } from '@/components/study/study-shell';

interface ModuleRouteProps {
  params: Promise<{ moduleSlug: string }>;
}

const LESSON_MODULE_SLUGS = new Set([
  'modulo-01',
  'modulo-02',
  'modulo-03',
  'modulo-04',
  'modulo-05',
  'modulo-06',
  'modulo-07',
  'modulo-08',
  'modulo-09',
]);

const CANONICAL_MODULE_TITLES: Record<string, string> = {
  'modulo-01': 'Fundamentos Matemáticos',
  'modulo-02': 'Autômato Finito Determinístico',
  'modulo-03': 'AFN e ε-Transições',
  'modulo-04': 'Operações e Fechamento',
  'modulo-05': 'Minimização de AFD',
  'modulo-06': 'Expressões Regulares',
  'modulo-07': 'GLC e Autômatos de Pilha',
  'modulo-08': 'Bombeamento, Chomsky e Computabilidade',
  'modulo-09': 'P, NP, NP-Completo e Teorema de Gödel',
};

export default async function TrilhasF6ModuleRoutePage({ params }: ModuleRouteProps) {
  const { moduleSlug } = await params;
  const moduleData = getStudyModule(moduleSlug);

  if (!moduleData) {
    notFound();
  }

  const userId = isClerkEnabledServer() ? undefined : 'local-dev-user';
  const isImportedLesson = LESSON_MODULE_SLUGS.has(moduleSlug);
  const canonicalModuleTitle = CANONICAL_MODULE_TITLES[moduleSlug] || moduleData.title;
  const trackTitle =
    getStudyTrackCards().find((track) => track.code === moduleData.trackCode)?.title ||
    `Trilha ${moduleData.trackCode}`;
  const moduleLabel = `Módulo ${String(moduleData.order).padStart(2, '0')} — ${canonicalModuleTitle}`;

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="trilhas"
        pageTitle={moduleData.title}
        pageSubtitle={moduleData.subtitle}
        breadcrumb={[
          { label: 'Trilhas de Estudo', href: '/trilhas' },
          { label: trackTitle, href: '/trilhas' },
          { label: moduleLabel },
        ]}
        topbarMode={isImportedLesson ? 'lesson' : 'default'}
        contentMode={isImportedLesson ? 'flush' : 'default'}
        mainVariant={isImportedLesson ? 'lesson' : 'default'}
        searchPlaceholder={isImportedLesson ? null : undefined}
      >
        <ModulePage moduleSlug={moduleSlug} userId={userId} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
