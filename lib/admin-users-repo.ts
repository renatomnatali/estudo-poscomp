import { db } from '@/lib/db';
import {
  resolvePremiumAccessFromRecords,
  type AccessGrantRecord,
  type SubscriptionRecord,
} from '@/lib/entitlements';
import type { AdminUserSummary, AdminUsersListResponse } from '@/lib/admin-types';

interface ListAdminUsersInput {
  search?: string;
}

interface SetVipAccessInput {
  email?: string | null;
  userId?: string | null;
  enabled: boolean;
  reason?: string;
  grantedBy?: string;
}

interface DbSubscriptionRow {
  id: string;
  userId: string | null;
  emailNormalized: string | null;
  planCode: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  updatedAt: Date;
}

interface DbGrantRow {
  id: string;
  userId: string | null;
  emailNormalized: string | null;
  scope: string;
  grantType: string;
  startsAt: Date;
  endsAt: Date | null;
  revokedAt: Date | null;
  updatedAt: Date;
}

interface UserBucket {
  key: string;
  email: string | null;
  userId: string | null;
  subscriptions: SubscriptionRecord[];
  grants: AccessGrantRecord[];
  subscriptionStatus: string | null;
  updatedAt: Date | null;
}

function normalizeEmail(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || null;
}

function normalizeSearch(value?: string) {
  return String(value || '').trim().toLowerCase();
}

function toIso(value: Date | null) {
  if (!value) return null;
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function computeIdentityKey(email: string | null, userId: string | null, fallback: string) {
  if (email) return `email:${email}`;
  if (userId) return `user:${userId}`;
  return fallback;
}

function isVipGrantActive(record: AccessGrantRecord, now: Date) {
  if (String(record.scope).toLowerCase() !== 'premium_access') return false;
  if (String(record.grantType).toLowerCase() !== 'vip') return false;
  if (record.revokedAt) return false;
  if (record.startsAt && record.startsAt.getTime() > now.getTime()) return false;
  if (record.endsAt && record.endsAt.getTime() <= now.getTime()) return false;
  return true;
}

function mapSubscriptionRow(row: DbSubscriptionRow): SubscriptionRecord {
  return {
    planCode: row.planCode,
    status: row.status,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
  };
}

function mapGrantRow(row: DbGrantRow): AccessGrantRecord {
  return {
    scope: row.scope,
    grantType: row.grantType,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    revokedAt: row.revokedAt,
  };
}

function pushUpdatedAt(bucket: UserBucket, nextDate: Date) {
  if (!bucket.updatedAt || nextDate.getTime() > bucket.updatedAt.getTime()) {
    bucket.updatedAt = nextDate;
  }
}

function buildBuckets(subscriptions: DbSubscriptionRow[], grants: DbGrantRow[]) {
  const map = new Map<string, UserBucket>();

  function ensure(email: string | null, userId: string | null, fallback: string) {
    const key = computeIdentityKey(email, userId, fallback);
    const found = map.get(key);
    if (found) return found;

    const created: UserBucket = {
      key,
      email,
      userId,
      subscriptions: [],
      grants: [],
      subscriptionStatus: null,
      updatedAt: null,
    };

    map.set(key, created);
    return created;
  }

  subscriptions.forEach((row) => {
    const bucket = ensure(normalizeEmail(row.emailNormalized), row.userId || null, `sub:${row.id}`);
    bucket.subscriptions.push(mapSubscriptionRow(row));
    if (!bucket.subscriptionStatus) {
      bucket.subscriptionStatus = row.status;
    }
    pushUpdatedAt(bucket, row.updatedAt);
  });

  grants.forEach((row) => {
    const bucket = ensure(normalizeEmail(row.emailNormalized), row.userId || null, `grant:${row.id}`);
    bucket.grants.push(mapGrantRow(row));
    pushUpdatedAt(bucket, row.updatedAt);
  });

  return [...map.values()];
}

function toSummary(bucket: UserBucket, now: Date): AdminUserSummary {
  const entitlement = resolvePremiumAccessFromRecords({
    subscriptions: bucket.subscriptions,
    grants: bucket.grants,
    now,
  });

  return {
    key: bucket.key,
    email: bucket.email,
    userId: bucket.userId,
    isPremium: entitlement.isPremium,
    source: entitlement.source,
    planLabel: entitlement.planLabel,
    vipActive: bucket.grants.some((entry) => isVipGrantActive(entry, now)),
    expiresAt: entitlement.expiresAt || null,
    subscriptionStatus: bucket.subscriptionStatus,
    updatedAt: toIso(bucket.updatedAt),
  };
}

function sortSummaries(items: AdminUserSummary[]) {
  return [...items].sort((left, right) => {
    if (left.isPremium !== right.isPremium) return left.isPremium ? -1 : 1;
    const leftIdentity = (left.email || left.userId || '').toLowerCase();
    const rightIdentity = (right.email || right.userId || '').toLowerCase();
    return leftIdentity.localeCompare(rightIdentity);
  });
}

function buildSearchWhere(search: string) {
  if (!search) return undefined;

  return {
    OR: [{ emailNormalized: { contains: search } }, { userId: { contains: search } }],
  };
}

async function queryBySearch(search?: string) {
  const normalizedSearch = normalizeSearch(search);
  const where = buildSearchWhere(normalizedSearch);

  const [subscriptions, grants] = await Promise.all([
    db.userSubscription.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 300,
    }),
    db.userAccessGrant.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 300,
    }),
  ]);

  return {
    subscriptions: subscriptions as DbSubscriptionRow[],
    grants: grants as DbGrantRow[],
  };
}

