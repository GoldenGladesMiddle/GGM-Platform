import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function JobApplicationPage({ params }: PageProps) {
  const { id } = params;

  // Fetch the specific job listing by ID
  const { data: job, error } = await supabase
    .from('careers_jobs')
    .select('*')
    .eq('id', id)
    .single();

  const isClosed = error || !job || job.is_open === false;
  const jobTitle = job?.title || 'this position';

  if (isClosed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Applications Closed</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Thank you for your interest in joining our team. The application window for <span className="font-semibold text-slate-900">{jobTitle}</span> has closed, and we are no longer accepting responses. Please check back at a later date or view our other open roles on our <Link href="/" className="text-blue-900 font-semibold underline hover:text-blue-700">Main Careers Page Link</Link>.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm py-3 px-6 rounded-xl transition shadow"
            >
              Return to Main Careers Page →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Active application form or details go here */}
      <h1 className="text-3xl font-black text-slate-900">{job.title} Application</h1>
      <p className="text-slate-600 text-sm">{job.description}</p>
    </div>
  );
}