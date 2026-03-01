import { auth } from '@clerk/nextjs/server';

import { isClerkEnabledServer } from '@/lib/auth-config';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { FlashcardsPanel } from '@/components/modules/flashcards-panel';
import { StudyShell } from '@/components/study/study-shell';

export default async function FlashcardsRoutePage() {
  const userId = isClerkEnabledServer()
    ? (await auth()).userId ?? undefined
    : 'local-dev-user';

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="flashcards"
        pageTitle="Flashcards"
        pageSubtitle="Revisão com repetição espaçada e dificuldade adaptativa"
        breadcrumb={['App', 'Flashcards']}
      >
        <FlashcardsPanel userId={userId} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
