'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface Props {
  onToken: (token: string) => void;
  /**
   * Falha TERMINAL do desafio: budget de retries esgotado no error-callback
   * ou script que não carregou. Distinto de onToken(""): a expiração do
   * token (~300s) também entrega "", mas o widget se renova sozinho — não é
   * terminal. Os forms usam este sinal para oferecer recuperação ao usuário.
   */
  onFailure?: () => void;
  className?: string;
}

/**
 * Handle imperativo exposto via ref. O consumidor chama `reset()` após cada
 * submit que CONSOME o token no backend (login/cadastro/recuperação de
 * senha): o token do Turnstile é single-use, então reenviar o mesmo numa
 * segunda tentativa (ex.: depois de uma senha errada que retornou 401) faz o
 * Cloudflare devolver `timeout-or-duplicate` e o backend responder 403
 * ("Verificação de segurança falhou"). O reset reinicia o desafio e entrega
 * um token fresco via `onToken`, sem recarregar a página.
 */
export interface TurnstileHandle {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// Quantas vezes tentamos `turnstile.reset()` num ERRO de challenge
// (error-callback) antes de desistir e sinalizar falha terminal ao
// consumidor. Falhas transitórias (rede instável no mobile, hiccup do CDN
// da Cloudflare) somem no reset; falha estrutural (ITP do Safari, bloqueio
// de rede) esgota o budget e cai no onFailure — o watchdog do consumidor é
// a rede final. Timeout NÃO consome este budget: o widget da Cloudflare se
// auto-reseta no timeout do desafio (ver 'timeout-callback' abaixo).
const MAX_TURNSTILE_RETRIES = 2;

// Promessa única e compartilhada do carregamento do script. Garante que o
// <script> da Cloudflare é injetado UMA vez por documento, mesmo com várias
// instâncias do widget ou múltiplas montagens (React Strict Mode em dev monta
// o componente 2x: setup → cleanup → setup). O design antigo injetava um
// <script> por montagem e dependia de `window.onTurnstileLoad`, um callback
// GLOBAL MUTÁVEL que o cleanup zerava — quando o script carregava depois do
// cleanup, ele chamava um callback inexistente, nenhum widget renderizava e
// nenhum token chegava.
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // Reusa um <script> já presente (de outra montagem/instância) em vez de
    // duplicar — evita dois challenges concorrentes no mesmo documento.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="${SCRIPT_SRC}"]`,
    );
    const tag = existing ?? document.createElement('script');
    const onError = () => {
      // Permite nova tentativa numa próxima montagem (rede recuperou, etc) e
      // REMOVE a tag morta do DOM — sem isso a remontagem reencontra o
      // <script> com falha, pendura listeners nele e espera um load que
      // nunca vem. Com a tag fora, a próxima montagem injeta uma nova.
      scriptPromise = null;
      tag.remove();
      reject(new Error('Turnstile script failed to load'));
    };
    if (existing) {
      if (window.turnstile) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', onError);
      return;
    }
    tag.src = SCRIPT_SRC;
    tag.async = true;
    tag.defer = true;
    tag.onload = () => resolve();
    tag.onerror = onError;
    document.head.appendChild(tag);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget (espelho do sem-cilada).
 * Carrega o script (uma vez, idempotente) e renderiza o widget no container.
 * Chama onToken("<token>") quando o desafio resolve; onToken("") quando o
 * token é invalidado (expiração/renewal) e também na falha definitiva, que
 * ainda aciona onFailure — o sinal que o form usa para a recuperação.
 *
 * Sem NEXT_PUBLIC_TURNSTILE_SITE_KEY renderiza null — dev/preview funcionam
 * sem desafio (o backend faz bypass em verifyTurnstile).
 */
export const TurnstileWidget = forwardRef<TurnstileHandle, Props>(
  function TurnstileWidget({ onToken, onFailure, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<string | null>(null);
    const retriesRef = useRef(0);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    // Callback sempre-fresco sem entrar nas deps do efeito: parents passam
    // arrow inline (identidade nova a cada render) e o efeito NÃO pode
    // re-rodar por isso — o cleanup remove o widget e remontaria o desafio.
    const onFailureRef = useRef(onFailure);
    onFailureRef.current = onFailure;

    // Expõe reset() ao form. Após um submit que consumiu o token (single-use),
    // o form chama reset() para obter um token novo antes da próxima tentativa,
    // evitando o 403 por `timeout-or-duplicate`.
    useImperativeHandle(
      ref,
      () => ({
        reset() {
          if (widgetRef.current && window.turnstile) {
            retriesRef.current = 0;
            window.turnstile.reset(widgetRef.current);
          }
        },
      }),
      [],
    );

    useEffect(() => {
      if (!siteKey) return;
      // Guarda contra render após o unmount (Strict Mode / navegação): o
      // carregamento do script é assíncrono e pode resolver depois do cleanup.
      let cancelled = false;

      // Erro de challenge (error-callback): tenta resetar e refazer o
      // desafio até MAX_TURNSTILE_RETRIES antes de declarar falha terminal.
      function handleChallengeError() {
        if (retriesRef.current < MAX_TURNSTILE_RETRIES && widgetRef.current && window.turnstile) {
          retriesRef.current += 1;
          window.turnstile.reset(widgetRef.current);
          return;
        }
        onToken('');
        onFailureRef.current?.();
      }

      function renderWidget() {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        if (widgetRef.current) return; // já renderizado nesta montagem

        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            retriesRef.current = 0; // sucesso zera o budget de retries
            onToken(token);
          },
          'expired-callback': () => {
            // Token expirou (~300s) — renovação normal, não falha de challenge.
            retriesRef.current = 0;
            if (widgetRef.current && window.turnstile) {
              window.turnstile.reset(widgetRef.current);
            }
            onToken('');
          },
          'error-callback': handleChallengeError,
          // Timeout do desafio: apenas OBSERVA. O widget da Cloudflare se
          // auto-reseta neste evento — um reset manual aqui seria um segundo
          // mecanismo concorrente, e decrementar o budget de error aqui
          // queimaria retries à toa (timeout é espera, não erro estrutural).
          'timeout-callback': () => {},
          theme: 'light',
          size: 'flexible',
        });
      }

      loadTurnstileScript()
        .then(() => {
          // O script terminou de carregar (o onload resolveu a Promise), então
          // a API `window.turnstile` está pronta e `render()` pode ser chamado
          // direto — o onload já é a garantia de prontidão.
          if (!cancelled) renderWidget();
        })
        .catch(() => {
          // Script não carregou (rede ruim, bloqueio, CDN fora). Sinaliza
          // falha terminal: token vazio para o consumidor sair do estado de
          // espera + onFailure para o form oferecer recuperação.
          if (!cancelled) {
            onToken('');
            onFailureRef.current?.();
          }
        });

      return () => {
        cancelled = true;
        // Remove o widget desta montagem para não deixar instância órfã nem
        // colidir com a próxima montagem (Strict Mode). `remove` pode lançar se
        // o id já não existe — ignoramos.
        if (widgetRef.current && window.turnstile?.remove) {
          try {
            window.turnstile.remove(widgetRef.current);
          } catch {
            /* widget já removido pela Cloudflare */
          }
        }
        widgetRef.current = null;
        retriesRef.current = 0;
      };
    }, [siteKey, onToken]);

    // Em dev sem siteKey, não renderizar nada
    if (!siteKey) return null;

    return <div ref={containerRef} className={className} />;
  },
);