function ensureIdentityFilters(email?: string | null, userId?: string | null) {
  const filters: Array<Record<string, string>> = [];

  const emailNormalized = normalizeEmail(email);
  const normalizedUserId = String(userId || '').trim();

  if (emailNormalized) filters.push({ emailNormalized });
  if (normalizedUserId) filters.push({ userId: normalizedUserId });

  if (filters.length === 0) {
    throw new Error('Informe e-mail ou userId para alterar VIP.');
  }

  return {
    emailNormalized,
    userId: normalizedUserId || null,
    filters,
  };
}

async function loadSingleSummaryByIdentity(email?: string | null, userId?: string | null) {
  const { filters } = ensureIdentityFilters(email, userId);

  const [subscriptions, grants] = await Promise.all([
    db.userSubscription.findMany({ where: { OR: filters }, orderBy: [{ updatedAt: 'desc' }], take: 50 }),
    db.userAccessGrant.findMany({ where: { OR: filters }, orderBy: [{ updatedAt: 'desc' }], take: 50 }),
  ]);

  const buckets = buildBuckets(
    subscriptions as DbSubscriptionRow[],
    grants as DbGrantRow[]
  );

  const now = new Date();
  const items = buckets.map((bucket) => toSummary(bucket, now));

  const emailNormalized = normalizeEmail(email);
  if (emailNormalized) {
    const byEmail = items.find((entry) => entry.email === emailNormalized);
    if (byEmail) return byEmail;
  }

  const normalizedUserId = String(userId || '').trim();
  if (normalizedUserId) {
    const byUserId = items.find((entry) => entry.userId === normalizedUserId);
    if (byUserId) return byUserId;
  }

  return {
    key: emailNormalized ? `email:${emailNormalized}` : `user:${normalizedUserId}`,
    email: emailNormalized,
    userId: normalizedUserId || null,
    isPremium: false,
    source: 'none',
    planLabel: 'Plano Free',
    vipActive: false,
    expiresAt: null,
    subscriptionStatus: null,
    updatedAt: null,
  } satisfies AdminUserSummary;
}

export async function listAdminUsers(input: ListAdminUsersInput = {}): Promise<AdminUsersListResponse> {
  if (!process.env.DATABASE_URL) {
    return { items: [] };
  }

  const { subscriptions, grants } = await queryBySearch(input.search);
  const now = new Date();
  const items = sortSummaries(buildBuckets(subscriptions, grants).map((bucket) => toSummary(bucket, now)));

  return { items };
}

export async function setUserVipAccess({
  email,
  userId,
  enabled,
  reason,
  grantedBy,
}: SetVipAccessInput): Promise<AdminUserSummary> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const { emailNormalized, userId: normalizedUserId, filters } = ensureIdentityFilters(email, userId);
  const now = new Date();

  if (enabled) {
    const activeGrant = await db.userAccessGrant.findFirst({
      where: {
        scope: 'premium_access',
        grantType: 'vip',
        revokedAt: null,
        OR: filters,
        AND: [{ startsAt: { lte: now } }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
    });

    if (!activeGrant) {
      await db.userAccessGrant.create({
        data: {
          emailNormalized,
          userId: normalizedUserId,
          scope: 'premium_access',
          grantType: 'vip',
          reason: String(reason || '').trim() || null,
          grantedBy: String(grantedBy || '').trim() || null,
          startsAt: now,
        },
      });
    }
  } else {
    await db.userAccessGrant.updateMany({
      where: {
        scope: 'premium_access',
        grantType: 'vip',
        revokedAt: null,
        OR: filters,
      },
      data: { revokedAt: now },
    });
  }

  return await loadSingleSummaryByIdentity(emailNormalized, normalizedUserId);
}
