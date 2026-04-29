/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { LandingPage } from '@/components/landing-page';

describe('LandingPage — comportamento', () => {
  afterEach(() => {
    cleanup();
  });

  describe('CTAs principais navegam para os destinos esperados', () => {
    it('liga "Começar grátis" (nav e hero) à rota /cadastro', () => {
      render(<LandingPage />);

      const cadastroLinks = screen
        .getAllByRole('link', { name: /começar grátis/i })
        .filter((l) => l.getAttribute('href') === '/cadastro');

      // Aparece no nav e no hero — pelo menos 2 entradas distintas.
      expect(cadastroLinks.length).toBeGreaterThanOrEqual(2);
      cadastroLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/cadastro');
      });
    });

    it('liga "Criar conta grátis" (pricing free e final CTA) à rota /cadastro', () => {
      render(<LandingPage />);

      const criarContaLinks = screen.getAllByRole('link', { name: /criar conta grátis/i });
      expect(criarContaLinks.length).toBeGreaterThanOrEqual(1);
      criarContaLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/cadastro');
      });
    });

    it('liga "Assinar Premium" (pricing featured) à rota /premium', () => {
      render(<LandingPage />);

      const premiumLink = screen.getByRole('link', { name: /assinar premium/i });
      expect(premiumLink).toHaveAttribute('href', '/premium');
    });

    it('liga "Ver simulador ao vivo" à âncora #por-que', () => {
      render(<LandingPage />);

      const verSimuladorLink = screen.getByRole('link', { name: /ver simulador ao vivo/i });
      expect(verSimuladorLink).toHaveAttribute('href', '#por-que');
    });

    it('expõe links âncora do nav para as seções da própria página', () => {
      render(<LandingPage />);

      const expectedAnchors: Array<[RegExp, string]> = [
        [/por que visual/i, '#por-que'],
        [/currículo/i, '#curriculo'],
        [/por dentro/i, '#tour'],
        [/planos/i, '#planos'],
      ];

      expectedAnchors.forEach(([name, href]) => {
        // Pode aparecer no nav e/ou footer; basta que pelo menos um aponte para o destino correto.
        const matches = screen
          .getAllByRole('link', { name })
          .filter((l) => l.getAttribute('href') === href);
        expect(matches.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Currículo é interativo', () => {
    it('abre o painel de detalhe em F6 (free) por padrão', () => {
      const { container } = render(<LandingPage />);

      const status = container.querySelector('.td-status') as HTMLElement | null;
      expect(status).not.toBeNull();
      // Estado inicial mostra o tópico free (F6 — Linguagens Formais).
      expect(status!.className).toContain('free');
      expect(status!.className).not.toContain('premium');
    });

    it('atualiza o painel de detalhe ao clicar em outro tópico do mapa', async () => {
      const user = userEvent.setup();
      const { container } = render(<LandingPage />);

      // Antes: status free (F6).
      const statusBefore = container.querySelector('.td-status') as HTMLElement;
      expect(statusBefore.className).toContain('free');

      // Localiza o botão do tópico F1 pelo aria-label, que começa com o código.
      const f1Tile = within(
        container.querySelector('.edital-tiles') as HTMLElement,
      ).getByRole('button', { name: /^F1\b/ });

      await user.click(f1Tile);

      await waitFor(() => {
        const statusAfter = container.querySelector('.td-status') as HTMLElement;
        // F1 é status "soon" → painel mostra premium / em construção.
        expect(statusAfter.className).toContain('premium');
        expect(statusAfter.className).not.toContain('free');
      });

      // E o tile clicado fica marcado como selecionado.
      expect(f1Tile.className).toContain('selected');
    });
  });

  describe('AutomatonSim aceita interação do usuário', () => {
    it('filtra caracteres fora do alfabeto {a,b} ao digitar no input', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);

      const input = screen.getByPlaceholderText('aab') as HTMLInputElement;

      // Limpa o valor inicial e digita uma sequência com caracteres inválidos.
      await user.clear(input);
      await user.type(input, 'aXbZ9q');

      // Deve manter apenas a/b (lowercase).
      expect(input.value).toBe('ab');
    });

    it('popula o input ao clicar no chip de exemplo "aab"', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);

      const input = screen.getByPlaceholderText('aab') as HTMLInputElement;
      await user.clear(input);
      expect(input.value).toBe('');

      // Os chips ficam dentro do bloco .aut-quick — pega via role + nome exato.
      const chip = screen.getByRole('button', { name: /^aab$/ });
      await user.click(chip);

      expect(input.value).toBe('aab');
    });

    it('substitui "Simular" por "Reiniciar" ao iniciar a simulação', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);

      const input = screen.getByPlaceholderText('aab') as HTMLInputElement;
      // Garante que há entrada para simular.
      if (input.value.length === 0) {
        await user.type(input, 'aab');
      }

      const simularBtn = screen.getByRole('button', { name: /simular/i });
      await user.click(simularBtn);

      // Após o click, o botão "Simular" desaparece e "Reiniciar" aparece.
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /simular/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reiniciar/i })).toBeInTheDocument();
      });
    });
  });

  describe('BubbleSortSim aceita interação do usuário', () => {
    it('troca "Executar" por "Pausar" ao iniciar a animação', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);

      const executar = screen.getByRole('button', { name: /executar/i });
      await user.click(executar);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /executar/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
      });
    });

    it('volta ao estado inicial ao clicar em "Embaralhar" depois de iniciar', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);

      const executar = screen.getByRole('button', { name: /executar/i });
      await user.click(executar);

      // Confirma que entrou em modo running.
      const pausar = await screen.findByRole('button', { name: /pausar/i });
      expect(pausar).toBeInTheDocument();

      // Clica em embaralhar — deve ressetar e voltar a expor "Executar".
      const embaralhar = screen.getByRole('button', { name: /embaralhar/i });
      await user.click(embaralhar);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /executar/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /pausar/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Footer expõe links institucionais corretos', () => {
    it('aponta para as 5 páginas institucionais com hrefs corretos', () => {
      render(<LandingPage />);

      const expected: Array<[RegExp, string]> = [
        [/^sobre$/i, '/sobre'],
        [/^contato$/i, '/contato'],
        [/^termos$/i, '/termos'],
        [/^privacidade$/i, '/privacidade'],
        [/^cookies$/i, '/cookies'],
      ];

      expected.forEach(([name, href]) => {
        const link = screen.getByRole('link', { name });
        expect(link).toHaveAttribute('href', href);
      });
    });
  });
});
