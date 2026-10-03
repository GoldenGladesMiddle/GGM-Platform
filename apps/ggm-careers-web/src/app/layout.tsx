import './globals.css';
import React from 'react';
import HeaderNav from '../components/HeaderNav';

export const metadata = {
  title: 'Golden Glades Careers | Employment Portal',
  description: 'Explore certified instructional, administrative, and support opportunities at Golden Glades Middle.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        {/* 1. TOP DARK UTILITY BAR */}
        <div className="bg-[#0b1329] text-white text-xs py-2 px-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            Golden Glades Middle School Network • Human Resources & Employment
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-medium">
            <a 
              href="https://www.goldengladesms.org" 
              className="hover:text-white transition-colors"
            >
              School Home
            </a>
            <span className="text-slate-600">|</span>
            <a 
              href="/recruiter/login" 
              className="hover:text-white transition-colors"
            >
              Recruiter Portal
            </a>
          </div>
        </div>

        {/* 2. MAIN WHITE BRANDING HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center font-black text-base shadow-sm">
                GGM
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-base leading-tight">Golden Glades Careers</h1>
                <p className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">EMPLOYMENT OPPORTUNITIES PORTAL</p>
              </div>
            </div>

            <HeaderNav />
          </div>
        </header>

        {/* MAIN PAGE CONTENT */}
        <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Golden Glades Middle School Network. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://www.goldengladesms.org" className="hover:text-white transition">www.goldengladesms.org</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}