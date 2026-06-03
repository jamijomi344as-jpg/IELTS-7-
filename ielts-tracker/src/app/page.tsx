'use client';

import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, LogOut, BookOpen, Award, CheckCircle, User, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [studentName, setStudentName] = useState(''); // Shunchaki Ism
  const [accessCode, setAccessCode] = useState('');   // Shunchaki Parol/Kod
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStudentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // Aktiv testlarni bazadan olish
        const { data: testsData } = await supabase
          .from('tests')
          .select('*')
          .order('scheduled_date', { ascending: false });

        // Faqat shu kirgan o'quvchining shaxsiy natijalari
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

  // Ism va parolni Supabase Auth-ga moslashtirish mantiqi
  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('Kutilmoqda...');

    // Bo'shliqlarsiz toza ism olish va uni yashirin email formatiga o'tkazish
    const cleanName = studentName.trim().toLowerCase().replace(/\s+/g, '');
    const fakeEmail = `${cleanName}@ielts.club`; // Orqa fondagi unikal email

    if (isSignUp) {
      // Yangi o'quvchi yaratish
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: accessCode,
        options: {
          data: { display_name: studentName } // Haqiqiy ismini profiliga saqlab qo'yamiz
        }
      });
      if (error) {
        setAuthMessage(`Xatolik: ${error.message}`);
      } else {
        setAuthMessage('Akkaunt yaratildi! Endi Tizimga kirish boʻlimidan kiring.');
        setIsSignUp(false);
      }
    } else {
      // Mavjud o'quvchini o'z akkauntiga kiritish
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: accessCode,
      });
      if (error) {
        setAuthMessage('Ism yoki kirish kodi notoʻgʻri!');
      } else {
        window.location.reload();
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (isLoading) return <div className="text-center py-24 font-bold text-white">IELTS Platformasi yuklanmoqda...</div>;

  // 1. ISMDAN VA KODDAN IBORAT SODDA LOGIN OYNASI
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <div className="w-full max-w-md p-8 glass border border-white/10 rounded-3xl space-y-6 bg-slate-900/50">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              {isSignUp ? <UserPlus className="text-blue-500" /> : <LogIn className="text-blue-500" />} 
              O'quvchi Portali
            </h2>
            <p className="text-sm text-slate-400">
              {isSignUp ? 'Yangi shaxsiy akkaunt ochish' : 'Oʻz akkauntingizga qayta kirish'}
            </p>
          </div>

          <form onSubmit={handleStudentAuth} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Ismingizni yozing"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500/50 text-white font-medium"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Key className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Kirish kodi (Parol)"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500/50 text-white font-medium"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer">
              {isSignUp ? 'Akkaunt yaratish' : 'Portalga kirish'}
            </button>
          </form>

          <div className="text-center text-sm">
            <button onClick={() => { setIsSignUp(!isSignUp); setAuthMessage(''); }} className="text-blue-400 hover:underline font-semibold bg-transparent border-none cursor-pointer">
              {isSignUp ? 'Akkauntingiz bormi? Tizimga kiring' : "Birinchi marta kirishingizmi? Akkaunt oching"}
            </button>
          </div>
          {authMessage && <p className="text-xs text-center font-medium bg-white/5 text-amber-400 py-2 rounded-lg">{authMessage}</p>}
        </div>
      </div>
    );
  }

  // 2. O'QUVCHI KIRGANDAN KEYINGI ASOSIY SAHIFA
  // Foydalanuvchining ismini yashirin emaildan tozalab chiroyli ko'rsatadi
  const currentStudentName = user.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT';

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 bg-slate-950 text-white min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BookOpen className="text-blue-500" /> IELTS Academic Exam Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            O'quvchi: <span className="text-blue-400 font-bold">{currentStudentName}</span>
          </p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-2 border border-white/10 bg-white/5 cursor-pointer">
          <LogOut size={16} /> Chiqish
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* AKTIV TESTLAR */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="text-emerald-500" /> Imtihon topshirish bo'limi
          </h3>
          <div className="grid gap-4">
            {availableTests.map((test) => (
              <div key={test.id} className="p-5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 mr-2">
                    {test.type}
                  </span>
                  <h4 className="font-bold text-lg inline-block">{test.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Sana: {test.scheduled_date}</p>
                </div>
                <button 
                  onClick={() => window.location.href = `/exam/${test.id}`}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  Testni boshlash
                </button>
              </div>
            ))}
            {availableTests.length === 0 && <p className="text-slate-400 text-sm">Hozirda aktiv imtihonlar mavjud emas.</p>}
          </div>
        </div>

        {/* SHAXSIY NATIJALAR RO'YXATI */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Award className="text-amber-500" /> Sizning natijalaringiz historysi
          </h3>
          <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
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
                <p className="text-sm text-slate-500 text-center py-6">Siz hali biror marta test topshirmadingiz.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
