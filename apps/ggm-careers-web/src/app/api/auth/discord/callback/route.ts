import { NextResponse } from 'next/server';

const RECRUITER_ROLE_ID = '1555928995663577088';
const GUILD_ID = process.env.DISCORD_GUILD_ID; // Your Discord server/guild ID

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/recruiter?error=no_code', request.url));
  }

  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/recruiter?error=token_failed', request.url));
    }

    // 2. Fetch user's member profile and roles in your specific Discord guild
    const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!memberResponse.ok) {
      // User is likely not in the server
      return NextResponse.redirect(new URL('/recruiter?error=not_in_server', request.url));
    }

    const memberData = await memberResponse.json();
    const userRoles: string[] = memberData.roles || [];
    
    // Check for administrator permission bit or specific recruiter role ID
    // Discord permissions bitwise check for Administrator is 0x8 (8)
    const permissions = BigInt(memberData.permissions || '0');
    const isAdmin = (permissions & 0x8n) === 0x8n;
    const hasRecruiterRole = userRoles.includes(RECRUITER_ROLE_ID);

    if (isAdmin || hasRecruiterRole) {
      // Authorized: Redirect to recruiter portal
      const response = NextResponse.redirect(new URL('/recruiter', request.url));
      // Optionally set a secure cookie confirming recruiter session
      response.cookies.set('ggm_recruiter_auth', 'true', { httpOnly: true, secure: true, path: '/' });
      return response;
    } else {
      // Unauthorized role
      return NextResponse.redirect(new URL('/recruiter?error=unauthorized_role', request.url));
    }
  } catch (err) {
    console.error('Discord OAuth Error:', err);
    return NextResponse.redirect(new URL('/recruiter?error=server_error', request.url));
  }
}