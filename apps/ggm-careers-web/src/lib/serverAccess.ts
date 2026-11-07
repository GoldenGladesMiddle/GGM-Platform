import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ---- EDIT THIS ----
// The Discord role ID for "Employment Director". (Discord: Server Settings > Roles > right-click role > Copy Role ID)
export const EMPLOYMENT_DIRECTOR_ROLE_ID = '1555928995663577088';
// -------------------

export type AccessStatus =
  | 'allowed'
  | 'unauthenticated'
  | 'no_discord_link'
  | 'not_in_server'
  | 'missing_role'
  | 'error';

/**
 * Server-side access check. Runs only on the server, so it can't be bypassed from the browser.
 * 1. Validates the Supabase session token.
 * 2. Reads the user's linked Discord ID from app_metadata (only editable by you, not by the user).
 * 3. Asks Discord (with your bot token) whether that member has the Employment Director role.
 */
export async function checkAccess(req: NextRequest): Promise<{ status: AccessStatus; user?: any }> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { status: 'unauthenticated' };

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return { status: 'unauthenticated' };

  const discordId = data.user.app_metadata?.discord_id;
  if (!discordId) return { status: 'no_discord_link' };

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID || process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!botToken || !guildId) {
  console.error('verify-access: missing env', { hasBotToken: !!botToken, hasGuildId: !!guildId });
  return { status: 'error' };
}

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${encodeURIComponent(String(discordId))}`,
      { headers: { Authorization: `Bot ${botToken}` }, cache: 'no-store' }
    );

    if (res.status === 404) return { status: 'not_in_server' };
    if (!res.ok) {
  console.error('verify-access: Discord API error', res.status, await res.text());
  return { status: 'error' };
}

    const member = await res.json();
    const roles: string[] = member.roles || [];

    return roles.includes(EMPLOYMENT_DIRECTOR_ROLE_ID)
      ? { status: 'allowed', user: data.user }
      : { status: 'missing_role' };
  } catch {
    return { status: 'error' };
  }
}
