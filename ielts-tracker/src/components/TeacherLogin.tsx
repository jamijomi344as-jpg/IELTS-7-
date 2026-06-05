'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

export function TeacherLogin() {
  const [open, setOpen]       = useState(false);
  const [id, setId]           = useState('');
  const [pass, setPass]       = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [err, setErr]         = useState('');

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('open-teacher-login', h);
    return () => window.removeEventListener('open-teacher-login', h);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (id === 'teachJasurbek' && pass === 'teachOne') {
      localStorage.setItem('is_teacher', 'true');
      window.location.href = '/teacher';
    } else {
      setErr('Invalid ID or password.');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-sm rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <ShieldCheck size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-extrabold">Teacher Portal</h3>
              <p className="text-xs text-muted">Restricted access</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1.5">
              Teacher ID
            </label>
            <input type="text" value={id} onChange={e => { setId(e.target.value); setErr(''); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                         focus:outline-none focus:border-accent/50 transition-colors text-sm"
              placeholder="teachJasurbek" required />
          </div>
          <div>
            <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pass}
                onChange={e => { setPass(e.target.value); setErr(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11
                           focus:outline-none focus:border-accent/50 transition-colors text-sm"
                placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          {err && <p className="text-accent text-xs text-center font-semibold">{err}</p>}
          <button type="submit"
            className="w-full py-3 bg-accent hover:bg-rose-400 text-white font-bold rounded-xl
                       transition-colors flex items-center justify-center gap-2 mt-2">
            <Lock size={15} /> Authenticate
          </button>
        </form>
      </motion.div>
    </div>
  );
}
