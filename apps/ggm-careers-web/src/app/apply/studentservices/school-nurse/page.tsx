'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SchoolNurseApplicationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    robloxName: '',
    discordTag: '',
    timezone: '',
    rpName: '',
    experience: '',
    whyNurse: '',
    scenarioTriage: '',
    scenarioEmergency: '',
    hoursPerWeek: '',
    agreement: false,
  });

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/apply/studentservices/school-nurse');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    getSession();
  }, [router]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading application portal...</div>;
  }

  const username = user?.user_metadata?.preferred_username || user?.user_metadata?.name || 'Applicant';
  const avatarUrl = user?.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
  const discordId = user?.user_metadata?.provider_id || user?.id || 'N/A';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreement) {
      alert('You must confirm your commitment and agreement to school health protocols before submitting.');
      return;
    }
    setSubmitting(true);

    const trackingId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const { error } = await supabase.from('applications').insert([
      {
        tracking_id: trackingId,
        department: 'Student Services',
        sub_department: 'School Nurse',
        applicant_id: discordId,
        applicant_name: username,
        form_data: formData,
        submitted_at: new Date().toISOString(),
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert('Error submitting application. Please try again.');
    } else {
      router.push(`/portal?success=true&tracking=${trackingId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Golden Glades Middle School — School Nurse Application</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Instructions: Please complete all sections of this application thoughtfully and thoroughly. Your responses will be evaluated based on medical triage judgment, patient care ethics, communication clarity, professional demeanor, and your ability to manage student health operations on campus.
        </p>
      </div>

      {/* Applicant Profile Info Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center gap-4">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-14 h-14 rounded-full object-cover border border-slate-200 bg-slate-100"
        />
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-slate-900">{username}</h2>
          <p className="text-xs font-mono text-slate-500">ID: {discordId}</p>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-8">
        
        {/* Part 1: Applicant Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Part 1: Applicant Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Roblox Username & Display Name</label>
              <input
                type="text"
                required
                value={formData.robloxName}
                onChange={(e) => setFormData({ ...formData, robloxName: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Discord Username</label>
              <input
                type="text"
                required
                value={formData.discordTag}
                onChange={(e) => setFormData({ ...formData, discordTag: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Timezone / Region</label>
              <input
                type="text"
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Roleplay (RP) Name</label>
              <input
                type="text"
                required
                value={formData.rpName}
                onChange={(e) => setFormData({ ...formData, rpName: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Part 2: Experience & Qualifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Part 2: Experience & Qualifications</h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              What past medical, healthcare, or school nurse experience do you have within Roblox school roleplay communities or similar organizations?
            </label>
            <textarea
              required
              rows={4}
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              Why are you applying for the School Nurse position at Golden Glades Middle School, and what does providing a safe, supportive health environment mean to you?
            </label>
            <textarea
              required
              rows={4}
              value={formData.whyNurse}
              onChange={(e) => setFormData({ ...formData, whyNurse: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Part 3: Situational Judgment & Clinic Scenarios */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Part 3: Situational Judgment & Clinic Scenarios</h3>
          <p className="text-xs text-slate-500">Please read each scenario carefully and explain how you would handle it as a School Nurse.</p>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              Scenario 1: Clinic Triage & Multi-Patient Management
            </label>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              It is the middle of the school day, and your clinic is busy: a student comes in complaining of a severe headache and dizziness, another student arrives with a minor playground scrape, and a teacher calls over the radio requesting immediate assistance for a student feeling faint in class. How do you prioritize your patients, manage the clinic efficiently, and ensure everyone receives proper care?
            </p>
            <textarea
              required
              rows={4}
              value={formData.scenarioTriage}
              onChange={(e) => setFormData({ ...formData, scenarioTriage: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              Scenario 2: Medical Emergency & Communication
            </label>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              A student reports to the clinic experiencing an unexpected allergic reaction or severe medical distress, and they are unable to clearly communicate their symptoms. What steps do you take to assess the situation, administer immediate care, and coordinate with school administrators and emergency response staff?
            </p>
            <textarea
              required
              rows={4}
              value={formData.scenarioEmergency}
              onChange={(e) => setFormData({ ...formData, scenarioEmergency: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Part 4: Commitment & Availability */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Part 4: Commitment & Availability</h3>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              On average, how many hours per week can you dedicate to running the school clinic, attending staff meetings, and supporting campus health operations?
            </label>
            <input
              type="text"
              required
              value={formData.hoursPerWeek}
              onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.agreement}
                onChange={(e) => setFormData({ ...formData, agreement: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Do you understand that holding a medical role requires strict patient confidentiality, professional composure during emergencies, empathy, and adherence to school health protocols? (Yes)
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl transition shadow disabled:opacity-50"
        >
          {submitting ? 'Submitting Application...' : 'Submit School Nurse Application →'}
        </button>
      </form>
    </div>
  );
}