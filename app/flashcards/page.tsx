import { auth } from '@clerk/nextjs/server';

import { isClerkEnabledServer } from '@/lib/auth-config';
import { getActiveCourseContext } from '@/lib/active-course';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { FlashcardsPanel } from '@/components/modules/flashcards-panel';
import { StudyShell } from '@/components/study/study-shell';

export default async function FlashcardsRoutePage() {
  const userId = isClerkEnabledServer()
    ? (await auth()).userId ?? undefined
    : 'local-dev-user';
  const { course, courses } = await getActiveCourseContext();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="flashcards"
        pageTitle="Flashcards"
        pageSubtitle="Revisão com repetição espaçada e dificuldade adaptativa"
        breadcrumb={['App', 'Flashcards']}
        course={course}
        courses={courses}
      >
        <FlashcardsPanel userId={userId} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
