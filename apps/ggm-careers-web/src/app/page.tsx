import Link from 'next/link';
import { supabase } from '../lib/supabase';

export const revalidate = 0;

export default async function JobBoardPage() {
  const { data: jobs, error } = await supabase
    .from('careers_jobs')
    .select('*')
    .eq('is_open', true)
    .order('created_at', { ascending: false });

  const hasError = !!error;
  const jobList = jobs || [];
  const totalOpenings = jobList.length;
  const departments = Array.from(new Set(jobList.map((j) => j.department)));

  const defaultDepartments = [
    { name: 'Administration', icon: '🏫', description: 'School Leadership, Executive Management, Office Secretary & Security', href: '/apply/administration' },
    { name: 'Student Services', icon: '🩺', description: 'Nurse, Guidance Counselors & Student Support', href: '/apply/studentservices' },
    { name: 'Academics', icon: '📚', description: 'Science, Culinary Arts, English, Speech & Debate, Theatre, Art, History & Gym', href: '/apply/academics' },
  ];

  return (
    <div className="space-y-12">
      {/* HERO BANNER SECTION */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 md:p-12 shadow-xl overflow-hidden border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Golden Glades Middle HR Recruitment
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Build Your Career at Golden Glades
              </h1>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl font-normal">
                Join our dedicated team of educators and operational staff. Explore certified instructional, administrative, and support opportunities across all departments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="#openings"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-blue-600/30"
              >
                Explore Openings ↓
              </a>
              <a
                href="#how-to-apply"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm px-6 py-3 rounded-xl transition"
              >
                Learn How to Apply
              </a>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm rounded-2xl p-4">
                <span className="text-3xl font-black text-white block">{totalOpenings}</span>
                <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Active Job Openings</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm rounded-2xl p-4">
                <span className="text-3xl font-black text-white block">{departments.length}</span>
                <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Departments Hiring</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative">
            <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 p-8 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md shadow-2xl text-center space-y-4 max-w-sm">
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                GGM
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Golden Glades Campus</h3>
                <p className="text-xs text-slate-400 mt-1">Empowering students and supporting faculty in a modern academic environment.</p>
              </div>
              <div className="pt-2 flex justify-center gap-2 text-xs text-blue-300 font-mono">
                <span className="bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/50">Instructional</span>
                <span className="bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/50">Support</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SEARCH & FILTER TOOLBAR */}
      <div id="openings" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Current Opportunities</h2>
            <p className="text-slate-600 text-sm">Filter positions or search by department keyword.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search job title or keyword..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <select className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="">All Departments</option>
              <option value="Administration">Administration</option>
              <option value="Student Services">Student Services</option>
              <option value="Academics">Academics</option>
            </select>
          </div>
        </div>

        {hasError ? (
          <div className="flex items-center gap-3.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
            <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm">
              <span className="font-bold block">Unable to connect to job database</span>
              <span className="text-red-700">Please try refreshing the page or contact Golden Glades Human Resources.</span>
            </div>
          </div>
        ) : jobList.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              📂
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">No Open Positions Currently Available</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                All staff positions are currently filled. Check back regularly for newly published job postings or visit the school homepage for campus updates.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href="https://www.goldengladesms.org"
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                Return to School Home
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobList.map((job) => (
              <div
                key={job.id}
                className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-50 text-blue-900 text-xs px-3 py-1 rounded-md font-bold border border-blue-200">
                      {job.department}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Job ID: #{job.id}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    {job.title}
                  </h3>

                  <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/apply/${job.id}`}
                    className="w-full md:w-auto inline-flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow"
                  >
                    Apply for Position →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DEPARTMENT CARDS */}
      <div id="departments" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-2xl font-bold text-slate-900">Departments & Specialized Applications</h2>
          <p className="text-slate-600 text-sm">Select a department below to view subject and staff listings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {defaultDepartments.map((dept) => (
            <Link
              key={dept.name}
              href={dept.href}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 hover:shadow-md transition block cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <span className="text-4xl">{dept.icon}</span>
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-900 transition">
                  View Positions →
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-900 transition">{dept.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{dept.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* APPLICATION STEPS */}
      <div id="how-to-apply" className="p-8 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Application Process</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-700">
          <div className="space-y-1">
            <span className="font-bold text-blue-900">1. Submit Online</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Complete the application form with your Roblox username and Discord User ID.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-blue-900">2. Review & Screening</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Human Resources reviews qualifications and verifies applicant record status.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-blue-900">3. Track via Discord</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Check submission status anytime directly in Discord using <code className="bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200">/myhistory</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}