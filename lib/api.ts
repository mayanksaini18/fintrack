/**
 * fetch() for the app's own API that throws when the request fails, so callers can't
 * mistake a rejected save for a successful one. The error message is safe to show in a toast.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.ok) return res;

  const data: { error?: unknown } = await res.json().catch(() => ({}));
  if (typeof data.error === 'string') throw new Error(data.error);
  if (res.status === 400) throw new Error('Some details are not valid. Check them and try again.');
  if (res.status === 401) throw new Error('Your session has ended. Please sign in again.');
  throw new Error('Something went wrong. Please try again.');
}
