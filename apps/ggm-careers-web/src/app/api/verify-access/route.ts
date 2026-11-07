import { NextRequest, NextResponse } from 'next/server';
import { checkAccess } from '@/lib/serverAccess';

export async function GET(req: NextRequest) {
  const result = await checkAccess(req);

  if (result.status === 'error') {
    return NextResponse.json({ allowed: false, reason: 'error' }, { status: 502 });
  }

  return NextResponse.json({ allowed: result.status === 'allowed', reason: result.status });
}
