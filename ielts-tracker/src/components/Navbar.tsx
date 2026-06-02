'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Shield, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const [studentName, setStudentName] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('student_name');
    if (savedName) setStudentName(savedName);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('student_name');
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 h-16 flex items-center px-6 justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">I7</span>
        </div>
        <span className="text-xl font-bold gradient-text">IELTS 7+</span>
      </Link>

      <div className="flex items-center gap-6">
        {studentName ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <User size={16} className="text-primary" />
              <span className="text-sm font-medium">{studentName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-accent"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : null}

        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-teacher-login'))}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all hover:border-primary/50 group"
        >
          <Shield size={18} className="text-primary group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold">Teacher</span>
        </button>
      </div>
    </nav>
  );
};
