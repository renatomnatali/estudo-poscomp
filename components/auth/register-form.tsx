'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { api, ApiError } from '@/lib/api';
import { isValidPassword, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS_MESSAGE } from '@/lib/password';

import { IconAlertCircle, IconMail, IconXCircle } from './icons';
import { PasswordInput } from './password-input';
import { PasswordRules } from './password-rules';
import { TurnstileWidget, type TurnstileHandle } from './turnstile-widget';

/**
 * Estados do /cadastro (régua: Spec/mockup/auth/cadastro.html):
 * formulário (com requisitos vivos) · 400 política · 429 · carregando ·
 * sucesso "verifique seu e-mail" (SEM login automático) · e-mail já
 * cadastrado com senha (decisão de produto do espelho).
 *
 * `outcome` reflete o ramo do backend: `verify_email` (conta criada) ou
 * `already_registered` (e-mail já tem conta com senha).
 */
type Outcome = 'verify_email' | 'already_registered' | null;

type AlertState = { kind: 'error' | 'rate'; text: string } | null;

/** Texto literal do mockup (a mensagem unificada da lib + ponto final). */
const POLICY_MESSAGE = `${PASSWORD_REQUIREMENTS_MESSAGE}.`;

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  // Falha terminal do desafio (budget esgotado/script morto) e chave de
  // remontagem do widget para a ação de recuperação "recarregar verificação".
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Em dev sem site key, o TurnstileWidget retorna null e o token nunca chega
  // — bloquear submit nesse caso travaria o form.
  // (Não importar este flag do widget: os testes mockam o módulo sem o
  // export e o vitest lança "No export is defined on the mock".)
  const siteKeyPresent = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function retryTurnstile() {
    setTurnstileFailed(false);
    setTurnstileToken('');
    // Remonta o widget: desafio novo (e script novo, se o anterior morreu).
    setWidgetKey((k) => k + 1);
  }

  // Ao substituir o formulário pela confirmação, o botão "Criar conta" some
  // do DOM e o foco cairia no ancestral. Move o foco para o card de
  // resultado para que leitores de tela anunciem o novo conteúdo.
  useEffect(() => {
    if (outcome) {
      resultRef.current?.focus();
    }
  }, [outcome]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Mesma política visível dos chips — barra na borda, sem gastar chamada.
    if (!isValidPassword(password)) {
      setAlert({ kind: 'error', text: POLICY_MESSAGE });
      return;
    }
    setAlert(null);
    setLoading(true);
    try {
      const res = await api<{ outcome?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      // Coerção fail-safe: só `already_registered` explícito cai na tela de
      // conta existente; qualquer outro valor vira `verify_email`, que nunca
      // revela enumeração. A coerção fica AQUI, no setter, não no JSX —
      // assim o estado é sempre um dos dois literais, jamais `undefined`.
      setOutcome(res?.outcome === 'already_registered' ? 'already_registered' : 'verify_email');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setAlert({ kind: 'rate', text: err.message });
      } else if (err instanceof ApiError) {
        setAlert({ kind: 'error', text: err.message });
      } else {
        setAlert({ kind: 'error', text: 'Falha ao criar conta. Tente novamente em instantes.' });
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

  if (outcome === 'verify_email') {
    return (
      <>
        <span className="eyebrow auth-eyebrow">Conta · Cadastro</span>
        <h1 className="auth-title">Verifique seu e-mail</h1>
        <div className="auth-result" tabIndex={-1} role="status" aria-live="polite" ref={resultRef}>
          <div className="icon-box is-em">
            <IconMail size={26} />
          </div>
          <h2>Link enviado</h2>
          <p>
            Enviamos um link de verificação para <strong>{email}</strong>.
            Verifique sua caixa de entrada e spam.
          </p>
          <Link className="auth-btn auth-btn-pri" href="/entrar">
            Ir para o login
          </Link>
          <small className="auth-result-note">
            O link vale por 24 horas. Sem verificação, não é possível entrar.
          </small>
        </div>
        <p className="auth-alt">
          <Link href="/entrar">Já verificou? Entrar</Link>
        </p>
      </>
    );
  }

  if (outcome === 'already_registered') {
    return (
      <>
        <span className="eyebrow auth-eyebrow">Conta · Cadastro</span>
        <h1 className="auth-title">Este e-mail já tem conta</h1>
        <div className="auth-result" tabIndex={-1} role="status" aria-live="polite" ref={resultRef}>
          <div className="icon-box is-amb">
            <IconAlertCircle size={26} />
          </div>
          <h2>Já existe uma conta</h2>
          <p>
            Você já tem uma conta com <strong>{email}</strong>.
          </p>
          <Link className="auth-btn auth-btn-pri" href="/entrar">
            Entrar
          </Link>
          <small className="auth-result-note">
            <Link className="auth-link" href="/esqueci-senha">
              Esqueci minha senha
            </Link>
          </small>
        </div>
      </>
    );
  }

  return (
    <>
      <span className="eyebrow auth-eyebrow">Conta · Cadastro</span>
      <h1 className="auth-title">Criar sua conta</h1>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="cadastro-email">E-mail</label>
          <input
            className="auth-input"
            id="cadastro-email"
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
          id="cadastro-senha"
          label="Senha"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          describedBy="cadastro-regras"
          disabled={loading}
        >
          {/* Requisitos visíveis — validação viva enquanto digita. */}
          <PasswordRules password={password} id="cadastro-regras" />
        </PasswordInput>

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
              ? 'Criar conta — aguardando validação de segurança'
              : undefined
          }
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          <span>{loading ? 'Criando conta…' : 'Criar conta'}</span>
        </button>
      </form>

      <p className="auth-alt">
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </>
  );
}
