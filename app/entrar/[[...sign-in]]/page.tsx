import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Entrar · aprovado.xyz',
};

interface SignInPageProps {
  params: Promise<{ 'sign-in'?: string[] }>;
}

/**
 * /entrar — formulário de login com e-mail/senha (APR-3 · PR B2).
 *
 * Server component fino: visitante com sessão válida é levado ao
 * /dashboard (Gherkin "telas"); sem sessão, renderiza o formulário.
 *
 * O catch-all [[...sign-in]] é herança do roteamento por path do Clerk
 * (PRs anteriores); sem Clerk só /entrar existe — segmentos extras são 404.
 */
export default async function SignInPage({ params }: SignInPageProps) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  const { 'sign-in': segments } = await params;
  if (segments && segments.length > 0) notFound();

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
