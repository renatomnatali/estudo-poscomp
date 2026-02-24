/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AfnConversionPanel } from '@/components/modules/afn-conversion-panel';

describe('AfnConversionPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('converte automaticamente no primeiro clique de teste de palavra', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          subsetMap: {
            S0: ['q0', 'q1'],
            S1: ['q1'],
            S2: ['q2'],
            S3: [],
          },
          subsetKeyMap: {
            'q0|q1': 'S0',
            q1: 'S1',
            q2: 'S2',
            '∅': 'S3',
          },
          dfa: {
            alphabet: ['a', 'b'],
            states: ['S0', 'S1', 'S2', 'S3'],
            initialState: 'S0',
            acceptStates: ['S2'],
            transitions: {
              S0: { a: 'S1', b: 'S2' },
              S1: { a: 'S1', b: 'S2' },
              S2: { a: 'S3', b: 'S3' },
              S3: { a: 'S3', b: 'S3' },
            },
          },
        }),
      })
    );

    render(<AfnConversionPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Testar ab' }));

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument();
    });
  });
});
