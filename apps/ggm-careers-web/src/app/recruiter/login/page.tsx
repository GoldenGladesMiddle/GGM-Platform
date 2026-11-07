'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasRecruiterAccess } from '@/lib/recruiterAccess';

// ---- EDIT THESE ----
// Direct link to your Discord support / ticket channel (right-click the channel > Copy Link).
const DISCORD_SUPPORT_URL = 'https://discord.com/channels/YOUR_SERVER_ID/YOUR_TICKET_CHANNEL_ID';
// Link to your internal HR Data Privacy Policy page.
const PRIVACY_URL = '/privacy';
// If someone types a plain username (no @), this domain is added to build their login email.
// Create their Supabase account with that same email, e.g. alex@recruiters.goldenglades.local
const USERNAME_EMAIL_DOMAIN = 'recruiters.goldenglades.local';
// --------------------

export default function RecruiterLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'timeout') {
      setNotice('You were signed out after a period of inactivity. Please sign in again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    const identifier = username.trim();
    const email = identifier.includes('@')
      ? identifier
      : `${identifier.toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    // Same message for every credential problem so we never reveal which field was wrong.
    if (authError || !data.user) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Role verification: recruiters and admins only.
    try {
      const allowed = await hasRecruiterAccess(data.user);
      if (!allowed) {
        await supabase.auth.signOut();
        setError('This account is not authorized to access the recruiter portal.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Role check failed:', err);
      await supabase.auth.signOut();
      setError('We could not verify your access. Please try again or contact support.');
      setLoading(false);
      return;
    }

    // Optional MFA: only triggers if this account has a verified authenticator app.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        setFactorId(totp.id);
        setStep('mfa');
        setLoading(false);
        return;
      }
    }

    router.push('/recruiter');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (mfaError) {
      setError('Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    router.push('/recruiter');
  };

  const cancelMfa = async () => {
    await supabase.auth.signOut();
    setStep('credentials');
    setPassword('');
    setCode('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-5">
      {/* BRANDING */}
      <div className="text-center space-y-3">
        <Image
          src="/logo.png"
          alt="Golden Glades Middle School logo"
          width={64}
          height={64}
          className="mx-auto object-contain"
          priority
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruiter & Staff Management Portal</h1>
          <p className="text-slate-500 text-sm">Golden Glades Middle School Human Resources</p>
        </div>
      </div>

      {/* AUTHORIZED PERSONNEL DISCLAIMER */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
        <span className="text-lg leading-none">🔒</span>
        <p className="text-xs leading-relaxed font-medium">
          This portal is restricted to authorized internal personnel only. Unauthorized access attempts are monitored and recorded.
        </p>
      </div>

      {/* LOGIN CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        {notice && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
            {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-bold text-slate-700">
                Work Email / Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com or username"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Log In to Recruiter Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-900">Two-Step Verification</h2>
              <p className="text-xs text-slate-500">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>
            </div>

            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl tracking-[0.5em] font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={cancelMfa}
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              ← Cancel and sign out
            </button>
          </form>
        )}

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          For your security, you will be signed out automatically after 30 minutes of inactivity.
        </p>
      </div>

      {/* DISCORD SUPPORT CALLOUT */}
      <div className="bg-slate-900 rounded-3xl p-5 text-center space-y-3">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white">Forgot your password or locked out?</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Password resets and access provisioning are handled manually by IT support. Open a support ticket in our Discord server and a team member will help you.
          </p>
        </div>
        <a
          href={DISCORD_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl transition"
        >
          Open a Support Ticket in Discord →
        </a>
      </div>

      {/* FOOTER LINKS */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        <Link href={PRIVACY_URL} className="hover:text-slate-900 transition">
          HR Data Privacy Policy
        </Link>
        <span className="text-slate-300">|</span>
        <Link href="/" className="hover:text-slate-900 transition">
          Back to Careers Site
        </Link>
      </div>
    </div>
  );
}
