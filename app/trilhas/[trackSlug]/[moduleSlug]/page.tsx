import { notFound } from 'next/navigation';

import { getServerViewer } from '@/lib/server-viewer';
import { getStudyModule, getStudyTrackCards } from '@/lib/study-data';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { ModulePage } from '@/components/study/module-page';
import { StudyShell } from '@/components/study/study-shell';

interface ModuleRouteProps {
  params: Promise<{ trackSlug: string; moduleSlug: string }>;
}

const LESSON_MODULE_SLUGS = new Set([
  'f1-1-analise-notacoes',
  'f1-2-notacoes-assintoticas',
  'f2-1-estruturas-lineares',
  'f2-2-arvores-hashing',
  'f2-3-grafos',
  'f3-1-paradigmas',
  'f4-1-linguagens-formais',
]);

export default async function TrilhasTrackModuleRoutePage({ params }: ModuleRouteProps) {
  const { trackSlug, moduleSlug } = await params;
  const moduleData = getStudyModule(moduleSlug);

  if (!moduleData) {
    notFound();
  }

  if (moduleData.trackCode.toLowerCase() !== trackSlug.toLowerCase()) {
    notFound();
  }

  const viewer = await getServerViewer();
  const isImportedLesson = LESSON_MODULE_SLUGS.has(moduleSlug);
  const trackTitle =
    getStudyTrackCards().find((track) => track.code === moduleData.trackCode)?.title ||
    `Trilha ${moduleData.trackCode}`;
  const moduleLabel = `Módulo ${String(moduleData.order).padStart(2, '0')} — ${moduleData.title}`;

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
        viewer={viewer}
      >
        <ModulePage moduleSlug={moduleSlug} userId={viewer.userId} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
