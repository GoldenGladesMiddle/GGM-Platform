'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function HeaderNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
      <a href="/#openings" className="hover:text-blue-900 transition">Search Openings</a>
      <a href="/#departments" className="hover:text-blue-900 transition">Departments</a>
      <a href="/#how-to-apply" className="hover:text-blue-900 transition">Application Guide</a>
      <Link
        href="/applicant"
        className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold px-4 py-2 rounded-xl transition inline-flex items-center gap-2 shadow-sm"
      >
        {isAuthenticated ? 'Open Portal' : 'Connect Discord'}
      </Link>
    </nav>
  );
}