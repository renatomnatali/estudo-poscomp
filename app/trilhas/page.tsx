import { getActiveCourseContext } from '@/lib/active-course';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { StudyShell } from '@/components/study/study-shell';
import { TrilhasPage } from '@/components/study/trilhas-page';

export default async function TrilhasRoutePage() {
  const { course, courses } = await getActiveCourseContext();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="trilhas"
        pageTitle="Trilhas de Estudo"
        pageSubtitle="25 tópicos do edital SBC com status e progressão"
        searchPlaceholder="Buscar tópico..."
        breadcrumb={['App', 'Trilhas']}
        course={course}
        courses={courses}
      >
        <TrilhasPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
