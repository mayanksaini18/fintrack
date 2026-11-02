import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/dashboard',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/transactions',
  '/api/insights',
  // Checks its own auth: CRON_SECRET for the daily cron (GET), the Clerk session for "Process Due" (POST)
  '/api/recurring/process',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
