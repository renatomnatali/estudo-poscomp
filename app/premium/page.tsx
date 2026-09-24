import { getActiveCourseContext } from '@/lib/active-course';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { PremiumPage } from '@/components/study/premium-page';
import { StudyShell } from '@/components/study/study-shell';

export default async function PremiumRoutePage() {
  const { course, courses } = await getActiveCourseContext();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="premium"
        pageTitle="Seja Premium"
        pageSubtitle="Desbloqueie simulado completo, trilhas e analytics avançados"
        breadcrumb={['App', 'Premium']}
        course={course}
        courses={courses}
      >
        <PremiumPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
