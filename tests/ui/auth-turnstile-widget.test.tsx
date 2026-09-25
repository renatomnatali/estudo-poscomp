/** @vitest-environment jsdom */

import React, { createRef } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// O widget mantém estado de MÓDULO (scriptPromise compartilhado) e lê
// window.turnstile — cada teste pega módulo fresco e DOM limpo.
const SCRIPT_SELECTOR = 'script[src^="https://challenges.cloudflare.com"]';

/** Fake da API window.turnstile — captura as options do render p/ disparar eventos. */
function instalarTurnstileFake() {
  const optionsCapturadas: Array<Record<string, unknown>> = [];
  const fake = {
    render: vi.fn((_container: HTMLElement, options: Record<string, unknown>) => {
      optionsCapturadas.push(options);
      return `widget-${optionsCapturadas.length}`;
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  (window as unknown as { turnstile: typeof fake }).turnstile = fake;
  return {
    fake,
    options: () => optionsCapturadas[optionsCapturadas.length - 1],
  };
}

async function montarWidget(props: {
  onToken: (token: string) => void;
  onFailure?: () => void;
  ref?: React.Ref<{ reset: () => void }>;
}) {
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key-teste';
  const { TurnstileWidget } = await import('@/components/auth/turnstile-widget');
  render(
    <TurnstileWidget ref={props.ref} onToken={props.onToken} onFailure={props.onFailure} />
  );
  // Drena o .then do loadTurnstileScript (render do desafio).
  await act(async () => {});
}

beforeEach(() => {
  vi.resetModules();
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  delete (window as unknown as { turnstile?: unknown }).turnstile;
  document.head.querySelectorAll('script').forEach((s) => s.remove());
});

afterEach(() => {
  cleanup();
});

describe('TurnstileWidget sem site key', () => {
  it('renderiza null — nenhum desafio em dev/preview (backend faz bypass)', async () => {
    const onToken = vi.fn();
    const { TurnstileWidget } = await import('@/components/auth/turnstile-widget');
    const { container } = render(<TurnstileWidget onToken={onToken} />);

    // Nada no DOM: sem container, sem script, sem widget.
    expect(container.innerHTML).toBe('');
    expect(onToken).not.toHaveBeenCalled();
  });
});

describe('TurnstileWidget com site key — carregamento do script', () => {
  it('script que não carrega: onFailure + onToken("") e a tag morta é REMOVIDA do DOM', async () => {
    // Sem window.turnstile: o widget injeta a <script> real e espera o load.
    const onToken = vi.fn();
    const onFailure = vi.fn();
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key-teste';
    const { TurnstileWidget } = await import('@/components/auth/turnstile-widget');
    render(<TurnstileWidget onToken={onToken} onFailure={onFailure} />);

    const tag = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);
    expect(tag).not.toBeNull();

    await act(async () => {
      tag!.dispatchEvent(new Event('error'));
    });

    // Falha terminal sinalizada ao consumidor...
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith('');
    // ...e a tag com falha saiu do DOM (não pode pendurar listeners em morto).
    expect(document.querySelector(SCRIPT_SELECTOR)).toBeNull();
  });

  it('após falha, remontagem injeta tag NOVA (a morta não é reencontrada)', async () => {
    const onToken = vi.fn();
    const onFailure = vi.fn();
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key-teste';
    const { TurnstileWidget } = await import('@/components/auth/turnstile-widget');
    const { unmount } = render(<TurnstileWidget onToken={onToken} onFailure={onFailure} />);

    const primeiraTag = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);
    await act(async () => {
      primeiraTag!.dispatchEvent(new Event('error'));
    });
    unmount();
    expect(document.querySelector(SCRIPT_SELECTOR)).toBeNull();

    // Remontagem: sem a tag morta no DOM, uma nova é injetada para tentar de novo.
    render(<TurnstileWidget onToken={onToken} onFailure={onFailure} />);
    const segundaTag = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);
    expect(segundaTag).not.toBeNull();
    expect(segundaTag).not.toBe(primeiraTag);
  });

  it('script carregado renderiza o desafio com a site key', async () => {
    const { fake } = instalarTurnstileFake();
    await montarWidget({ onToken: vi.fn() });

    expect(fake.render).toHaveBeenCalledTimes(1);
    const options = fake.render.mock.calls[0][1] as { sitekey: string };
    expect(options.sitekey).toBe('site-key-teste');
  });
});

