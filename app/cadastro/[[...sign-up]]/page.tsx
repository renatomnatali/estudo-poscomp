import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Criar conta · aprovado.xyz',
};

interface SignUpPageProps {
  params: Promise<{ 'sign-up'?: string[] }>;
}

/**
 * /cadastro — criação de conta com e-mail/senha (APR-3 · PR B2).
 * Sucesso NÃO faz login automático: mostra "verifique seu e-mail".
 *
 * O catch-all [[...sign-up]] é herança do roteamento por path do Clerk
 * (PRs anteriores); sem Clerk só /cadastro existe — segmentos extras são 404.
 */
export default async function SignUpPage({ params }: SignUpPageProps) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  const { 'sign-up': segments } = await params;
  if (segments && segments.length > 0) notFound();

  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
