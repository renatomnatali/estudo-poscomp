import type { PremiumAccessSource } from '@/lib/entitlements';

export interface AdminUserSummary {
  key: string;
  email: string | null;
  userId: string | null;
  isPremium: boolean;
  source: PremiumAccessSource;
  planLabel: 'Plano Free' | 'Plano Premium' | 'Plano VIP';
  vipActive: boolean;
  expiresAt: string | null;
  subscriptionStatus: string | null;
  updatedAt: string | null;
}

export interface AdminUsersListResponse {
  items: AdminUserSummary[];
}
