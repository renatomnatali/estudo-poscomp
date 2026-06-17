import { getServerViewer } from '@/lib/server-viewer';
import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { SimuladoPage } from '@/components/study/simulado-page';
import { StudyShell } from '@/components/study/study-shell';

export default async function SimuladoRoutePage() {
  const viewer = await getServerViewer();

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="simulado"
        pageTitle="Simulado POSCOMP"
        pageSubtitle="Sessões parciais gratuitas e modos premium"
        breadcrumb={['App', 'Simulado']}
        viewer={viewer}
      >
        <SimuladoPage userId={viewer.userId} userEmail={viewer.email} isPremiumUser={viewer.isPremium} />
      </StudyShell>
    </StudyRouteGuard>
  );
}
