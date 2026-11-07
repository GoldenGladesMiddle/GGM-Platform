import { supabase } from '@/lib/supabase';

/**
 * Asks the server whether the signed-in user has the Employment Director role in Discord.
 * Throws if the check itself fails, so callers can fail closed.
 * (The optional argument is ignored; it only keeps older call sites working.)
 */
export async function hasRecruiterAccess(_user?: unknown): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const res = await fetch('/api/verify-access', {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Access verification failed');

  const json = await res.json();
  return !!json.allowed;
}
