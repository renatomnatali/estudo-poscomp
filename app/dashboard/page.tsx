import { getServerViewer } from '@/lib/server-viewer';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { DashboardPage } from '@/components/study/dashboard-page';
import { StudyShell } from '@/components/study/study-shell';

export default async function DashboardRoutePage() {
  const viewer = await getServerViewer();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="dashboard"
        pageTitle="Dashboard"
        pageSubtitle="Sua visão geral de progresso e próximos passos"
        breadcrumb={['App', 'Dashboard']}
        viewer={viewer}
      >
        <DashboardPage userId={viewer.userId} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