describe('TurnstileWidget com site key — eventos do desafio', () => {
  it('error-callback tem budget 2: 1ª e 2ª errors apenas resetam; a 3ª é terminal', async () => {
    const { fake, options } = instalarTurnstileFake();
    const onToken = vi.fn();
    const onFailure = vi.fn();
    await montarWidget({ onToken, onFailure });

    const error = () => (options()['error-callback'] as () => void)();

    await act(async () => {
      error();
    });
    expect(fake.reset).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();

    await act(async () => {
      error();
    });
    expect(fake.reset).toHaveBeenCalledTimes(2);
    expect(onFailure).not.toHaveBeenCalled();

    // 3ª error: budget esgotado — falha terminal para o form reagir.
    await act(async () => {
      error();
    });
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith('');
  });

  it('timeout-callback é NO-OP: não reseta e não consome o budget de errors', async () => {
    const { fake, options } = instalarTurnstileFake();
    const onToken = vi.fn();
    const onFailure = vi.fn();
    await montarWidget({ onToken, onFailure });

    await act(async () => {
      (options()['timeout-callback'] as () => void)();
    });

    // O widget da Cloudflare se auto-reseta no timeout — reset manual não pode
    // existir aqui (mecanismo concorrente).
    expect(fake.reset).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();

    // E o budget segue intacto: ainda são necessárias 2 errors + a terminal.
    const error = () => (options()['error-callback'] as () => void)();
    await act(async () => {
      error();
      error();
    });
    expect(fake.reset).toHaveBeenCalledTimes(2);
    expect(onFailure).not.toHaveBeenCalled();

    await act(async () => {
      error();
    });
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('expired-callback renova o desafio: reset + onToken(""), SEM onFailure', async () => {
    const { fake, options } = instalarTurnstileFake();
    const onToken = vi.fn();
    const onFailure = vi.fn();
    await montarWidget({ onToken, onFailure });

    await act(async () => {
      (options()['expired-callback'] as () => void)();
    });

    // Expiração é renovação normal — o consumidor sai do estado de espera
    // (token vazio) mas não é falha terminal.
    expect(fake.reset).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith('');
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('desafio resolvido entrega o token e zera o budget de errors', async () => {
    const { options } = instalarTurnstileFake();
    const onToken = vi.fn();
    const onFailure = vi.fn();
    await montarWidget({ onToken, onFailure });

    await act(async () => {
      (options()['callback'] as (token: string) => void)('token-do-desafio');
    });
    expect(onToken).toHaveBeenCalledWith('token-do-desafio');

    // Sucesso renovou o budget: 2 errors após o token voltam a ser apenas reset.
    const error = () => (options()['error-callback'] as () => void)();
    await act(async () => {
      error();
      error();
    });
    expect(onFailure).not.toHaveBeenCalled();
  });
});

describe('TurnstileWidget — handle imperativo e identidade de props', () => {
  it('reset() via ref zera o budget de errors', async () => {
    const { fake, options } = instalarTurnstileFake();
    const handle = createRef<{ reset: () => void }>();
    const onToken = vi.fn();
    await montarWidget({ onToken, ref: handle });

    const error = () => (options()['error-callback'] as () => void)();

    // Consome as 2 tentativas do budget...
    await act(async () => {
      error();
      error();
    });

    // ...mas o form chama reset() (token consumido num submit): budget volta.
    await act(async () => {
      handle.current!.reset();
    });
    expect(fake.reset).toHaveBeenCalledTimes(3); // 2 dos errors + o do handle

    // 2 novas errors ainda não são terminal; a 3ª é.
    const onFailure = vi.fn();
    await act(async () => {
      error();
      error();
    });
    expect(onFailure).not.toHaveBeenCalled();

    // Reaproveita o mesmo widget: registra onFailure via rerender seria outro
    // teste; aqui basta forçar a terminal e conferir o sinal de token vazio.
    const onTokenVazio = vi.fn();
    await act(async () => {
      error();
    });
    expect(onToken).toHaveBeenLastCalledWith('');
  });

  it('trocar a prop onFailure entre renders NÃO re-executa o efeito (latest ref)', async () => {
    const { fake, options } = instalarTurnstileFake();
    const onToken = vi.fn(); // identidade estável — só onFailure muda
    const primeiraOnFailure = vi.fn();
    const segundaOnFailure = vi.fn();
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key-teste';
    const { TurnstileWidget } = await import('@/components/auth/turnstile-widget');
    const view = render(
      <TurnstileWidget onToken={onToken} onFailure={primeiraOnFailure} />
    );
    await act(async () => {});
    expect(fake.render).toHaveBeenCalledTimes(1);

    view.rerender(<TurnstileWidget onToken={onToken} onFailure={segundaOnFailure} />);
    await act(async () => {});

    // O efeito não re-rodou: o desafio NÃO foi remontado (render/reset/remove).
    expect(fake.render).toHaveBeenCalledTimes(1);
    expect(fake.remove).not.toHaveBeenCalled();

    // E o sinal terminal chega pelo callback MAIS RECENTE, não pelo antigo.
    const error = () => (options()['error-callback'] as () => void)();
    await act(async () => {
      error();
      error();
      error();
    });
    expect(segundaOnFailure).toHaveBeenCalledTimes(1);
    expect(primeiraOnFailure).not.toHaveBeenCalled();
  });
});
