export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';

export function isClerkEnabledServer() {
  return CLERK_PUBLISHABLE_KEY.length > 0 && CLERK_SECRET_KEY.length > 0;
}

export function isClerkEnabledClient() {
  return CLERK_PUBLISHABLE_KEY.length > 0;
}
