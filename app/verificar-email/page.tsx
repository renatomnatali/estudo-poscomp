import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { VerifyEmailClient } from '@/components/auth/verify-email-client';

export const metadata: Metadata = {
  title: 'Verificar e-mail · aprovado.xyz',
};

/** Fallback do Suspense: estado "verificando" do mockup, renderizado no
 * servidor enquanto o cliente resolve o token da URL. */
function VerificandoFallback() {
  return (
    <>
      <span className="eyebrow auth-eyebrow">Conta · Verificação</span>
      <h1 className="auth-title">Verificar e-mail</h1>
      <div className="auth-result" role="status" aria-live="polite">
        <span
          className="spinner is-lg"
          style={{ display: 'block', margin: '12px auto 16px' }}
          aria-hidden="true"
        />
        <h2>Verificando seu e-mail…</h2>
        <p>Isso leva só alguns segundos. Não feche esta página.</p>
      </div>
    </>
  );
}

/**
 * /verificar-email?token=… — consome o token de verificação na abertura e
 * mostra o resultado: confirmado (redireciona pro login) ou inválido com
 * reenvio direto na tela (APR-3 · PR B2).
 */
export default function VerificarEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<VerificandoFallback />}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
