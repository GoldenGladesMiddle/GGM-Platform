'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

const generateTrackingId = () => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

export default function StaffApplyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [position, setPosition] = useState('Core Teacher');
  const [rpName, setRpName] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [availability, setAvailability] = useState(false);
  const [requirementsUnderstood, setRequirementsUnderstood] = useState(false);
  const [whyWork, setWhyWork] = useState('');
  const [grammarFix, setGrammarFix] = useState('');
  const [standOut, setStandOut] = useState('');
  const [disruptiveStudent, setDisruptiveStudent] = useState('');
  const [device, setDevice] = useState('Laptop/PC');
  const [estEmploymentTime, setEstEmploymentTime] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in with Discord to apply.');
      return;
    }

    if (!availability || !requirementsUnderstood) {
      alert('You must confirm that you meet the availability and requirement criteria.');
      return;
    }

    setSubmitting(true);

    const trackingId = generateTrackingId();
    const discordId = user.user_metadata?.provider_id || user.id;
    const discordTag = user.user_metadata?.full_name || user.user_metadata?.name || 'Discord User';
    const email = user.email || 'No email provided';

    const { error } = await supabase.from('careers_applications').insert([
      {
        tracking_id: trackingId,
        job_title: position,
        department: 'Staff & Faculty',
        user_id: user.id,
        discord_id: discordId,
        discord_tag: discordTag,
        email,
        rp_name: rpName,
        roblox_username: robloxUsername,
        answers: {
          whyWork,
          grammarFix,
          standOut,
          disruptiveStudent,
          device,
          estEmploymentTime,
        },
        status: 'pending',
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      alert('Failed to submit application. Please try again.');
    } else {
      alert(`Application Submitted Successfully!\n\nYour Unique Tracking ID is: ${trackingId}\n\nPlease save this ID to share with support staff if you have any inquiries.`);
      router.push('/applicant');
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto py-16 text-center text-slate-500 font-medium">Loading application form...</div>;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Connect Discord to Apply</h2>
        <p className="text-xs text-slate-600">You need to sign in with your Discord account before completing the staff application.</p>
        <Link href="/applicant" className="inline-block bg-[#5865F2] text-white font-bold text-sm px-6 py-3 rounded-xl">
          Connect Discord
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
          Staff Application Portal
        </span>
        <h1 className="text-2xl font-black text-slate-900">Golden Glades Middle School Staff Application</h1>
        <p className="text-xs text-slate-600">Please fill out all required fields accurately. Upon submission, you will receive a unique tracking ID.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">What position are you interested in applying for? *</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900"
          >
            <option value="School Security">School Security</option>
            <option value="Office Secretary">Office Secretary</option>
            <option value="Nurse">Nurse</option>
            <option value="Instructional Assistant">Instructional Assistant</option>
            <option value="Substitute Teacher">Substitute Teacher</option>
            <option value="Core Teacher">Core Teacher</option>
            <option value="Elective Teacher">Elective Teacher</option>
            <option value="Department Chair">Department Chair</option>
          </select>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3 text-xs text-blue-900">
          <p className="font-bold">Prerequisites & Commitments</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              required
              className="rounded border-blue-300 text-blue-900 focus:ring-blue-500 w-4 h-4"
            />
            <span>I understand that I must have at least three free days from Monday to Friday.</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requirementsUnderstood}
              onChange={(e) => setRequirementsUnderstood(e.target.checked)}
              required
              className="rounded border-blue-300 text-blue-900 focus:ring-blue-500 w-4 h-4"
            />
            <span>I understand and agree to the requirements for a Staff Member at GGMS.</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">RP Name (e.g. Mr. K Jordan) *</label>
            <input
              type="text"
              required
              value={rpName}
              onChange={(e) => setRpName(e.target.value)}
              placeholder="First initial and last name"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Roblox Username *</label>
            <input
              type="text"
              required
              value={robloxUsername}
              onChange={(e) => setRobloxUsername(e.target.value)}
              placeholder="Roblox username"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Why do you want to work at GGMS? *</label>
            <textarea
              rows={3}
              required
              value={whyWork}
              onChange={(e) => setWhyWork(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">How would you fix this: &quot;Welkum to golden Glades Middul. How kan I help $u?&quot; *</label>
            <input
              type="text"
              required
              value={grammarFix}
              onChange={(e) => setGrammarFix(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">What makes you stand out from other applicants? *</label>
            <textarea
              rows={2}
              required
              value={standOut}
              onChange={(e) => setStandOut(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">How would you handle a disruptive student? *</label>
            <textarea
              rows={2}
              required
              value={disruptiveStudent}
              onChange={(e) => setDisruptiveStudent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">What device do you primarily play Roblox on? *</label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900"
              >
                <option value="Laptop/PC">Laptop/PC</option>
                <option value="Mobile">Mobile</option>
                <option value="Tablet/iPad">Tablet/iPad</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Estimated employment time at GGMS? *</label>
              <input
                type="text"
                required
                value={estEmploymentTime}
                onChange={(e) => setEstEmploymentTime(e.target.value)}
                placeholder="e.g. 6 months to 1 year"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md"
        >
          {submitting ? 'Submitting Application...' : 'Submit Application & Generate Tracking ID →'}
        </button>
      </form>
    </div>
  );
}