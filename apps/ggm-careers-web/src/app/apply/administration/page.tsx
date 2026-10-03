import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import ApplyButton from '@/components/ApplyButton';

export const revalidate = 0;

interface Job {
  id: string | number;
  title: string;
  department: string;
  description: string;
  is_open: boolean;
  route?: string | null;
}

export default async function AdministrationPage() {
  const { data: jobs, error } = await supabase
    .from('careers_jobs')
    .select('*')
    .eq('is_open', true)
    .order('created_at', { ascending: false });

  const jobList: Job[] = jobs || [];

  const adminRoles = [
    { name: 'School Administrator', slug: 'school-administrator', icon: '🏫', description: 'School Leadership, Executive Management & Principal Office', applicationUrl: '/apply/administration/school-administrator' },
    { name: 'Office Secretary', slug: 'office-secretary', icon: '📋', description: 'Front Desk Operations, Student Attendance & Administrative Support', applicationUrl: '/apply/administration/office-secretary' },
    { name: 'Security', slug: 'security', icon: '🛡️', description: 'Campus Safety, Hall Monitoring, Gate Control & Student Oversight', applicationUrl: '/apply/administration/security' },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold text-blue-900">
          <Link href="/" className="hover:underline">← Back to Job Board</Link>
          <span>/</span>
          <span>Administration Department</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Administration & Support Roles
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed">
          Explore our administrative leadership, secretarial support, and campus security positions below. Review open listings and submit your application.
        </p>
      </div>

      {error && (
        <div className="p-4 text-red-800 bg-red-50 border border-red-200 rounded-2xl text-sm">
          <span className="font-bold block">Notice:</span> Unable to load live positions from database at the moment. You can still view administrative roles below.
        </div>
      )}

      {/* ADMIN ROLES & OPEN POSITIONS */}
      <div className="space-y-8">
        {adminRoles.map((role) => {
          const roleJobs = jobList.filter((job: Job) => {
            const dept = job.department.toLowerCase().trim();
            const title = job.title.toLowerCase().trim();
            const roleName = role.name.toLowerCase().trim();
            const roleSlug = role.slug.toLowerCase().trim();

            return dept.includes(roleName) || dept.includes(roleSlug) || title.includes(roleName);
          });

          return (
            <div
              key={role.name}
              className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6"
            >
              {/* Role Info Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-start gap-4">
                  <span className="text-4xl p-3 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
                    {role.icon}
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-slate-900">{role.name}</h2>
                    <p className="text-xs md:text-sm text-slate-500">{role.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                    roleJobs.length > 0 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {roleJobs.length} {roleJobs.length === 1 ? 'Open Position' : 'Open Positions'}
                  </span>
                </div>
              </div>

              {/* Positions List for this Role */}
              {roleJobs.length > 0 ? (
                <div className="grid gap-4">
                  {roleJobs.map((job: Job) => (
                    <div
                      key={job.id}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-400 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">ID: #{job.id}</span>
                          <span className="bg-blue-100 text-blue-900 text-xs px-2.5 py-0.5 rounded font-bold">
                            Active
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                        <p className="text-slate-600 text-xs md:text-sm line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <ApplyButton jobId={job.id} route={job.route} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-slate-600 text-xs md:text-sm font-medium">
                    No open positions currently listed for {role.name}.
                  </p>
                  <p className="text-slate-400 text-xs">
                    You can still submit an application directly using the link below.
                  </p>
                  <div className="pt-1">
                    <Link
                      href={role.applicationUrl}
                      className="inline-flex items-center text-xs font-bold text-blue-900 hover:underline"
                    >
                      Submit {role.name} Application →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}