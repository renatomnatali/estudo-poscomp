import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { IconAlertCircle } from '@/components/auth/icons';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Criar nova senha · aprovado.xyz',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * /redefinir-senha?token=… — Server Component que valida o token SSR ANTES
 * de renderizar o form (APR-3 · PR B2).
 *
 * Por que validação SSR: a versão client-only renderizaria o form mesmo com
 * token expirado e o usuário só descobriria no submit, depois de digitar a
 * senha nova. Fail-fast reduz fricção e abandono.
 *
 * Anti-enumeration: a mensagem é unificada (não distingue "não existe" vs
 * "expirado" vs "usado"). Usuário genuíno só precisa saber que deve gerar
 * novo.
 */
export default async function RedefinirSenhaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = typeof rawToken === 'string' ? rawToken : null;

  const isValid = await tokenIsValid(token);

  return (
    <AuthShell>
      {isValid && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        // Token ausente/inválido/expirado/usado — aviso direto, sem form.
        <>
          <span className="eyebrow auth-eyebrow">Conta · Nova senha</span>
          <h1 className="auth-title">Criar nova senha</h1>
          <div className="auth-result" tabIndex={-1}>
            <div className="icon-box is-amb">
              <IconAlertCircle size={26} />
            </div>
            <h2>Link inválido ou expirado</h2>
            <p>
              Este link de redefinição de senha não é mais válido. Solicite um novo para
              continuar.
            </p>
            <Link className="auth-btn auth-btn-pri" href="/esqueci-senha">
              Solicitar novo link
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}

async function tokenIsValid(token: string | null): Promise<boolean> {
  if (!token) return false;
  // Validação mínima de formato — token é 32 bytes hex (64 chars).
  // Evita query DB com input claramente lixo (defesa contra scan).
  if (!/^[a-f0-9]{64}$/.test(token)) return false;

  // Try/catch fail-safe: se o Prisma lançar (Neon offline, schema drift),
  // tratamos como token inválido — o usuário vê o aviso em vez de erro
  // genérico. UX coerente: pra ele tanto faz se o token expirou ou o banco
  // caiu — o fluxo é "gerar novo". Log para diagnóstico — não silencioso.
  try {
    const reset = await db.passwordResetToken.findUnique({
      where: { token },
      select: { usedAt: true, expiresAt: true },
    });

    if (!reset) return false;
    if (reset.usedAt) return false;
    if (reset.expiresAt <= new Date()) return false;

    return true;
  } catch (err) {
    console.error('[redefinir-senha] Falha ao validar token:', err);
    return false;
  }
}
