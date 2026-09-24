import { getServerViewer } from '@/lib/server-viewer';
import { getActiveCourseContext } from '@/lib/active-course';
import { INFANTIL_COURSE } from '@/lib/courses/infantil';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { DashboardPage } from '@/components/study/dashboard-page';
import { InfantilDashboardPage } from '@/components/study/infantil-dashboard-page';
import { StudyShell } from '@/components/study/study-shell';

export default async function DashboardRoutePage() {
  const [viewer, courseContext] = await Promise.all([
    getServerViewer(),
    getActiveCourseContext(),
  ]);
  const { course, courses } = courseContext;
  // Única ramificação por curso na rota: decide QUAL dashboard renderizar.
  // O conteúdo interno de cada curso não sabe do outro.
  const isInfantil = course.slug === INFANTIL_COURSE.slug;

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="dashboard"
        pageTitle="Dashboard"
        pageSubtitle="Sua visão geral de progresso e próximos passos"
        breadcrumb={['App', 'Dashboard']}
        course={course}
        courses={courses}
        viewer={viewer}
      >
        {isInfantil ? <InfantilDashboardPage /> : <DashboardPage userId={viewer.userId} />}
      </StudyShell>
    </StudyRouteGuard>
  );
}
