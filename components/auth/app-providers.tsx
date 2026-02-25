'use client';

import { ClerkProvider } from '@clerk/nextjs';

import { CLERK_PUBLISHABLE_KEY, isClerkEnabledClient } from '@/lib/auth-config';

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (!isClerkEnabledClient()) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl="/entrar"
      signUpUrl="/cadastro"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
