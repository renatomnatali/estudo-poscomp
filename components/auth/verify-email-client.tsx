'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { api, ApiError } from '@/lib/api';

import { IconAlertCircle, IconCheck, IconXCircle } from './icons';

type VerifyStatus =
  | 'verifying'
  | 'confirmed'
  | 'invalid'
  /** 429 do consumo do token — limite de tentativas, o link não foi julgado. */
  | 'rate'
  /** Falha de rede/servidor — a verificação não aconteceu, link segue válido. */
  | 'unavailable';

type ResendState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'rate'; text: string }
  | { phase: 'sent' }
  | { phase: 'error'; text: string };

/** Fallback do texto 429 — o backend responde "Muitas tentativas…". */
const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Aguarde um momento.';

/**
 * Estados do /verificar-email (régua: Spec/mockup/auth/verificar-email.html):
 * verificando (consumindo o token) · confirmado (redireciona pro login) ·
 * inválido/expirado/usado — mensagem UNIFICADA + reenvio direto na tela com
 * resposta genérica (anti-enumeração) · rate (429: aguardar, reenvio
 * disponível) · unavailable (rede: "não foi possível verificar agora").
 *
 * Diferença deliberada vs. sem-cilada: no falha, a ação é REENVIAR a
 * verificação aqui mesmo (o sem-cilada manda "tentar novamente" para o
 * cadastro).
 */
export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerifyStatus>(token ? 'verifying' : 'invalid');
  const [rateText, setRateText] = useState(RATE_LIMIT_MESSAGE);
  const [resend, setResend] = useState<ResendState>({ phase: 'idle' });
  const [resendEmail, setResendEmail] = useState('');
  const confirmedCardRef = useRef<HTMLDivElement>(null);
  const invalidCardRef = useRef<HTMLDivElement>(null);

  // Consome o token na abertura. Sem token na URL já nasce no estado
  // inválido — mensagem unificada, sem distinguir o motivo. Falhas do
  // consumo só são "link inválido" quando o backend JULGOU o token (400);
  // 429 e falha de rede não dizem nada do link e não podem culpar o
  // usuário de ter um link vencido.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        await api('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        if (!cancelled) {
          setStatus('confirmed');
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 429) {
          setRateText(err.message);
          setStatus('rate');
        } else if (err instanceof ApiError && err.status === 400) {
          setStatus('invalid');
        } else {
          setStatus('unavailable');
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Confirmado: redireciona para o login em 3 segundos.
  useEffect(() => {
    if (status !== 'confirmed') return;
    const timer = setTimeout(() => router.push('/entrar'), 3000);
    return () => clearTimeout(timer);
  }, [status, router]);

  // Foco no card de resultado quando o estado o substitui — leitor de tela
  // anuncia; teclado segue dali.
  useEffect(() => {
    if (status === 'confirmed') confirmedCardRef.current?.focus();
    if (status === 'invalid' || status === 'rate' || status === 'unavailable') {
      invalidCardRef.current?.focus();
    }
  }, [status]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setResend({ phase: 'sending' });
    try {
      // Resposta genérica — não revela se o e-mail existe (2/min por IP).
      await api('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: resendEmail }),
      });
      setResend({ phase: 'sent' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setResend({ phase: 'rate', text: err.message });
      } else if (err instanceof ApiError) {
        setResend({ phase: 'error', text: err.message });
      } else {
        setResend({ phase: 'error', text: 'Falha ao reenviar. Tente novamente em instantes.' });
      }
    }
  }

  return (
    <>
      <span className="eyebrow auth-eyebrow">Conta · Verificação</span>
      <h1 className="auth-title">Verificar e-mail</h1>

      {status === 'verifying' && (
        <div className="auth-result" role="status" aria-live="polite">
          <span
            className="spinner is-lg"
            style={{ display: 'block', margin: '12px auto 16px' }}
            aria-hidden="true"
          />
          <h2>Verificando seu e-mail…</h2>
          <p>Isso leva só alguns segundos. Não feche esta página.</p>
        </div>
      )}

      {status === 'confirmed' && (
        <div
          className="auth-result"
          tabIndex={-1}
          role="status"
          aria-live="polite"
          ref={confirmedCardRef}
        >
          <div className="icon-box is-em">
            <IconCheck size={26} strokeWidth={2.5} />
          </div>
          <h2>E-mail verificado!</h2>
          <p>Sua conta foi verificada com sucesso. Redirecionando para o login…</p>
          <Link className="auth-btn auth-btn-pri" href="/entrar">
            Ir para o login
          </Link>
          <small className="auth-result-note">Redirecionamento automático em 3 segundos.</small>
        </div>
      )}

      {(status === 'invalid' || status === 'rate' || status === 'unavailable') && (
        <>
          <div className="auth-result" tabIndex={-1} ref={invalidCardRef}>
            <div className="icon-box is-amb">
              <IconAlertCircle size={26} />
            </div>
            {status === 'invalid' ? (
              <>
                <h2>Link inválido ou expirado</h2>
                <p>
                  Este link de verificação não é mais válido — pode ter expirado
                  (vale por 24 horas) ou já ter sido usado.
                </p>
              </>
            ) : status === 'rate' ? (
              <>
                <h2>Limite de tentativas</h2>
                <p>{rateText} Você ainda pode pedir um novo link abaixo.</p>
              </>
            ) : (
              <>
                <h2>Não foi possível verificar agora</h2>
                <p>
                  A verificação falhou por um problema de conexão, não pelo link.
                  Recarregue a página para tentar de novo — ou peça um novo link abaixo.
                </p>
              </>
            )}
          </div>

          {/* Reenvio direto na tela: campo de e-mail + resposta genérica.
              Após enviar, o formulário dá lugar ao status de confirmação. */}
          {resend.phase === 'sent' ? (
            <div className="auth-status" role="status" style={{ marginTop: 16 }}>
              <IconCheck />
              <span>
                Se o e-mail estiver cadastrado e ainda não verificado, enviaremos um novo link de
                verificação.
              </span>
            </div>
          ) : (
            <form
              className="auth-card"
              style={{ marginTop: 16 }}
              onSubmit={handleResend}
              noValidate
            >
              <div className="auth-field">
                <label htmlFor="reenvio-email">Reenviar verificação</label>
                <input
                  className="auth-input"
                  id="reenvio-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="seu-email@exemplo.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resend.phase === 'sending'}
                  required
                />
              </div>

              {(resend.phase === 'rate' || resend.phase === 'error') && (
                <div
                  className={`auth-alert ${
                    resend.phase === 'rate' ? 'auth-alert-warn' : 'auth-alert-error'
                  }`}
                  role="alert"
                >
                  {resend.phase === 'rate' ? <IconAlertCircle /> : <IconXCircle />}
                  <span>{resend.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="auth-btn auth-btn-pri"
                disabled={resend.phase === 'sending'}
                aria-busy={resend.phase === 'sending'}
              >
                {resend.phase === 'sending' && <span className="spinner" aria-hidden="true" />}
                <span>{resend.phase === 'sending' ? 'Enviando…' : 'Reenviar link de verificação'}</span>
              </button>
            </form>
          )}

          <p className="auth-alt">
            <Link href="/entrar">Voltar ao login</Link>
          </p>
        </>
      )}
    </>
  );
}
