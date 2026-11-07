'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
  updated_at?: string;
  claimed_by?: string | null;
  claimed_by_name?: string | null;
}

interface RobloxInfo {
  id: number;
  name: string;
  created: string | null;
  avatarUrl: string | null;
}

type Stage = 'pending' | 'background_check' | 'approved' | 'rejected' | 'blacklisted';

const RECRUITER_ROLE_ID = '1555928995663577088';

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

const STAGE_META: Record<Stage, { label: string; pill: string }> = {
  pending: { label: 'Pending', pill: 'bg-amber-50 text-amber-800 border border-amber-200' },
  background_check: { label: 'Background Check', pill: 'bg-violet-50 text-violet-800 border border-violet-200' },
  approved: { label: 'Approved', pill: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  rejected: { label: 'Rejected', pill: 'bg-red-50 text-red-800 border border-red-200' },
  blacklisted: { label: 'Blacklisted', pill: 'bg-slate-900 text-white border border-slate-900' },
};

const FILTER_TABS: { key: 'all' | Stage; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'background_check', label: 'Background Check' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'blacklisted', label: 'Blacklisted' },
];

function normalizeStatus(s?: string): Stage {
  const v = (s || 'pending').toLowerCase().replace(/[\s-]+/g, '_');
  if (v === 'accepted' || v === 'approved') return 'approved';
  if (v === 'declined' || v === 'rejected') return 'rejected';
  if (v === 'background_check' || v === 'backgroundcheck') return 'background_check';
  if (v === 'blacklisted' || v === 'blacklist') return 'blacklisted';
  return 'pending';
}

function formatQuestionKey(key: string): string {
  if (QUESTION_LABELS[key]) return QUESTION_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());
}

// The Roblox username is taken from the form if it has one, otherwise from the applicant name.
function getRobloxName(app: Application): string {
  const fd = app.form_data && typeof app.form_data === 'object' ? app.form_data : {};
  return String(fd.robloxUsername || fd.roblox_username || fd.robloxName || app.applicant_name || '').trim();
}

function accountAgeDays(created?: string | null): number | null {
  if (!created) return null;
  return Math.floor((Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24));
}

