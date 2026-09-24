/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileWidget } from '@/components/auth/turnstile-widget';

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
});

afterEach(() => {
  cleanup();
});

describe('TurnstileWidget sem site key', () => {
  it('renderiza null — nenhum desafio em dev/preview (backend faz bypass)', () => {
    const onToken = vi.fn();
    const { container } = render(<TurnstileWidget onToken={onToken} />);

    // Nada no DOM: sem container, sem script, sem widget.
    expect(container.innerHTML).toBe('');
    expect(onToken).not.toHaveBeenCalled();
  });
});
