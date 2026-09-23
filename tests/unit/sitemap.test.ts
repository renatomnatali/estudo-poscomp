import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { MetadataRoute } from 'next';

import { INFANTIL_CATALOG } from '@/lib/courses/infantil-catalog';

/**
 * O SITE_URL é lido no import do módulo; a origem é fixada para o domínio
 * canônico de produção, garantindo que o teste não dependa do ambiente.
 */
vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://aprovado.xyz');

let sitemap: () => MetadataRoute.Sitemap;

beforeAll(async () => {
  ({ default: sitemap } = await import('@/app/sitemap'));
});

// Data real da última mudança de substância da aula disponível (commit do
// fragmento, registrada no catálogo) — o contrato é: lastmod vem daqui,
// nunca do timestamp de build.
const CONTEUDO_ULTIMA_ATUALIZACAO = '2026-09-23';

describe('sitemap', () => {
  it('inclui a porta do tema e a aula disponível do infantil com lastmod real do conteúdo', () => {
    const entries = sitemap();

    const tema = entries.find(
      (entry) => entry.url === 'https://aprovado.xyz/infantil/5-ano/matematica/fracoes',
    );
    const aula = entries.find(
      (entry) =>
        entry.url ===
        'https://aprovado.xyz/infantil/5-ano/matematica/fracoes/subtraindo-fracoes-com-denominadores-diferentes',
    );

    expect(tema?.lastModified).toEqual(new Date(CONTEUDO_ULTIMA_ATUALIZACAO));
    expect(aula?.lastModified).toEqual(new Date(CONTEUDO_ULTIMA_ATUALIZACAO));
  });

  it('só as URLs de conteúdo do infantil têm lastModified — páginas institucionais ficam sem data (nunca lastmod de build)', () => {
    const entries = sitemap();

    const comLastmod = entries.filter((entry) => entry.lastModified !== undefined);

    expect(comLastmod.map((entry) => entry.url).sort()).toEqual(
      [
        'https://aprovado.xyz/infantil/5-ano/matematica/fracoes',
        'https://aprovado.xyz/infantil/5-ano/matematica/fracoes/subtraindo-fracoes-com-denominadores-diferentes',
      ].sort(),
    );

    // As páginas sem data de conteúdo mensurável por URL não ganham data
    // inventada — um lastmod de build apareceria exatamente aqui.
    for (const url of ['/', '/sobre', '/contato', '/termos', '/privacidade', '/cookies', '/infantil']) {
      const entry = entries.find((e) => e.url === `https://aprovado.xyz${url}`);
      expect(entry, `entrada esperada: ${url}`).toBeDefined();
      expect(entry?.lastModified, `lastmod inesperado em ${url}`).toBeUndefined();
    }
  });

  it('todas as URLs usam a origem canônica e a aula em-breve não vira URL (não existe para o crawler)', () => {
    const entries = sitemap();

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url.startsWith('https://aprovado.xyz/')).toBe(true);
    }

    // Arrange — aulas em-breve do catálogo inteiro não têm página real.
    const slugsEmBreve = INFANTIL_CATALOG.flatMap((year) =>
      year.subjects.flatMap((subject) =>
        subject.themes.flatMap((theme) =>
          theme.lessons.filter((lesson) => lesson.status !== 'disponivel').map((lesson) => lesson.slug),
        ),
      ),
    );

    // Act + Assert
    for (const slug of slugsEmBreve) {
      const vaza = entries.some((entry) => entry.url.includes(`/${slug}`));
      expect(vaza, `aula em-breve exposta no sitemap: ${slug}`).toBe(false);
    }
  });
});
