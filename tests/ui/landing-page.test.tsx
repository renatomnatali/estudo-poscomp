/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LandingPage } from '@/components/landing-page';

afterEach(() => {
  cleanup();
});

describe('landing pública no padrão do mockup', () => {
  it('exibe hero com prova social e CTA principal', () => {
    render(<LandingPage />);

    expect(screen.getByText(/estude para o poscomp/i)).toBeInTheDocument();
    expect(screen.getByText(/de um jeito que/i)).toBeInTheDocument();
    expect(
      screen.getByText(/trilhas visuais e interativas cobrindo os 25 tópicos do edital/i)
    ).toBeInTheDocument();

    const start = screen.getByRole('link', { name: /começar grátis — 1 tópico completo/i });
    const how = screen.getByRole('link', { name: /ver como funciona/i });

    expect(start).toBeInTheDocument();
    expect(how).toBeInTheDocument();
  });

  it('exibe seções de funcionalidades, currículo e planos', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { name: /diferente de tudo que você já usou/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /25 tópicos\. um caminho claro/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /comece grátis\. escale quando precisar/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /do zero ao poscomp em trilhas claras/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quem usou, aprovou/i })).toBeInTheDocument();
    expect(screen.getAllByText(/simulado completo \(70 questões\)/i).length).toBeGreaterThan(0);
  });
});
