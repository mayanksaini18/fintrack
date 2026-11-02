import { NextResponse } from 'next/server';
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
  // Browsers fetch the PWA manifest without a session
  '/manifest.json',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  // API calls get a JSON 401 the app can show, instead of the 404 page auth.protect() sends
  if (isApiRoute(request)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
