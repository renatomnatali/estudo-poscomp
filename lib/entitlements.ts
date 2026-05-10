import { db } from '@/lib/db';

export type PremiumAccessSource = 'billing' | 'vip' | 'none';

export interface UserEntitlements {
  isPremium: boolean;
  source: PremiumAccessSource;
  planLabel: 'Plano Free' | 'Plano Premium' | 'Plano VIP';
  expiresAt?: string;
}

export interface SubscriptionRecord {
  planCode: string;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd: Date | null;
}

export interface AccessGrantRecord {
  scope: string;
  grantType: string;
  startsAt: Date | null;
  endsAt: Date | null;
  revokedAt: Date | null;
}

interface ResolveFromRecordsInput {
  subscriptions: SubscriptionRecord[];
  grants: AccessGrantRecord[];
  now?: Date;
}

interface ResolveUserEntitlementsInput {
  userId?: string | null;
  email?: string | null;
}

function toIso(value?: Date | null) {
  if (!value) return undefined;
  if (Number.isNaN(value.getTime())) return undefined;
  return value.toISOString();
}

export function normalizeEmail(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function asDate(value: Date | null | undefined) {
  if (!value) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

function isSubscriptionActive(record: SubscriptionRecord, now: Date) {
  if (String(record.planCode).toLowerCase() !== 'premium') return false;

  const normalizedStatus = String(record.status).toLowerCase();
  if (normalizedStatus !== 'active' && normalizedStatus !== 'trialing') return false;

  const start = asDate(record.currentPeriodStart);
  const end = asDate(record.currentPeriodEnd);

  if (start && start.getTime() > now.getTime()) return false;
  if (end && end.getTime() <= now.getTime()) return false;

  return true;
}

function isGrantActive(record: AccessGrantRecord, now: Date) {
  if (String(record.scope).toLowerCase() !== 'premium_access') return false;

  const revokedAt = asDate(record.revokedAt);
  if (revokedAt) return false;

  const startsAt = asDate(record.startsAt);
  const endsAt = asDate(record.endsAt);

  if (startsAt && startsAt.getTime() > now.getTime()) return false;
  if (endsAt && endsAt.getTime() <= now.getTime()) return false;

  return true;
}

function sortSubscriptions(records: SubscriptionRecord[]) {
  return [...records].sort((left, right) => {
    const leftEnd = left.currentPeriodEnd ? left.currentPeriodEnd.getTime() : Number.POSITIVE_INFINITY;
    const rightEnd = right.currentPeriodEnd ? right.currentPeriodEnd.getTime() : Number.POSITIVE_INFINITY;
    return rightEnd - leftEnd;
  });
}

function sortGrants(records: AccessGrantRecord[]) {
  return [...records].sort((left, right) => {
    const leftEnd = left.endsAt ? left.endsAt.getTime() : Number.POSITIVE_INFINITY;
    const rightEnd = right.endsAt ? right.endsAt.getTime() : Number.POSITIVE_INFINITY;
    return rightEnd - leftEnd;
  });
}

export function resolvePremiumAccessFromRecords({ subscriptions, grants, now = new Date() }: ResolveFromRecordsInput) {
  const activeSubscription = sortSubscriptions(subscriptions).find((entry) => isSubscriptionActive(entry, now));
  if (activeSubscription) {
    return {
      isPremium: true,
      source: 'billing' as const,
      planLabel: 'Plano Premium' as const,
      expiresAt: toIso(activeSubscription.currentPeriodEnd),
    };
  }

  const activeGrant = sortGrants(grants).find((entry) => isGrantActive(entry, now));
  if (activeGrant) {
    return {
      isPremium: true,
      source: 'vip' as const,
      planLabel: 'Plano VIP' as const,
      expiresAt: toIso(activeGrant.endsAt),
    };
  }

  return {
    isPremium: false,
    source: 'none' as const,
    planLabel: 'Plano Free' as const,
    expiresAt: undefined,
  };
}

function buildIdentityOrFilters(userId?: string | null, emailNormalized?: string) {
  const filters: Array<Record<string, string>> = [];

  const normalizedUserId = String(userId || '').trim();
  if (normalizedUserId) filters.push({ userId: normalizedUserId });

  if (emailNormalized) filters.push({ emailNormalized });

  return filters;
}

export async function resolveUserEntitlements({ userId, email }: ResolveUserEntitlementsInput): Promise<UserEntitlements> {
  const emailNormalized = normalizeEmail(email);
  const filters = buildIdentityOrFilters(userId, emailNormalized);

  if (filters.length === 0 || !process.env.DATABASE_URL) {
    return {
      isPremium: false,
      source: 'none',
      planLabel: 'Plano Free',
    };
  }

  try {
    const prisma = db as unknown as {
      userSubscription?: {
        findMany: (input: unknown) => Promise<SubscriptionRecord[]>;
      };
      userAccessGrant?: {
        findMany: (input: unknown) => Promise<AccessGrantRecord[]>;
      };
    };

    const [subscriptions, grants] = await Promise.all([
      prisma.userSubscription?.findMany({
        where: { OR: filters },
      }) || Promise.resolve([]),
      prisma.userAccessGrant?.findMany({
        where: {
          OR: filters,
          scope: 'premium_access',
        },
      }) || Promise.resolve([]),
    ]);

    return resolvePremiumAccessFromRecords({ subscriptions, grants });
  } catch {
    return {
      isPremium: false,
      source: 'none',
      planLabel: 'Plano Free',
    };
  }
}
