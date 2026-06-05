'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Shield, User, LogOut } from 'lucide-react';

export function Navbar() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem('student_name'));
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/8 flex items-center px-6 justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-sm font-black gradient-text">I7</span>
        </div>
        <span className="font-extrabold text-lg gradient-text">IELTS 7+</span>
      </Link>

      <div className="flex items-center gap-3">
        {name && (
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-sm font-medium">
            <User size={14} className="text-primary" />
            {name}
          </div>
        )}
        {name && (
          <button
            title="Change student"
            onClick={() => { localStorage.removeItem('student_name'); window.location.href = '/'; }}
            className="p-2 hover:bg-white/10 rounded-full text-muted hover:text-accent transition-colors">
            <LogOut size={16} />
          </button>
        )}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-teacher-login'))}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10
                     rounded-xl transition-all hover:border-accent/40 text-sm font-semibold group">
          <Shield size={15} className="text-accent group-hover:scale-110 transition-transform" />
          Teacher
        </button>
      </div>
    </nav>
  );
}
