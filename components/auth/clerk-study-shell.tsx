'use client';

import { useAuth, useClerk, useUser } from '@clerk/nextjs';

import { PoscompApp } from '@/components/poscomp-app';
import { StudyAccessGuard } from '@/components/auth/study-access-guard';

export function ClerkStudyShell() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

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

  return (
    <PoscompApp
      auth={{
        mode: 'authenticated',
        userId: user?.id,
        displayName: user?.fullName || user?.username || user?.firstName || 'Estudante',
        email: user?.primaryEmailAddress?.emailAddress,
        onSignOut: () => void clerk.signOut({ redirectUrl: '/' }),
      }}
    />
  );
}
