import type { Metadata } from 'next';

import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Esqueci minha senha · aprovado.xyz',
};

/**
 * /esqueci-senha — pede o link de redefinição. Resposta SEMPRE genérica
 * (anti-enumeração): mesma tela para e-mail existente e inexistente
 * (APR-3 · PR B2).
 */
export default function EsqueciSenhaPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
