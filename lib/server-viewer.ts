import { auth, currentUser } from '@clerk/nextjs/server';

import { isClerkEnabledServer } from '@/lib/auth-config';
import { resolveUserEntitlements, type PremiumAccessSource } from '@/lib/entitlements';

export interface ServerViewer {
  userId?: string;
  email?: string;
  displayName?: string;
  isPremium: boolean;
  premiumSource: PremiumAccessSource;
  planLabel: 'Plano Free' | 'Plano Premium' | 'Plano VIP';
  premiumExpiresAt?: string;
}

async function resolveFallbackViewer(): Promise<ServerViewer> {
  const fallbackEmail = process.env.DEV_USER_EMAIL;
  const entitlement = await resolveUserEntitlements({
    userId: 'local-dev-user',
    email: fallbackEmail,
  });

  return {
    userId: 'local-dev-user',
    email: fallbackEmail,
    displayName: 'Estudante',
    isPremium: entitlement.isPremium,
    premiumSource: entitlement.source,
    planLabel: entitlement.planLabel,
    premiumExpiresAt: entitlement.expiresAt,
  };
}

export async function getServerViewer(): Promise<ServerViewer> {
  if (!isClerkEnabledServer()) {
    return await resolveFallbackViewer();
  }

  try {
    const session = await auth();
    if (!session.userId) {
      return {
        isPremium: false,
        premiumSource: 'none',
        planLabel: 'Plano Free',
      };
    }

    const user = typeof currentUser === 'function' ? await currentUser().catch(() => null) : null;
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      undefined;
    const entitlement = await resolveUserEntitlements({ userId: session.userId, email });

    return {
      userId: session.userId,
      email,
      displayName: user?.fullName || user?.username || user?.firstName || 'Estudante',
      isPremium: entitlement.isPremium,
      premiumSource: entitlement.source,
      planLabel: entitlement.planLabel,
      premiumExpiresAt: entitlement.expiresAt,
    };
  } catch {
    return {
      isPremium: false,
      premiumSource: 'none',
      planLabel: 'Plano Free',
    };
  }
}
