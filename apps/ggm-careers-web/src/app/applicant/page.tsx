'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

interface Application {
  id: string;
  tracking_id: string;
  department: string;
  sub_department: string;
  applicant_id: string;
  applicant_name: string;
  form_data?: any;
  status?: string;
  submitted_at: string;
}

// Map raw form keys to clean, readable questions
const QUESTION_LABELS: Record<string, string> = {
  rpName: 'Roleplay Character Name / Alias',
  discordUser: 'Discord Username / Tag',
  age: 'Age / Timezone',
  experience: 'Previous Staff / Roleplay Experience',
  whyJoin: 'Why do you want to join Golden Glades Middle?',
  scenarios: 'How would you handle a staff conflict or rulebreaker?',
  activity: 'Expected Weekly Activity / Hours',
  availability: 'General Availability',
  strengths: 'What are your core strengths?',
  weaknesses: 'Areas for improvement',
};

function formatQuestionKey(key: string): string {
  if (QUESTION_LABELS[key]) return QUESTION_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());
}

export default function ApplicantPortalPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchUserDataAndApps = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const discordId = currentUser.user_metadata?.provider_id || currentUser.user_metadata?.sub || currentUser.id;
      const username = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.user_metadata?.preferred_username;

      let query = supabase
        .from('applications')
        .select('*');

      const conditions = [
        `applicant_id.eq.${discordId}`,
        `applicant_id.eq.${currentUser.id}`
      ];

      if (username) {
        conditions.push(`applicant_name.ilike.%${username}%`);
      }

      const { data, error } = await query
        .or(conditions.join(','))
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
      }

      if (data && data.length > 0) {
        setApplications(data);
      } else {
        const { data: allData } = await supabase
          .from('applications')
          .select('*')
          .order('submitted_at', { ascending: false });
        
        if (allData) {
          setApplications(allData);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUserDataAndApps();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserDataAndApps();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setApplications([]);
  };

  const handleCancelApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw/cancel this job application?')) return;

    setActionLoading(appId);

    const { error } = await supabase
      .from('applications')
      .update({ status: 'withdrawn' })
      .eq('id', appId);

    if (!error) {
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: 'withdrawn' } : app))
      );
    } else {
      alert('Failed to withdraw application. Please try again or contact HR.');
    }

    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 font-medium">
        Loading applicant portal...
      </div>
    );
  }

  // STATE 1: UNAUTHENTICATED
  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-[#5865F2]/10 text-[#5865F2] rounded-2xl flex items-center justify-center text-3xl font-black">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.91-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.92,53.88,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.92,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">Connect Your Discord</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Sign in with Discord to access the Golden Glades Applicant Portal, submit job applications, and manage active submissions.
            </p>
          </div>

          <button
            onClick={handleDiscordLogin}
            className="inline-flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md w-full max-w-sm"
          >
            Log in with Discord
          </button>
        </div>
      </div>
    );
  }

  // STATE 2: AUTHENTICATED
  const discordName = user.user_metadata?.full_name || user.user_metadata?.name || 'Applicant';
  const discordId = user.user_metadata?.provider_id || user.id;
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* APPLICANT PROFILE HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={discordName} className="w-14 h-14 rounded-2xl border border-slate-200" />
          ) : (
            <div className="w-14 h-14 bg-blue-900 text-white font-black text-xl flex items-center justify-center rounded-2xl">
              {discordName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{discordName}</h1>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Discord Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {discordId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/#openings"
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition text-center flex-1 md:flex-none shadow-sm"
          >
            Apply for Openings
          </Link>
          <button
            onClick={handleSignOut}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* SUBMITTED APPLICATIONS & MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Applications</h2>
            <p className="text-xs text-slate-500">View live status updates or review your questionnaire submissions.</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {applications.length} Total
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center text-2xl font-black">
              📋
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Submitted Applications</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven't submitted any job applications yet. Explore active openings across Golden Glades Middle departments to apply.
              </p>
            </div>
            <Link
              href="/#openings"
              className="inline-block bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              Browse Open Positions
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => {
              const statusLower = (app.status || 'pending').toLowerCase();
              const isApproved = statusLower === 'approved' || statusLower === 'accepted';
              const isRejected = statusLower === 'rejected' || statusLower === 'declined';
              const isWithdrawn = statusLower === 'withdrawn';

              return (
                <div
                  key={app.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        {app.department || 'General'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{app.sub_department || 'Position Application'}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isWithdrawn ? (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-1 rounded-full">
                          Withdrawn
                        </span>
                      ) : isApproved ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                          Accepted / Approved
                        </span>
                      ) : isRejected ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full">
                          Rejected / Closed
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
                    <div className="space-y-0.5">
                      <p><span className="text-slate-400">Applied:</span> {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Recent'}</p>
                      <p className="font-mono text-[11px] text-slate-400">Tracking ID: #{app.tracking_id || app.id.substring(0, 8)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        View Answers
                      </button>

                      {!isWithdrawn && !isApproved && !isRejected && (
                        <button
                          onClick={() => handleCancelApplication(app.id)}
                          disabled={actionLoading === app.id}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition"
                        >
                          {actionLoading === app.id ? 'Cancelling...' : 'Cancel Application'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW SUBMISSION DETAILS MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  {selectedApp.department || 'General'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedApp.sub_department || 'Application Questionnaire'}</h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Submitted Responses</h3>
              
              {selectedApp.form_data && typeof selectedApp.form_data === 'object' ? (
                <div className="space-y-3">
                  {Object.entries(selectedApp.form_data).map(([questionKey, answer]: [string, any], idx) => (
                    <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                      <p className="text-xs font-bold text-slate-700">{formatQuestionKey(questionKey)}</p>
                      <p className="text-sm text-slate-900 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                        {typeof answer === 'object' ? JSON.stringify(answer, null, 2) : String(answer)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                  No questionnaire answers found.
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}