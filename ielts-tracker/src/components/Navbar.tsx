'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Shield, User, LogOut, BookOpen } from 'lucide-react';
import { LS } from '@/lib/supabase';

export function Navbar() {
  const [name, setName]           = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem(LS.STUDENT_NAME));
    setIsTeacher(localStorage.getItem(LS.IS_TEACHER) === 'true');
  }, []);

  function logout() {
    localStorage.removeItem(LS.STUDENT_NAME);
    window.location.href = '/';
  }
  function teacherLogout() {
    localStorage.removeItem(LS.IS_TEACHER);
    window.location.href = '/';
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] glass border-b border-white/[0.07]
                    flex items-center justify-between px-5">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <BookOpen size={14} className="text-primary" />
        </div>
        <span className="font-extrabold text-base gradient-text hidden sm:block">IELTS Platform</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Student info */}
        {name && !isTeacher && (
          <>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10
                            px-3 py-1.5 rounded-full text-sm">
              <User size={13} className="text-primary" />
              <span className="font-medium max-w-[120px] truncate">{name}</span>
            </div>
            <button onClick={logout} title="Chiqish"
              className="p-2 hover:bg-white/10 rounded-full text-muted hover:text-accent transition-colors">
              <LogOut size={15} />
            </button>
          </>
        )}

        {/* Teacher mode badge */}
        {isTeacher && (
          <>
            <Link href="/teacher"
              className="text-xs bg-accent/20 text-accent border border-accent/30
                         px-3 py-1.5 rounded-full font-bold">
              Teacher Panel
            </Link>
            <button onClick={teacherLogout}
              className="p-2 hover:bg-white/10 rounded-full text-muted hover:text-accent transition-colors">
              <LogOut size={15} />
            </button>
          </>
        )}

        {/* Teacher login button */}
        {!isTeacher && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-teacher-login'))}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10
                       border border-white/10 hover:border-accent/40 rounded-xl
                       text-sm font-semibold transition-all group">
            <Shield size={14} className="text-accent group-hover:scale-110 transition-transform" />
            Teacher
          </button>
        )}
      </div>
    </nav>
  );
}