export default function RecruiterPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'all' | Stage>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [roblox, setRoblox] = useState<Record<string, RobloxInfo | null>>({});
  const requestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function verifyAccess() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/recruiter/login');
        return;
      }

      const u = session.user;
      setCurrentUser({
        id: u.id,
        name:
          u.user_metadata?.custom_claims?.global_name ||
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email ||
          'Recruiter',
      });

      const providerToken = (session as any).provider_token;

      try {
        const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}/member`, {
          headers: { Authorization: `Bearer ${providerToken}` },
        });

        if (memberRes.ok) {
          const memberData = await memberRes.json();
          const roles: string[] = memberData.roles || [];
          const permissions = BigInt(memberData.permissions || '0');
          const isAdmin = (permissions & 0x8n) === 0x8n;

          if (isAdmin || roles.includes(RECRUITER_ROLE_ID)) {
            setAuthorized(true);
            fetchApplications();
          } else {
            setAuthorized(false);
          }
        } else {
          setAuthorized(true);
          fetchApplications();
        }
      } catch (err) {
        console.error('Role verification error:', err);
        setAuthorized(true);
        fetchApplications();
      } finally {
        setLoading(false);
      }
    }

    verifyAccess();
  }, [router]);

  // Look up Roblox avatars + account creation dates for any new usernames.
  useEffect(() => {
    if (!authorized || applications.length === 0) return;

    const names = Array.from(
      new Set(
        applications
          .map(getRobloxName)
          .filter((n) => n && !requestedRef.current.has(n.toLowerCase()))
      )
    );
    if (names.length === 0) return;
    names.forEach((n) => requestedRef.current.add(n.toLowerCase()));

    (async () => {
      const token = await getToken();
      if (!token) return;

      for (let i = 0; i < names.length; i += 50) {
        const chunk = names.slice(i, i + 50);
        try {
          const res = await fetch('/api/roblox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ usernames: chunk }),
          });
          if (!res.ok) continue;
          const json = await res.json();
          setRoblox((prev) => {
            const next = { ...prev };
            chunk.forEach((n) => {
              next[n.toLowerCase()] = json.users?.[n.toLowerCase()] ?? null;
            });
            return next;
          });
        } catch (err) {
          console.error('Roblox lookup failed:', err);
        }
      }
    })();
  }, [applications, authorized]);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function fetchApplications() {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    } else {
      console.error('Error fetching recruiter applications:', error);
    }
  }

  const patchApp = async (id: string, patch: Record<string, any>) => {
    setActionLoading(true);

    const { error } = await supabase
      .from('applications')
      .update(patch)
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error);
      alert('Failed to save to database: ' + error.message);
      setActionLoading(false);
      return;
    }

    await fetchApplications();

    if (selectedApp && selectedApp.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, ...patch } : null));
    }

    setActionLoading(false);
  };

  const updateStatus = (id: string, newStatus: string) => patchApp(id, { status: newStatus });

  const claimApp = (app: Application, claim: boolean) => {
    if (!currentUser) return;
    return patchApp(
      app.id,
      claim
        ? { claimed_by: currentUser.id, claimed_by_name: currentUser.name }
        : { claimed_by: null, claimed_by_name: null }
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Checking recruiter permissions...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
          ⛔
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Access Restricted</h1>
        <p className="text-slate-600 text-sm max-w-md">
          Your account does not have the required Discord recruiter role or administrator access.
        </p>
        <Link href="/" className="px-5 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition">
          Return to Home
        </Link>
      </div>
    );
  }

  // Filter and search logic
  const departmentOptions = Array.from(new Set(applications.map((a) => a.department).filter(Boolean)));

  const filteredApps = applications.filter((app) => {
    if (filter !== 'all' && normalizeStatus(app.status) !== filter) return false;
    if (deptFilter !== 'all' && app.department !== deptFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = app.applicant_name?.toLowerCase().includes(q);
      const matchRoblox = getRobloxName(app).toLowerCase().includes(q);
      const matchDiscord = (app.applicant_id || '').toLowerCase().includes(q);
      const matchId = (app.tracking_id || app.id)?.toLowerCase().includes(q);
      const matchDept = (app.department || '').toLowerCase().includes(q) || (app.sub_department || '').toLowerCase().includes(q);
      return matchName || matchRoblox || matchDiscord || matchId || matchDept;
    }

    return true;
  });

  // Metrics Calculations
  const countStage = (stage: Stage) => applications.filter((a) => normalizeStatus(a.status) === stage).length;
  const uniqueOpenRoles = new Set(applications.map((app) => `${app.department}-${app.sub_department}`)).size;
  const activeCandidates = countStage('pending');
  const interviewsScheduled = countStage('approved');
  const rejectedCount = countStage('rejected');
  const backgroundCount = countStage('background_check');
  const blacklistedCount = countStage('blacklisted');

  // Accurate Time-to-Hire
  const approvedApps = applications.filter((app) => normalizeStatus(app.status) === 'approved' && app.submitted_at);

  let avgTimeToHireFormatted = 'N/A';
  if (approvedApps.length > 0) {
    const totalDays = approvedApps.reduce((acc, app) => {
      const subTime = new Date(app.submitted_at).getTime();
      const endTime = app.updated_at ? new Date(app.updated_at).getTime() : Date.now();
      const diffDays = Math.max(0, (endTime - subTime) / (1000 * 60 * 60 * 24));
      return acc + diffDays;
    }, 0);
    avgTimeToHireFormatted = `${(totalDays / approvedApps.length).toFixed(1)} Days`;
  }

  // Department breakdown counts for metrics
  const departmentCounts: Record<string, number> = {};
  applications.forEach((app) => {
    const dept = app.department || 'General';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });

  const approvalRate = applications.length > 0 ? ((interviewsScheduled / applications.length) * 100).toFixed(1) : '0';

  const renderClaim = (app: Application) => {
    const mine = !!currentUser && app.claimed_by === currentUser.id;
    if (!app.claimed_by) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
            Unassigned
          </span>
          <button
            disabled={actionLoading}
            onClick={() => claimApp(app, true)}
            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-[10px] rounded-lg transition disabled:opacity-50"
          >
            Claim
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-blue-50 text-blue-900 border border-blue-200">
          {mine ? 'Claimed by you' : `Claimed by ${app.claimed_by_name || 'Recruiter'}`}
        </span>
        {mine && (
          <button
            disabled={actionLoading}
            onClick={() => claimApp(app, false)}
            className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition disabled:opacity-50"
          >
            Release
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative left-1/2 -translate-x-1/2 w-[min(1400px,calc(100vw_-_3rem))] space-y-6">
      {/* SUB-HEADER: BREADCRUMB BADGE + EXIT */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md uppercase tracking-wider text-[10px]">
            🛡 Recruiter Hub
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Dashboard</span>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
        >
          ← Exit to Main Site
        </Link>
      </div>

      {/* TITLE + SEARCH + DEPARTMENT FILTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recruitment Dashboard & Reports</h2>
          <p className="text-xs text-slate-500 mt-1">Manage candidate submissions, review applicant questionnaires, and analyze pipeline metrics.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
          >
            <option value="all">Department: All</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search name, Roblox, Discord ID, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            />
          </div>
        </div>
      </div>

      {/* PIPELINE SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Open Active Roles</span>
          <div className="text-2xl font-black text-slate-900">{uniqueOpenRoles}</div>
          <p className="text-[10px] text-emerald-600 font-bold">Unique roles with submissions</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Candidates</span>
          <div className="text-2xl font-black text-slate-900">{activeCandidates}</div>
          <p className="text-[10px] text-amber-600 font-bold">Awaiting initial review</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Approved / Accepted</span>
          <div className="text-2xl font-black text-slate-900">{interviewsScheduled}</div>
          <p className="text-[10px] text-blue-600 font-bold">Passed screening stage</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Time-to-Hire</span>
          <div className="text-2xl font-black text-slate-900">{avgTimeToHireFormatted}</div>
          <p className="text-[10px] text-slate-500 font-medium">Based on approved candidates</p>
        </div>
      </div>

      {/* APPLICANT QUEUE */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-sm">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.key;
              const activeClass =
                tab.key === 'blacklisted' ? 'bg-slate-900 text-white shadow-sm' :
                tab.key === 'background_check' ? 'bg-violet-600 text-white shadow-sm' :
                tab.key === 'rejected' ? 'bg-red-600 text-white shadow-sm' :
                tab.key === 'approved' ? 'bg-emerald-600 text-white shadow-sm' :
                'bg-blue-900 text-white shadow-sm';
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl transition ${active ? activeClass : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-bold">
            Showing {filteredApps.length} of {applications.length} total applications
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredApps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Avatar</th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Applied Role</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4">Roblox Account</th>
                    <th className="p-4">HR Assigned</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredApps.map((app) => {
                    const stage = normalizeStatus(app.status);
                    const meta = STAGE_META[stage];
                    const robloxName = getRobloxName(app);
                    const info = roblox[robloxName.toLowerCase()];
                    const ageDays = accountAgeDays(info?.created);
                    const locked = stage === 'approved' || stage === 'blacklisted';

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          {info?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={info.avatarUrl}
                              alt={`${robloxName} avatar`}
                              className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-sm">
                              {(robloxName || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">@{robloxName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Discord ID: {app.applicant_id || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">#{app.tracking_id || app.id.substring(0, 8)}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-700">
                          <div>{app.department || 'General'}</div>
                          <div className="text-xs text-slate-400">{app.sub_department || 'Role Application'}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="p-4 text-xs">
                          {info === undefined ? (
                            <span className="text-slate-400 animate-pulse">Looking up...</span>
                          ) : info === null ? (
                            <span className="text-red-600 font-bold">Not found on Roblox</span>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-slate-600">
                                {info.created ? `Created ${new Date(info.created).toLocaleDateString()}` : 'Created N/A'}
                              </div>
                              {ageDays !== null && ageDays < 30 && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                                  ⚠ New account · {ageDays}d
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4">{renderClaim(app)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${meta.pill}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition whitespace-nowrap"
                            >
                              Scorecard
                            </button>
                            <button
                              disabled={actionLoading || locked}
                              onClick={() => updateStatus(app.id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Approve
                            </button>
                            <select
                              disabled={actionLoading}
                              value=""
                              onChange={(e) => {
                                if (e.target.value) updateStatus(app.id, e.target.value);
                              }}
                              className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-900/20 disabled:opacity-50"
                            >
                              <option value="">Move to…</option>
                              <option value="pending">Pending</option>
                              <option value="background_check">Background Check</option>
                              <option value="rejected">Rejected</option>
                              <option value="blacklisted">Blacklisted</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center space-y-3">
              <div className="text-3xl">📭</div>
              <h3 className="text-base font-bold text-slate-900">No matching applications found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try adjusting your filter tabs or search terms to locate candidate submissions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REPORTS & METRICS ANALYTICS SECTION */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">📈 Reports & Pipeline Analytics</h3>
          <p className="text-xs text-slate-500">Comprehensive overview of staff recruitment health and department volume.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversion Breakdown Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Conversion Rate</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{approvalRate}%</span>
              <span className="text-xs text-emerald-600 font-bold">Approval Success</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Submissions</span>
                <span className="font-bold text-slate-900">{applications.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Approved / Accepted</span>
                <span className="font-bold text-emerald-600">{interviewsScheduled}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">In Background Check</span>
                <span className="font-bold text-violet-600">{backgroundCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rejected / Declined</span>
                <span className="font-bold text-red-600">{rejectedCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Blacklisted</span>
                <span className="font-bold text-slate-900">{blacklistedCount}</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submissions by Department</h4>
            <div className="space-y-3">
              {Object.keys(departmentCounts).length > 0 ? (
                Object.entries(departmentCounts).map(([dept, count], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{dept}</span>
                      <span>{count} app{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-900 h-full rounded-full"
                        style={{ width: `${Math.min(100, (count / applications.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No department data recorded yet.</p>
              )}
            </div>
          </div>

          {/* Efficiency & Processing Speed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recruitment Velocity</h4>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Average Review Turnaround</span>
                <div className="text-lg font-black text-slate-900">{avgTimeToHireFormatted}</div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Pending Queue Load</span>
                <div className="text-lg font-black text-amber-600">{activeCandidates} Candidates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* APPLICANT SCORECARD DRAWER */}
      {selectedApp && (() => {
        const stage = normalizeStatus(selectedApp.status);
        const robloxName = getRobloxName(selectedApp);
        const info = roblox[robloxName.toLowerCase()];
        const ageDays = accountAgeDays(info?.created);
        const locked = stage === 'approved' || stage === 'blacklisted';

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-end">
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {selectedApp.department || 'General'}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">{selectedApp.sub_department || 'Candidate Screening'}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {info?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={info.avatarUrl}
                      alt={`${robloxName} avatar`}
                      className="w-16 h-16 rounded-full bg-white border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xl">
                      {(robloxName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="font-black text-slate-900 text-base">@{robloxName}</div>
                    <div className="text-xs text-slate-500">
                      {info === undefined
                        ? 'Looking up Roblox account...'
                        : info === null
                        ? 'Roblox account not found'
                        : `Account created ${info.created ? new Date(info.created).toLocaleDateString() : 'N/A'}`}
                    </div>
                    {ageDays !== null && ageDays < 30 && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                        ⚠ New account · {ageDays}d old
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Candidate Name</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedApp.applicant_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Discord ID</span>
                    <span className="font-mono text-slate-700">{selectedApp.applicant_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Tracking ID</span>
                    <span className="font-mono text-slate-700">#{selectedApp.tracking_id || selectedApp.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Submitted</span>
                    <span className="text-slate-700">{selectedApp.submitted_at ? new Date(selectedApp.submitted_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium mb-1">HR Assigned</span>
                    {renderClaim(selectedApp)}
                  </div>
                </div>

                {/* QUESTIONNAIRE RESPONSES */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Screening Questionnaire Responses</h3>

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
                      No structured questionnaire data recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${STAGE_META[stage].pill}`}>
                    {STAGE_META[stage].label}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoading || locked}
                      onClick={() => updateStatus(selectedApp.id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => updateStatus(selectedApp.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus(selectedApp.id, 'background_check')}
                    className="flex-1 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    Send to Background Check
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      if (window.confirm(`Blacklist ${robloxName}? They will be flagged as blacklisted in the pipeline.`)) {
                        updateStatus(selectedApp.id, 'blacklisted');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    Blacklist
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
