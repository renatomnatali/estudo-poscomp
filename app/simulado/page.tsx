import { getActiveCourseContext } from '@/lib/active-course';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { SimuladoPage } from '@/components/study/simulado-page';
import { StudyShell } from '@/components/study/study-shell';

export default async function SimuladoRoutePage() {
  const { course, courses } = await getActiveCourseContext();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="simulado"
        pageTitle="Simulado POSCOMP"
        pageSubtitle="Sessões parciais gratuitas e modos premium"
        breadcrumb={['App', 'Simulado']}
        course={course}
        courses={courses}
      >
        <SimuladoPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
