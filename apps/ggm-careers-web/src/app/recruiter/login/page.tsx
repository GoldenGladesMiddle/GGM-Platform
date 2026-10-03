'use client';

import { supabase } from '@/lib/supabase';

export default function RecruiterLoginPage() {
  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/recruiter`,
        scopes: 'identify guilds.members.read',
      },
    });
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recruiter Portal Login</h1>
        <p className="text-slate-600 text-sm max-w-md">
          Please sign in with your authorized Discord account to access candidate reviews and management tools.
        </p>
      </div>

      <button
        onClick={handleDiscordLogin}
        className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm rounded-xl transition shadow flex items-center gap-2"
      >
        <span>Sign in with Discord</span>
      </button>
    </div>
  );
}