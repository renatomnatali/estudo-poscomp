import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';

import { NextRequest, NextResponse } from 'next/server';

import { getStudyTrackCards } from '@/lib/study-data';

const SOURCE_SUFFIX = '.source.json';
const TRACK_CODE_FROM_SLUG = /^([a-z]\d+)-/i;
const MODULE_ORDER_FROM_SLUG = /^(?:[a-z]\d+|modulo)-(\d+)/i;
const DEFAULT_MINUTES_PER_MODULE = 60;

interface ImportedTrackInfo {
  moduleCount: number;
  totalMinutes: number;
  firstSlug: string;
}

function resolveTrackCodeFromSlug(slug: string) {
  if (slug.startsWith('modulo-')) {
    return 'F6';
  }

  const match = slug.match(TRACK_CODE_FROM_SLUG);
  return match ? match[1].toUpperCase() : null;
}

function parseMinutesFromMeta(meta: string[]) {
  for (const rawItem of meta) {
    const item = String(rawItem || '').trim();
    if (!item) {
      continue;
    }

    const hourAndMinute = item.match(/(\d+)\s*h(?:\s*(\d+)\s*min)?/i);
    if (hourAndMinute) {
      const hours = Number.parseInt(hourAndMinute[1] || '0', 10);
      const minutes = Number.parseInt(hourAndMinute[2] || '0', 10);
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes > 0) {
        return totalMinutes;
      }
    }

    const onlyMinutes = item.match(/(\d+)\s*min\b/i);
    if (onlyMinutes) {
      const minutes = Number.parseInt(onlyMinutes[1] || '0', 10);
      if (minutes > 0) {
        return minutes;
      }
    }
  }

  return null;
}

function toHours(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

function compareModuleSlugs(a: string, b: string) {
  const aOrder = a.match(MODULE_ORDER_FROM_SLUG);
  const bOrder = b.match(MODULE_ORDER_FROM_SLUG);

  if (aOrder && bOrder) {
    const aValue = Number.parseInt(aOrder[1] || '0', 10);
    const bValue = Number.parseInt(bOrder[1] || '0', 10);
    if (aValue !== bValue) {
      return aValue - bValue;
    }
  }

  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

function buildTrackHref(trackCode: string, moduleSlug: string) {
  return `/trilhas/${trackCode.toLowerCase()}/${moduleSlug}`;
}

async function listImportedTrackInfo() {
  const modulesDir = path.join(process.cwd(), 'data', 'study', 'modules');
  const entries = await readdir(modulesDir, { withFileTypes: true }).catch(() => []);
  const sourceNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(SOURCE_SUFFIX))
    .map((entry) => entry.name);

  const rows = await Promise.all(
    sourceNames.map(async (name) => {
      const slug = name.slice(0, -SOURCE_SUFFIX.length);
      const trackCode = resolveTrackCodeFromSlug(slug);
      if (!trackCode) {
        return null;
      }

      let minutes = DEFAULT_MINUTES_PER_MODULE;
      const rawPayload = await readFile(path.join(modulesDir, name), 'utf8').catch(() => null);
      if (rawPayload) {
        try {
          const parsed = JSON.parse(rawPayload) as { header?: { meta?: string[] } };
          const meta = Array.isArray(parsed.header?.meta) ? parsed.header.meta : [];
          minutes = parseMinutesFromMeta(meta) ?? DEFAULT_MINUTES_PER_MODULE;
        } catch {
          minutes = DEFAULT_MINUTES_PER_MODULE;
        }
      }

      return { trackCode, slug, minutes };
    })
  );

  const aggregated = new Map<string, { slugs: string[]; totalMinutes: number }>();
  rows.forEach((row) => {
    if (!row) {
      return;
    }

    const current = aggregated.get(row.trackCode) || { slugs: [], totalMinutes: 0 };
    current.slugs.push(row.slug);
    current.totalMinutes += row.minutes;
    aggregated.set(row.trackCode, current);
  });

  const infoByTrack = new Map<string, ImportedTrackInfo>();
  aggregated.forEach((value, trackCode) => {
    const sortedSlugs = [...value.slugs].sort(compareModuleSlugs);
    if (sortedSlugs.length === 0) {
      return;
    }

    infoByTrack.set(trackCode, {
      moduleCount: sortedSlugs.length,
      totalMinutes: value.totalMinutes,
      firstSlug: sortedSlugs[0],
    });
  });

  return infoByTrack;
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'all';
  const importedInfo = await listImportedTrackInfo();

  const items = getStudyTrackCards()
    .map((item) => {
      const trackInfo = importedInfo.get(item.code);
      if (!trackInfo) {
        return item;
      }

      const unlockedItem =
        item.status === 'locked'
          ? {
              ...item,
              status: 'free' as const,
              free: true,
              progressPercent: item.progressPercent,
            }
          : item;

      return {
        ...unlockedItem,
        estimatedModules: trackInfo.moduleCount,
        estimatedHours: toHours(trackInfo.totalMinutes),
        href: unlockedItem.href || buildTrackHref(item.code, trackInfo.firstSlug),
      };
    })
    .filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'free') return item.free;
      if (filter === 'done') return item.status === 'done';
      if (filter === 'fund') return item.macroArea === 'fundamentos';
      if (filter === 'mat') return item.macroArea === 'matematica';
      if (filter === 'tec') return item.macroArea === 'tecnologia';
      return true;
    });

  return NextResponse.json({ items });
}
