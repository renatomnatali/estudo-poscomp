import { getServerViewer } from '@/lib/server-viewer';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { PremiumPage } from '@/components/study/premium-page';
import { StudyShell } from '@/components/study/study-shell';

export default async function PremiumRoutePage() {
  const viewer = await getServerViewer();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="premium"
        pageTitle="Seja Premium"
        pageSubtitle="Desbloqueie simulado completo, trilhas e analytics avançados"
        breadcrumb={['App', 'Premium']}
        viewer={viewer}
      >
        <PremiumPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
