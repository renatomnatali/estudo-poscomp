import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { PremiumPage } from '@/components/study/premium-page';
import { StudyShell } from '@/components/study/study-shell';

export default function PremiumRoutePage() {
  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="premium"
        pageTitle="Seja Premium"
        pageSubtitle="Desbloqueie simulado completo, trilhas e analytics avançados"
        breadcrumb={['App', 'Premium']}
      >
        <PremiumPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}
