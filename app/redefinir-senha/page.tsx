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

  const tokenState = await checkToken(token);

  return (
    <AuthShell>
      {tokenState === 'valid' && token ? (
        <ResetPasswordForm token={token} />
      ) : tokenState === 'unavailable' ? (
        // Banco/serviço indisponível no lookup SSR — NÃO é culpa do link:
        // mensagem de instabilidade com recuperação (recarregar), em vez de
        // condenar um token possivelmente bom como "inválido".
        <>
          <span className="eyebrow auth-eyebrow">Conta · Nova senha</span>
          <h1 className="auth-title">Criar nova senha</h1>
          <div className="auth-result" tabIndex={-1}>
            <div className="icon-box is-amb">
              <IconAlertCircle size={26} />
            </div>
            <h2>Verificação indisponível</h2>
            <p>
              Não foi possível verificar este link agora — o serviço está
              instável. Tente recarregar a página em instantes.
            </p>
            <a
              className="auth-btn auth-btn-pri"
              href={token ? `/redefinir-senha?token=${token}` : '/redefinir-senha'}
            >
              Recarregar a página
            </a>
          </div>
        </>
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

async function checkToken(token: string | null): Promise<'valid' | 'invalid' | 'unavailable'> {
  if (!token) return 'invalid';
  // Validação mínima de formato — token é 32 bytes hex (64 chars).
  // Evita query DB com input claramente lixo (defesa contra scan).
  if (!/^[a-f0-9]{64}$/.test(token)) return 'invalid';

  try {
    const reset = await db.passwordResetToken.findUnique({
      where: { token },
      select: { usedAt: true, expiresAt: true },
    });

    if (!reset) return 'invalid';
    if (reset.usedAt) return 'invalid';
    if (reset.expiresAt <= new Date()) return 'invalid';

    return 'valid';
  } catch (err) {
    // Outage do banco/schema NÃO condena o link: estado retryável próprio
    // (mensagem de instabilidade + recarregar), distinguindo falha de
    // infraestrutura de token realmente inválido. Log para diagnóstico.
    console.error('[redefinir-senha] Falha ao validar token:', err);
    return 'unavailable';
  }
}
