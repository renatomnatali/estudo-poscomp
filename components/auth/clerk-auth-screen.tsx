'use client';

import Link from 'next/link';
import { SignIn, SignUp } from '@clerk/nextjs';

import { isClerkEnabledClient } from '@/lib/auth-config';

interface ClerkAuthScreenProps {
  mode: 'sign-in' | 'sign-up';
}

export function ClerkAuthScreen({ mode }: ClerkAuthScreenProps) {
  if (!isClerkEnabledClient()) {
    return (
      <main className="page-wrap">
        <section className="section-card">
          <h1 className="page-title">Autenticação desabilitada</h1>
          <p className="page-subtitle">
            Configure as variáveis do Clerk para habilitar login social e persistência de sessão.
          </p>
          <div className="auth-landing-actions">
            <Link href="/dashboard" className="sim-action-btn sim-action-btn-primary">Abrir aplicação</Link>
            <Link href="/demo" className="sim-action-btn sim-action-btn-secondary">Ver demo</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <section className="section-card auth-card-center">
        <h1 className="page-title">{mode === 'sign-in' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="page-subtitle">Use Google ou outro provedor habilitado no Clerk.</p>
        <div className="auth-clerk-slot">
          {mode === 'sign-in' ? (
            <SignIn path="/entrar" routing="path" signUpUrl="/cadastro" forceRedirectUrl="/dashboard" />
          ) : (
            <SignUp path="/cadastro" routing="path" signInUrl="/entrar" forceRedirectUrl="/dashboard" />
          )}
        </div>
      </section>
    </main>
  );
}
