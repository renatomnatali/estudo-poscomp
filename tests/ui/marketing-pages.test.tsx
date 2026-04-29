/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import SobrePage from '@/app/sobre/page';
import ContatoPage from '@/app/contato/page';
import TermosPage from '@/app/termos/page';
import PrivacidadePage from '@/app/privacidade/page';
import CookiesPage from '@/app/cookies/page';

interface PageCase {
  name: string;
  render: () => React.ReactElement;
  current: '/sobre' | '/contato' | '/termos' | '/privacidade' | '/cookies';
}

const PAGES: PageCase[] = [
  { name: 'Sobre', render: () => <SobrePage />, current: '/sobre' },
  { name: 'Contato', render: () => <ContatoPage />, current: '/contato' },
  { name: 'Termos', render: () => <TermosPage />, current: '/termos' },
  { name: 'Privacidade', render: () => <PrivacidadePage />, current: '/privacidade' },
  { name: 'Cookies', render: () => <CookiesPage />, current: '/cookies' },
];

const ALL_INSTITUTIONAL_HREFS: ReadonlyArray<'/sobre' | '/contato' | '/termos' | '/privacidade' | '/cookies'> = [
  '/sobre',
  '/contato',
  '/termos',
  '/privacidade',
  '/cookies',
];

describe('Páginas institucionais — comportamento de navegação', () => {
  afterEach(() => {
    cleanup();
  });

  describe.each(PAGES)('Página $name', ({ render: renderPage, current }) => {
    it('expõe pelo menos um link para a landing (/) na nav superior', () => {
      const { container } = render(renderPage());

      const nav = container.querySelector('nav.page-nav') as HTMLElement | null;
      expect(nav).not.toBeNull();

      const homeLinks = within(nav!)
        .getAllByRole('link')
        .filter((l) => l.getAttribute('href') === '/');

      expect(homeLinks.length).toBeGreaterThan(0);
    });

    it('lista exatamente as 4 outras páginas institucionais no footer (não inclui a atual)', () => {
      const { container } = render(renderPage());

      const footer = container.querySelector('footer.page-foot') as HTMLElement | null;
      expect(footer).not.toBeNull();

      const footerHrefs = within(footer!)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'))
        .filter((href): href is string => href !== null);

      // Página atual NÃO aparece no footer.
      expect(footerHrefs).not.toContain(current);

      // Todas as outras 4 aparecem.
      const expectedOthers = ALL_INSTITUTIONAL_HREFS.filter((h) => h !== current);
      expectedOthers.forEach((href) => {
        expect(footerHrefs).toContain(href);
      });
      expect(expectedOthers).toHaveLength(4);
    });
  });
});

describe('Páginas legais com sumário (TOC)', () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    { name: 'Termos', render: () => <TermosPage /> },
    { name: 'Privacidade', render: () => <PrivacidadePage /> },
  ])('$name: cada item do sumário aponta para um <h2 id="..."> existente', ({ render: renderPage }) => {
    const { container } = render(renderPage());

    const toc = container.querySelector('.toc ol') as HTMLOListElement | null;
    expect(toc).not.toBeNull();

    const tocAnchors = Array.from(toc!.querySelectorAll('a[href^="#"]'));
    // Espec diz: 12 seções cada.
    expect(tocAnchors.length).toBe(12);

    tocAnchors.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      expect(href).toMatch(/^#s\d+$/);

      const targetId = href!.slice(1);
      const target = container.querySelector(`h2#${targetId}`);
      expect(target).not.toBeNull();
    });
  });
});

describe('Página de Cookies — tabela de cookies', () => {
  afterEach(() => {
    cleanup();
  });

  it('lista os cookies do app, todos classificados como essencial ou analítica', () => {
    const { container } = render(<CookiesPage />);

    const table = container.querySelector('table.cookies-table') as HTMLTableElement | null;
    expect(table).not.toBeNull();

    const rows = table!.querySelectorAll('tbody tr');
    // O comportamento que protegemos: a tabela existe e tem pelo menos um cookie listado.
    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      const badge = row.querySelector('.badge') as HTMLElement | null;
      expect(badge).not.toBeNull();
      // Cada cookie é classificado como uma das duas categorias.
      expect(badge!.className).toMatch(/\b(essential|analytics)\b/);
    });
  });
});

describe('Página Sobre — créditos com link externo seguro', () => {
  afterEach(() => {
    cleanup();
  });

  it('expõe link externo para truecode.vercel.app abrindo em nova aba com rel seguro', () => {
    const { container } = render(<SobrePage />);

    const externalLinks = Array.from(container.querySelectorAll('a[href*="truecode.vercel.app"]'));
    expect(externalLinks.length).toBeGreaterThan(0);

    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      // Boa prática: rel deve evitar reverse tabnabbing.
      expect(link.getAttribute('rel') ?? '').toMatch(/noopener/);
    });
  });
});
