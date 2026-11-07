import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function requireUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await sb.auth.getUser(token);
  return error ? null : data.user;
}

export async function POST(req: NextRequest) {
  if (!(await requireUser(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const names: string[] = Array.from(
    new Set((body.usernames || []).map((n: any) => String(n).trim()).filter(Boolean))
  ).slice(0, 50) as string[];

  if (names.length === 0) return NextResponse.json({ users: {} });

  // 1. Username -> user ID
  const idRes = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: names, excludeBannedUsers: false }),
    cache: 'no-store',
  });
  if (!idRes.ok) return NextResponse.json({ error: 'Roblox lookup failed' }, { status: 502 });

  const found: any[] = (await idRes.json()).data || [];
  if (found.length === 0) return NextResponse.json({ users: {} });

  // 2. Headshots (batched) + account details (one call per user)
  const ids = found.map((u) => u.id);

  const [thumbRes, details] = await Promise.all([
    fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids.join(',')}&size=150x150&format=Png&isCircular=true`,
      { cache: 'no-store' }
    ).catch(() => null),
    Promise.all(
      found.map(async (u) => {
        try {
          const r = await fetch(`https://users.roblox.com/v1/users/${u.id}`, { cache: 'no-store' });
          return r.ok ? await r.json() : null;
        } catch {
          return null;
        }
      })
    ),
  ]);

  const thumbs: Record<number, string> = {};
  if (thumbRes && thumbRes.ok) {
    ((await thumbRes.json()).data || []).forEach((t: any) => {
      if (t.imageUrl) thumbs[t.targetId] = t.imageUrl;
    });
  }

  const users: Record<string, any> = {};
  found.forEach((u, i) => {
    users[String(u.requestedUsername || u.name).toLowerCase()] = {
      id: u.id,
      name: u.name,
      created: details[i]?.created ?? null,
      avatarUrl: thumbs[u.id] ?? null,
    };
  });

  return NextResponse.json({ users });
}
