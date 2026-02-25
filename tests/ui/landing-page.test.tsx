/** @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LandingPage } from '@/components/landing-page';

describe('landing pública', () => {
  it('exibe criar conta, entrar e demo sem login', () => {
    render(<LandingPage />);

    expect(screen.getByRole('link', { name: /criar conta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^entrar$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver demo do simulador/i })).toBeInTheDocument();
    expect(screen.getByText(/não precisa estar logado/i)).toBeInTheDocument();
  });
});
