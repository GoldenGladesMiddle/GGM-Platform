import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const RECRUITER_ROLE_ID = '1555928995663577088';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ isRecruiter: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Option A: Check against a roles table or user metadata stored via your Discord bot
    // Example fetching user roles from Supabase database:
    const { data: userRecord, error } = await supabase
      .from('user_roles') // Adjust to your table name if storing synced Discord roles
      .select('roles, is_admin')
      .eq('user_id', userId)
      .single();

    if (error || !userRecord) {
      // Fallback or handle if you check user session metadata directly
      return NextResponse.json({ isRecruiter: false });
    }

    const hasRole = userRecord.roles?.includes(RECRUITER_ROLE_ID);
    const isAdmin = userRecord.is_admin === true;

    const isRecruiter = hasRole || isAdmin;

    return NextResponse.json({ isRecruiter });
  } catch (err) {
    return NextResponse.json({ isRecruiter: false, error: 'Server error' }, { status: 500 });
  }
}