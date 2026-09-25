'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api, ApiError } from '@/lib/api';

import { IconAlertCircle, IconCheck, IconMail, IconXCircle } from './icons';
import { PasswordInput } from './password-input';
import { TurnstileWidget, type TurnstileHandle } from './turnstile-widget';

/**
 * Estados do /entrar (régua: Spec/mockup/auth/entrar.html):
 * formulário · 401 genérico · 403 e-mail não verificado (com reenvio) ·
 * reenvio confirmado · 429 · carregando.
 */
type AlertState =
  | { kind: 'none' }
  | { kind: 'error'; text: string }
  | { kind: 'not-verified' }
  | { kind: 'resent' }
  | { kind: 'rate'; text: string };

/** 401 — resposta genérica idêntica para conta inexistente e senha errada
 * (anti-enumeração). Texto literal do mockup. */
const INVALID_CREDENTIALS_MESSAGE =
  'Credenciais inválidas. Confira seu e-mail e senha e tente de novo.';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ kind: 'none' });
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  // Falha terminal do desafio (budget esgotado/script morto) e chave de
  // remontagem do widget para a ação de recuperação "recarregar verificação".
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);
  const turnstileRef = useRef<TurnstileHandle>(null);
  // Em dev sem site key, o TurnstileWidget retorna null e o token nunca chega
  // — bloquear submit nesse caso travaria o form. Só exige token se a key
  // estiver configurada (produção). NEXT_PUBLIC_* é inlined em client builds.
  // (Não importar este flag do widget: os testes mockam o módulo sem o
  // export e o vitest lança "No export is defined on the mock".)
  const siteKeyPresent = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function retryTurnstile() {
    setTurnstileFailed(false);
    setTurnstileToken('');
    // Remonta o widget: desafio novo (e script novo, se o anterior morreu).
    setWidgetKey((k) => k + 1);
  }

  async function handleResendVerification() {
    setResendLoading(true);
    setResendError(null);
    try {
      // Resposta genérica (anti-enumeração) — o backend não revela se o
      // e-mail existe; a confirmação é a mesma do mockup.
      await api('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setAlert({ kind: 'resent' });
    } catch (err) {
      // Falha do reenvio NÃO derruba o bloco de e-mail não verificado — o
      // usuário continua vendo o contexto e a ação de tentar de novo; a
      // mensagem de erro entra aninhada no próprio bloco.
      setResendError(
        err instanceof ApiError && err.status === 429
          ? err.message
          : 'Falha ao reenviar e-mail de verificação. Tente novamente.',
      );
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAlert({ kind: 'none' });
    setResendError(null);
    setLoading(true);
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      // Cookie de sessão httpOnly já vem na resposta; o dashboard resolve
      // o estado no server.
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          setAlert({ kind: 'not-verified' });
        } else if (err.status === 401) {
          setAlert({ kind: 'error', text: INVALID_CREDENTIALS_MESSAGE });
        } else if (err.status === 429) {
          setAlert({ kind: 'rate', text: err.message });
        } else {
          setAlert({ kind: 'error', text: err.message });
        }
      } else {
        setAlert({ kind: 'error', text: 'Falha ao entrar. Tente novamente em instantes.' });
      }
      // O backend consome o token Turnstile ANTES de validar a senha, então
      // qualquer erro (senha errada, e-mail não verificado, etc.) deixa o
      // token gasto. Renova o widget para a próxima tentativa não cair em
      // 403 (timeout-or-duplicate).
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <span className="eyebrow auth-eyebrow">Conta · Acesso</span>
      <h1 className="auth-title">Entrar na sua conta</h1>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="entrar-email">E-mail</label>
          <input
            className="auth-input"
            id="entrar-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="seu-email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <PasswordInput
          id="entrar-senha"
          label="Senha"
          labelTrailing={
            <Link className="auth-link" href="/esqueci-senha">
              Esqueci minha senha
            </Link>
          }
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={loading}
        />

        {alert.kind === 'error' && (
          <div className="auth-alert auth-alert-error" role="alert">
            <IconXCircle />
            <span>{alert.text}</span>
          </div>
        )}

        {alert.kind === 'not-verified' && (
          <div className="auth-alert auth-alert-error" role="alert">
            <IconMail />
            <span>
              Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada (e spam)
              ou reenvie o link de verificação.
              <button
                type="button"
                className="auth-alert-action"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? 'Enviando…' : 'Reenviar e-mail de verificação'}
              </button>
              {resendError && <span className="auth-alert-note">{resendError}</span>}
            </span>
          </div>
        )}

        {alert.kind === 'resent' && (
          <div className="auth-status" role="status">
            <IconCheck />
            <span>E-mail de verificação reenviado. Verifique sua caixa de entrada e spam.</span>
          </div>
        )}

        {alert.kind === 'rate' && (
          <div className="auth-alert auth-alert-warn" role="alert">
            <IconAlertCircle />
            <span>{alert.text}</span>
          </div>
        )}

        {/* Desafio anti-bot (Cloudflare Turnstile). Sem site key o widget
            renderiza null e o backend faz bypass — dev/preview funcionam. */}
        <TurnstileWidget
          key={widgetKey}
          ref={turnstileRef}
          onToken={setTurnstileToken}
          onFailure={() => setTurnstileFailed(true)}
          className="auth-turnstile"
        />

        {/* Falha terminal do desafio: sem recuperação o form ficaria eternamente
            travado (botão desabilitado esperando um token que não virá). */}
        {turnstileFailed && (
          <div className="auth-alert auth-alert-error" role="alert">
            <IconXCircle />
            <span>
              Verificação de segurança falhou. Recarregue a página.
              <button type="button" className="auth-alert-action" onClick={retryTurnstile}>
                Recarregar verificação
              </button>
            </span>
          </div>
        )}

        <button
          type="submit"
          className="auth-btn auth-btn-pri"
          disabled={loading || (siteKeyPresent && !turnstileToken)}
          aria-busy={loading}
          aria-label={
            siteKeyPresent && !turnstileToken && !loading
              ? 'Entrar — aguardando validação de segurança'
              : undefined
          }
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          <span>{loading ? 'Entrando…' : 'Entrar'}</span>
        </button>
      </form>

      <p className="auth-alt">
        Não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </>
  );
}
