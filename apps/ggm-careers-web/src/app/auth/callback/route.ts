import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Define your custom production domain as the hardcoded base URL
  const customDomain = 'https://careers.goldengladesms.org';

  // Redirect straight to the applicant portal on your custom domain
  return NextResponse.redirect(new URL('/applicant', customDomain));
}
