import type { MetadataRoute } from 'next';

import {
  getInfantilAvailableLessons,
  getInfantilThemes,
} from '@/lib/courses/infantil-catalog';

/**
 * Origem canônica do site para as URLs do sitemap (sempre produção — preview
 * deploys nunca devem vazar URLs próprias no sitemap). Sobrescregível por env.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aprovado.xyz';

/**
 * Sitemap do site. lastModified só entra onde existe data real mensurável:
 * páginas do infantil usam a data da última mudança de substância do
 * conteúdo (campo updatedAt da aula — data do commit do fragmento), nunca
 * timestamp de build. Páginas institucionais sem data de conteúdo por URL
 * ficam sem lastmod.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const institutionalRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/sobre` },
    { url: `${SITE_URL}/contato` },
    { url: `${SITE_URL}/termos` },
    { url: `${SITE_URL}/privacidade` },
    { url: `${SITE_URL}/cookies` },
    { url: `${SITE_URL}/infantil` },
  ];

  const themeRoutes: MetadataRoute.Sitemap = getInfantilThemes().map((entry) => ({
    url: `${SITE_URL}/infantil/${entry.ano}/${entry.materia}/${entry.tema}`,
    /* o conteúdo da porta é o catálogo: data da aula mais recentemente atualizada */
    lastModified: latestLessonDate(entry.theme.lessons.map((lesson) => lesson.updatedAt)),
  }));

  const lessonRoutes: MetadataRoute.Sitemap = getInfantilAvailableLessons().map((entry) => ({
    url: `${SITE_URL}/infantil/${entry.ano}/${entry.materia}/${entry.tema}/${entry.aula}`,
    lastModified: entry.lesson.updatedAt ? new Date(entry.lesson.updatedAt) : undefined,
  }));

  return [...institutionalRoutes, ...themeRoutes, ...lessonRoutes];
}

function latestLessonDate(dates: Array<string | undefined>): Date | undefined {
  const realDates = dates.filter((date): date is string => typeof date === 'string');
  if (realDates.length === 0) {
    return undefined;
  }
  return new Date(realDates.reduce((latest, current) => (current > latest ? current : latest)));
}
