'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { api, ApiError } from '@/lib/api';

import { IconAlertCircle, IconMail, IconXCircle } from './icons';
import { TurnstileWidget, type TurnstileHandle } from './turnstile-widget';

type AlertState = { kind: 'error' | 'rate'; text: string } | null;

/**
 * Estados do /esqueci-senha (régua: Spec/mockup/auth/esqueci-senha.html):
 * formulário · 429 · carregando · enviado com resposta GENÉRICA — a mesma
 * tela para e-mail existente e inexistente (anti-enumeração).
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Em dev sem site key, o TurnstileWidget retorna null e o token nunca chega
  // — bloquear submit nesse caso travaria o form.
  const siteKeyPresent = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Foco no card de resultado quando ele substitui o formulário.
  useEffect(() => {
    if (sent) {
      resultRef.current?.focus();
    }
  }, [sent]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      // Resposta genérica nos dois casos — o backend não revela enumeração.
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, turnstileToken }),
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setAlert({ kind: 'rate', text: err.message });
      } else if (err instanceof ApiError) {
        setAlert({ kind: 'error', text: err.message });
      } else {
        setAlert({ kind: 'error', text: 'Falha ao enviar. Tente novamente em instantes.' });
      }
      // O backend consome o token Turnstile ANTES de validar a entrada, então
      // qualquer erro deixa o token gasto. Renova o widget para a próxima
      // tentativa não cair em 403 (timeout-or-duplicate).
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <span className="eyebrow auth-eyebrow">Conta · Recuperação</span>
        <h1 className="auth-title">Esqueci minha senha</h1>
        <div
          className="auth-result"
          tabIndex={-1}
          role="status"
          aria-live="polite"
          ref={resultRef}
        >
          <div className="icon-box is-em">
            <IconMail size={26} />
          </div>
          <h2>E-mail enviado</h2>
          <p>
            Se <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir
            sua senha. Verifique também a caixa de spam.
          </p>
          <Link className="auth-btn auth-btn-sec" href="/entrar">
            Voltar ao login
          </Link>
          <small className="auth-result-note">
            Não chegou? Confira o spam antes de pedir de novo.
          </small>
        </div>
      </>
    );
  }

  return (
    <>
      <span className="eyebrow auth-eyebrow">Conta · Recuperação</span>
      <h1 className="auth-title">Esqueci minha senha</h1>
      <p className="auth-intro">
        Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
      </p>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="esqueci-email">E-mail</label>
          <input
            className="auth-input"
            id="esqueci-email"
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

        {/* Desafio anti-bot — sem site key o widget renderiza null. */}
        <TurnstileWidget
          ref={turnstileRef}
          onToken={setTurnstileToken}
          className="auth-turnstile"
        />

        <button
          type="submit"
          className="auth-btn auth-btn-pri"
          disabled={loading || (siteKeyPresent && !turnstileToken)}
          aria-busy={loading || (siteKeyPresent && !turnstileToken)}
          aria-label={
            siteKeyPresent && !turnstileToken && !loading
              ? 'Aguardando validação de segurança'
              : undefined
          }
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          <span>{loading ? 'Enviando…' : 'Enviar link de redefinição'}</span>
        </button>
      </form>

      <p className="auth-alt">
        Lembrou a senha? <Link href="/entrar">Voltar ao login</Link>
      </p>
    </>
  );
}
