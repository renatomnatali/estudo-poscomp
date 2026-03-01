'use client';

import { useAuth } from '@clerk/nextjs';

import { isClerkEnabledClient } from '@/lib/auth-config';
import { StudyAccessGuard } from '@/components/auth/study-access-guard';

export function StudyRouteGuard({ children }: { children: React.ReactNode }) {
  if (!isClerkEnabledClient()) {
    return <>{children}</>;
  }

  return <StudyRouteGuardWithClerk>{children}</StudyRouteGuardWithClerk>;
}

function StudyRouteGuardWithClerk({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main className="page-wrap">
        <section className="section-card">
          <h1 className="page-title">Validando sessão</h1>
          <p className="page-subtitle">Aguarde enquanto carregamos sua autenticação.</p>
        </section>
      </main>
    );
  }

  if (!isSignedIn) {
    return <StudyAccessGuard />;
  }

  return <>{children}</>;
}
