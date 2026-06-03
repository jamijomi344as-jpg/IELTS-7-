'use client';

import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, LogOut, BookOpen, Award, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. O'quvchi sessiyasini va uning natijalarini tekshirish
  useEffect(() => {
    const checkStudentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // Hamma ochiq testlarni yuklash
        const { data: testsData } = await supabase
          .from('tests')
          .select('*')
          .order('scheduled_date', { ascending: false });

        // FAQAT shu o'quvchining o'ziga tegishli natijalarni yuklash (Aralashib ketmaydi!)
        const { data: subsData } = await supabase
          .from('student_submissions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('submitted_at', { ascending: false });

        if (testsData) setAvailableTests(testsData);
        if (subsData) setMySubmissions(subsData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkStudentSession();
  }, []);

  // O'quvchi Auth (Login / Sign Up) mantiqi
  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('Processing...');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthMessage(error.message);
      } else {
        setAuthMessage('Account created! Please check your email or try signing in.');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthMessage(error.message);
      } else {
        window.location.reload();
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (isLoading) return <div className="text-center py-24 font-bold text-white">Loading IELTS Platform...</div>;

  // 2. AGAR O'QUVCHI TIZIMGA KIRMAGAN BO'LSA — LOGIN OYNASI
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <div className="w-full max-w-md p-8 glass border border-white/10 rounded-3xl space-y-6 bg-slate-900/50">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              {isSignUp ? <UserPlus className="text-primary" /> : <LogIn className="text-primary" />} 
              Student Portal
            </h2>
            <p className="text-sm text-muted text-slate-400">Log in with your personal account to take IELTS mock tests and track your band score history.</p>
          </div>

          <form onSubmit={handleStudentAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Your Student Email (e.g. asror@mail.com)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-white font-medium"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-white font-medium"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all cursor-pointer bg-blue-600 hover:bg-blue-700">
              {isSignUp ? 'Create Student Account' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="text-center text-sm">
            <button onClick={() => { setIsSignUp(!isSignUp); setAuthMessage(''); }} className="text-blue-400 hover:underline font-semibold bg-transparent border-none cursor-pointer">
              {isSignUp ? 'Already have an account? Sign In' : "New here? Create your personal account"}
            </button>
          </div>
          {authMessage && <p className="text-xs text-center font-medium bg-white/5 text-amber-400 py-2 rounded-lg">{authMessage}</p>}
        </div>
      </div>
    );
  }

  // 3. O'QUVCHI TIZIMGA KIRGANDA KO'RINADIGAN ASOSIY OYNA
  return (
    <div className="container mx-auto px-6 py-12 space-y-12 bg-slate-950 text-white min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BookOpen className="text-blue-500" /> IELTS Academic Exam Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as: <span className="text-blue-400 font-bold">{user.email}</span>
          </p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-2 border border-white/10 bg-white/5 cursor-pointer">
          <LogOut size={16} /> Log Out
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* CHAP TOMON: AKTIV TESTLAR RO'YXATI */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="text-emerald-500" /> Available Mock Exams
          </h3>
          <div className="grid gap-4">
            {availableTests.map((test) => (
              <div key={test.id} className="p-5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 mr-2">
                    {test.type}
                  </span>
                  <h4 className="font-bold text-lg inline-block">{test.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Date: {test.scheduled_date}</p>
                </div>
                <button 
                  onClick={() => window.location.href = `/exam/${test.id}`}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  Start Test
                </button>
              </div>
            ))}
            {availableTests.length === 0 && <p className="text-slate-400 text-sm">No tests available at the moment.</p>}
          </div>
        </div>

        {/* O'NG TOMON: O'QUVCHINING SHAXSIY NATIJALARI (FAQAT O'ZINIKI) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Award className="text-amber-500" /> Your Score History
          </h3>
          <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
            <p className="text-xs text-slate-400">This history is linked to your account secure ID and cannot be viewed by other students.</p>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {mySubmissions.map((sub) => (
                <div key={sub.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/5">
                  <div>
                    <p className="text-xs text-slate-400">Test ID: {sub.test_id.substring(0, 8)}...</p>
                    <p className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs block text-slate-400">Band Score</span>
                    <span className="text-lg font-black text-blue-400">{sub.score_band ?? 'Pending'}</span>
                  </div>
                </div>
              ))}
              {mySubmissions.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">You haven't submitted any tests yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
