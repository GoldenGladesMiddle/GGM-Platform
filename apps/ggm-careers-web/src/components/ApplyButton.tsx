'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ApplyButtonProps {
  jobId: string | number;
  route?: string | null;
}

export default function ApplyButton({ jobId, route }: ApplyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if the user is currently logged in via Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();

    // Determine target URL: use the custom route column if provided, otherwise fallback to /apply/[jobId]
    const targetUrl = route && route.trim() !== '' ? route : `/apply/${jobId}`;

    if (session) {
      // If logged in, send them straight to the application page
      router.push(targetUrl);
    } else {
      // If not logged in, send them to /applicant so they can log in
      router.push(`/applicant`);
    }
  };

  return (
    <button
      onClick={handleApplyClick}
      disabled={loading}
      className="w-full md:w-auto inline-flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition shadow disabled:opacity-50"
    >
      {loading ? 'Checking session...' : 'Apply Now →'}
    </button>
  );
}