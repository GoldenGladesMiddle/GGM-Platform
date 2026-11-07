import { supabase } from '@/lib/supabase';

export const ALLOWED_ROLES = ['recruiter', 'admin'];

/**
 * Returns true if the user is a recruiter or admin.
 * Checks app_metadata.role first (only editable by the server/service role),
 * then the user_roles table. Never use user_metadata for this: users can edit it themselves.
 * Throws if the role lookup itself fails, so callers can fail closed.
 */
export async function hasRecruiterAccess(user: { id: string; app_metadata?: any }): Promise<boolean> {
  const metaRole = user.app_metadata?.role;
  if (metaRole && ALLOWED_ROLES.includes(metaRole)) return true;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (error) throw error;

  return (data || []).some((r: { role: string }) => ALLOWED_ROLES.includes(r.role));
}
