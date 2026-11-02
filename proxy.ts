import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

// Paths anyone can load. Every API route still checks auth() itself.
const PUBLIC_PATHS = new Set([
  '/',
  '/dashboard',
  '/api/transactions',
  '/api/insights',
  // Checks its own auth: CRON_SECRET for the daily cron (GET), the Clerk session for "Process Due" (POST)
  '/api/recurring/process',
  // Browsers fetch the PWA manifest without a session
  '/manifest.json',
]);

const isUnder = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

const isPublic = (path: string) => PUBLIC_PATHS.has(path) || isUnder(path, '/sign-in') || isUnder(path, '/sign-up');

export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;
  if (isPublic(path)) return;

  // API calls get a JSON 401 the app can show, instead of the 404 page auth.protect() sends
  if (isUnder(path, '/api')) {
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
