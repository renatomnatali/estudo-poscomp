import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

import { isClerkEnabledServer } from '@/lib/auth-config';

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) && isClerkEnabledServer()) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
