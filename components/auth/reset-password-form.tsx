'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api, ApiError } from '@/lib/api';
import { isValidPassword, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS_MESSAGE } from '@/lib/password';

import { IconAlertCircle, IconCheck, IconXCircle } from './icons';
import { PasswordInput } from './password-input';
import { PasswordRules } from './password-rules';

type AlertState = { kind: 'error' | 'rate'; text: string } | null;

/** Texto literal do mockup (mensagem unificada da lib + ponto final). */
const POLICY_MESSAGE = `${PASSWORD_REQUIREMENTS_MESSAGE}.`;

/** 400 de token no submit (expirou durante a digitação) — texto do mockup. */
const INVALID_TOKEN_MESSAGE =
  'Este link de redefinição não é mais válido. Solicite um novo para continuar.';

/**
 * Form de nova senha do /redefinir-senha (régua:
 * Spec/mockup/auth/redefinir-senha.html). Recebe o token validado SSR como
 * prop — a página só monta este componente quando o token existe, não foi
 * usado e não expirou. Race residual: o token pode expirar entre o render
 * e o submit; o endpoint continua validando (defesa em profundidade).
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [success, setSuccess] = useState(false);
  // Submit com divergência força o alerta mesmo com confirmação vazia (o
  // aviso vivo só acende quando há algo digitado no segundo campo).
  const [mismatchSubmitted, setMismatchSubmitted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Confirmação diverge — checa ao digitar (só quando algo foi digitado)
  // ou quando um submit já flagrou a divergência.
  const mismatch =
    password !== confirmPassword && (confirmPassword.length > 0 || mismatchSubmitted);

  // Voltou a coincidir: o alerta volta a ser só o vivo (ao digitar).
  useEffect(() => {
    if (password === confirmPassword) setMismatchSubmitted(false);
  }, [password, confirmPassword]);

  // Sucesso: redireciona para o login em 3 segundos + foco no card.
  useEffect(() => {
    if (!success) return;
    resultRef.current?.focus();
    const timer = setTimeout(() => router.push('/entrar'), 3000);
    return () => clearTimeout(timer);
  }, [success, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAlert(null);

    if (password !== confirmPassword) {
      // Nunca um no-op silencioso: com a confirmação vazia (ou divergente)
      // o alerta de coincidência precisa acender aqui — o aviso vivo só
      // existe quando há texto no segundo campo.
      setMismatchSubmitted(true);
      return;
    }

    // Mesma política visível dos chips — barra na borda.
    if (!isValidPassword(password)) {
      setAlert({ kind: 'error', text: POLICY_MESSAGE });
      return;
    }

    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setAlert({ kind: 'rate', text: err.message });
      } else if (err instanceof ApiError && err.status === 400) {
        // Política já foi validada na borda — 400 aqui é o token
        // (expirou/foi usado entre o render e o submit).
        setAlert({ kind: 'error', text: INVALID_TOKEN_MESSAGE });
      } else if (err instanceof ApiError) {
        setAlert({ kind: 'error', text: err.message });
      } else {
        setAlert({ kind: 'error', text: 'Falha ao salvar. Tente novamente em instantes.' });
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <span className="eyebrow auth-eyebrow">Conta · Nova senha</span>
        <h1 className="auth-title">Criar nova senha</h1>
        <div
          className="auth-result"
          tabIndex={-1}
          role="status"
          aria-live="polite"
          ref={resultRef}
        >
          <div className="icon-box is-em">
            <IconCheck size={26} strokeWidth={2.5} />
          </div>
          <h2>Senha redefinida!</h2>
          <p>Sua senha foi alterada com sucesso. Redirecionando para o login…</p>
          <Link className="auth-btn auth-btn-pri" href="/entrar">
            Ir para o login
          </Link>
          <small className="auth-result-note">
            Suas outras sessões foram encerradas. Redirecionamento automático em 3 segundos.
          </small>
        </div>
      </>
    );
  }

  return (
    <>
      <span className="eyebrow auth-eyebrow">Conta · Nova senha</span>
      <h1 className="auth-title">Criar nova senha</h1>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <PasswordInput
          id="nova-senha"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          describedBy="redefinir-regras"
          autoFocus
          disabled={loading}
        >
          {/* Mesma política visível do cadastro. */}
          <PasswordRules password={password} id="redefinir-regras" />
        </PasswordInput>

        <PasswordInput
          id="confirmar-senha"
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          disabled={loading}
        />

        {mismatch && (
          <div className="auth-alert auth-alert-error" role="alert" aria-live="polite">
            <IconXCircle />
            <span>As senhas não coincidem.</span>
          </div>
        )}

        {alert?.kind === 'error' && (
          <div className="auth-alert auth-alert-error" role="alert">
            <IconXCircle />
            <span>{alert.text}</span>
          </div>
        )}

        {alert?.kind === 'rate' && (
          <div className="auth-alert auth-alert-warn" role="alert">
            <IconAlertCircle />
            <span>{alert.text}</span>
          </div>
        )}

        <button
          type="submit"
          className="auth-btn auth-btn-pri"
          disabled={loading}
          aria-busy={loading}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          <span>{loading ? 'Salvando…' : 'Criar nova senha'}</span>
        </button>

        {/* Gherkin: passwordChangedAt = agora → sessões antigas morrem. */}
        <small className="auth-result-note" style={{ display: 'block', textAlign: 'center', marginTop: 14 }}>
          Ao trocar a senha, suas outras sessões ativas são encerradas.
        </small>
      </form>

      <p className="auth-alt">
        <Link href="/entrar">Voltar ao login</Link>
      </p>
    </>
  );
}
