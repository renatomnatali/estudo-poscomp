import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { SimuladoPage } from '@/components/study/simulado-page';
import { StudyShell } from '@/components/study/study-shell';

export default function SimuladoRoutePage() {
  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="simulado"
        pageTitle="Simulado POSCOMP"
        pageSubtitle="Sessões parciais gratuitas e modos premium"
        breadcrumb={['App', 'Simulado']}
      >
        <SimuladoPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
