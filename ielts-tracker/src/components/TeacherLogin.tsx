'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Lock } from 'lucide-react';

export const TeacherLogin = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-teacher-login', handleOpen);
    return () => window.removeEventListener('open-teacher-login', handleOpen);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userid === 'teachJasurbek' && password === 'teachOne') {
      localStorage.setItem('is_teacher', 'true');
      window.location.href = '/teacher';
    } else {
      setError('Invalid credentials');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full glass p-8 rounded-2xl shadow-2xl relative"
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-muted transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-accent" size={28} />
          </div>
          <h3 className="text-2xl font-bold">Teacher Portal</h3>
          <p className="text-sm text-muted">Access Restricted to Faculty</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase ml-1">Static ID</label>
            <div className="relative">
              <input
                type="text"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-accent/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase ml-1">Access Key</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-accent/50 outline-none transition-all"
                required
              />
              <Lock className="absolute right-4 top-3.5 text-white/20" size={18} />
            </div>
          </div>

          {error && <p className="text-xs text-accent font-medium text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-lg transition-all mt-4"
          >
            Authenticate
          </button>
        </form>
      </motion.div>
    </div>
  );
};
