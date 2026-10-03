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
  route?: string | null; // <-- Step 3: Added route property here
}

export default async function AcademicsPage() {
  const { data: jobs, error } = await supabase
    .from('careers_jobs')
    .select('*')
    .eq('is_open', true)
    .order('created_at', { ascending: false });

  const jobList: Job[] = jobs || [];

  const academicSubjects = [
    { 
      name: 'Science', 
      slug: 'science',
      icon: '🔬', 
      description: 'Comprehensive Science, Biology & STEM Learning',
      applicationUrl: '/apply/academics/science-instructional-assistant'
    },
    { 
      name: 'Culinary Arts', 
      slug: 'culinary-arts',
      icon: '🍳', 
      description: 'Food Preparation, Kitchen Safety & Culinary Fundamentals',
      applicationUrl: '/apply/academics/culinary-arts-instructional-assistant'
    },
    { 
      name: 'English', 
      slug: 'english',
      icon: '📚', 
      description: 'Language Arts, Literature & Writing Comprehension',
      applicationUrl: '/apply/academics/english-instructional-assistant'
    },
    { 
      name: 'Speech & Debate', 
      slug: 'speech-and-debate',
      icon: '🎙️', 
      description: 'Public Speaking, Argumentation & Forensics',
      applicationUrl: '/apply/academics/speech-and-debate-instructional-assistant'
    },
    { 
      name: 'Theatre', 
      slug: 'theatre',
      icon: '🎭', 
      description: 'Stage Performance, Drama & Production Arts',
      applicationUrl: '/apply/academics/theatre-instructional-assistant'
    },
    { 
      name: 'Art', 
      slug: 'art',
      icon: '🎨', 
      description: 'Visual Fine Arts, Painting, Sculpture & Media Design',
      applicationUrl: '/apply/academics/art-instructional-assistant'
    },
    { 
      name: 'History', 
      slug: 'history',
      icon: '📜', 
      description: 'World & American History, Social Studies & Civics',
      applicationUrl: '/apply/academics/history-instructional-assistant'
    },
    { 
      name: 'Gym', 
      slug: 'gym',
      icon: '👟', 
      description: 'Physical Education, Fitness & Campus Athletics',
      applicationUrl: '/apply/academics/gym-teacher'
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold text-blue-900">
          <Link href="/" className="hover:underline">← Back to Job Board</Link>
          <span>/</span>
          <span>Academics Department</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Academics Department & Subject Openings
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed">
          Explore our individual subject departments below. Review available teaching positions and submit your application for a specific classroom role.
        </p>
      </div>

      {error && (
        <div className="p-4 text-red-800 bg-red-50 border border-red-200 rounded-2xl text-sm">
          <span className="font-bold block">Notice:</span> Unable to load live positions from database at the moment. You can still view subject departments below.
        </div>
      )}

      {/* SUBJECT DEPARTMENTS & OPEN POSITIONS */}
      <div className="space-y-8">
        {academicSubjects.map((subject) => {
          const subjectJobs = jobList.filter((job: Job) => {
            const dept = job.department.toLowerCase().trim();
            const title = job.title.toLowerCase().trim();
            const subjectName = subject.name.toLowerCase().trim();
            
            return dept.includes(subjectName) || title.includes(subjectName);
          });

          return (
            <div
              key={subject.name}
              className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6"
            >
              {/* Subject Info Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-start gap-4">
                  <span className="text-4xl p-3 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
                    {subject.icon}
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-slate-900">{subject.name}</h2>
                    <p className="text-xs md:text-sm text-slate-500">{subject.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                    subjectJobs.length > 0 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {subjectJobs.length} {subjectJobs.length === 1 ? 'Open Position' : 'Open Positions'}
                  </span>
                </div>
              </div>

              {/* Positions List for this Subject */}
              {subjectJobs.length > 0 ? (
                <div className="grid gap-4">
                  {subjectJobs.map((job: Job) => (
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

                      {/* Step 3: Using ApplyButton and passing route */}
                      <div className="shrink-0">
                        <ApplyButton jobId={job.id} route={job.route} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-slate-600 text-xs md:text-sm font-medium">
                    No open positions currently listed for {subject.name}.
                  </p>
                  <p className="text-slate-400 text-xs">
                    You can still submit an application directly using the link below.
                  </p>
                  <div className="pt-1">
                    <Link
                      href={subject.applicationUrl}
                      className="inline-flex items-center text-xs font-bold text-blue-900 hover:underline"
                    >
                      Submit General {subject.name} Application →
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