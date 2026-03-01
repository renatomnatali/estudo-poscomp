import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { DashboardPage } from '@/components/study/dashboard-page';
import { StudyShell } from '@/components/study/study-shell';

export default function DashboardRoutePage() {
  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="dashboard"
        pageTitle="Dashboard"
        pageSubtitle="Sua visão geral de progresso e próximos passos"
        breadcrumb={['App', 'Dashboard']}
      >
        <DashboardPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
