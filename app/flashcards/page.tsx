import { getServerViewer } from '@/lib/server-viewer';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { FlashcardsPanel } from '@/components/modules/flashcards-panel';
import { StudyShell } from '@/components/study/study-shell';

export default async function FlashcardsRoutePage() {
  const viewer = await getServerViewer();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="flashcards"
        pageTitle="Flashcards"
        pageSubtitle="Revisão com repetição espaçada e dificuldade adaptativa"
        breadcrumb={['App', 'Flashcards']}
        viewer={viewer}
      >
        <FlashcardsPanel userId={viewer.userId} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
