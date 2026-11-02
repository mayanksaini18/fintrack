import { describe, expect, it, vi } from 'vitest';
import { NextRequest, type NextFetchEvent } from 'next/server';

// The real clerkMiddleware, with throwaway keys (it reads them when it loads)
vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', `pk_test_${Buffer.from('example.clerk.accounts.dev$').toString('base64')}`);
vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy');
const { default: proxy } = await import('./proxy');

const run = async (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) => {
  const res = (await proxy(new NextRequest(`https://kharcha.store${path}`, init), {} as NextFetchEvent)) as Response;
  return Object.assign(res, { path });
};
// Clerk passes a request on by rewriting it to its own URL (to forward the auth headers);
// NextResponse.next() marks it with x-middleware-next instead
const passesThrough = (res: Response & { path: string }) =>
  res.headers.get('x-middleware-next') === '1' ||
  res.headers.get('x-middleware-rewrite') === `https://kharcha.store${res.path}`;

describe('proxy', () => {
  it('lets the daily cron reach its route whatever its secret looks like', async () => {
    for (const secret of ['3f9c2a7e1b5d', 'my.cron.secret', 'a.b']) {
      const res = await run('/api/recurring/process', { headers: { authorization: `Bearer ${secret}` } });
      expect(passesThrough(res), secret).toBe(true);
    }
  });

  it('lets the Process Due button reach its route, which checks the session itself', async () => {
    expect(passesThrough(await run('/api/recurring/process', { method: 'POST' }))).toBe(true);
  });

  it('serves the PWA manifest and the demo without a session', async () => {
    for (const path of ['/manifest.json', '/', '/dashboard', '/api/transactions', '/api/insights', '/sign-in', '/sign-in/factor-one']) {
      expect(passesThrough(await run(path)), path).toBe(true);
    }
  });

  it('answers signed-out API calls with a JSON 401', async () => {
    for (const path of ['/api/budgets', '/api/ai-insights', '/api/transactions/bulk']) {
      const res = await run(path);
      expect(res.status, path).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    }
  });

  it('stops signed-out visitors at private pages but not at public ones', async () => {
    // Without browser headers Clerk answers a protected page with its 404 rewrite; a document
    // request would get the development-instance handshake for every page, public or not
    for (const path of ['/budgets', '/recurring', '/transactions', '/insights']) {
      expect(passesThrough(await run(path)), path).toBe(false);
    }
    expect(passesThrough(await run('/dashboard'))).toBe(true);
  });
});
