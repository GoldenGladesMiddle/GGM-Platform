'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

interface Application {
  id: string;
  job_title: string;
  department: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'accepted' | 'declined';
  created_at: string;
  notes?: string;
}

export default function ApplicantPortalPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalData = async () => {
      // 1. Get Session User
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // 2. Fetch User Applications by Discord ID or User ID
        const discordId = currentUser.user_metadata?.provider_id || currentUser.id;

        const { data, error } = await supabase
          .from('careers_applications')
          .select('*')
          .or(`discord_id.eq.${discordId},user_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setApplications(data);
        }
      }

      setLoading(false);
    };

    fetchPortalData();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
            Accepted / Hired
          </span>
        );
      case 'interview_scheduled':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-full">
            Interview Scheduled
          </span>
        );
      case 'under_review':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
            Under HR Review
          </span>
        );
      case 'declined':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full">
            Application Closed
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1 rounded-full">
            Submitted / Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 font-medium">
        Loading applicant dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center text-2xl font-black">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-900">Applicant Portal Sign In</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please connect your Discord account to view your active job applications, interview schedules, and screening status.
          </p>
          <Link
            href="/link"
            className="inline-block bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm w-full"
          >
            Connect Discord Account
          </Link>
        </div>
      </div>
    );
  }

  const discordName = user.user_metadata?.full_name || user.user_metadata?.name || 'Applicant';
  const discordId = user.user_metadata?.provider_id || user.id;
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* APPLICANT HEADER CARD */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={discordName} className="w-16 h-16 rounded-2xl border-2 border-slate-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
              {discordName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{discordName}</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Verified Discord
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {discordId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            Browse Openings
          </Link>
        </div>
      </div>

      {/* APPLICATIONS LIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Applications</h2>
            <p className="text-xs text-slate-500">Track current recruitment status and screening updates.</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {applications.length} Total Submitted
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 mx-auto bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center text-2xl">
              📄
            </div>
            <h3 className="text-base font-bold text-slate-900">No Applications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              You haven't submitted any job applications yet using this connected Discord account.
            </p>
            <div className="pt-2">
              <Link
                href="/#openings"
                className="inline-block bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
              >
                Apply for Open Positions
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {app.department}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{app.job_title}</h3>
                  </div>
                  <div>{getStatusBadge(app.status)}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-medium">Applied Date</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Application Reference</span>
                    <span className="font-mono text-slate-800">#{app.id.substring(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Discord Sync</span>
                    <span className="font-mono text-blue-900">/myhistory command ready</span>
                  </div>
                </div>

                {app.notes && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">HR Update Note:</span>
                    {app.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}