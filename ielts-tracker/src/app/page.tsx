'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Onboarding } from '@/components/Onboarding';
import { DailyTracker } from '@/components/DailyTracker';
import { FourteenDayTracker } from '@/components/FourteenDayTracker';
import { Calendar, GraduationCap, ArrowRight, Play, FileText, Headphones, MessageSquare, PenTool } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [studentName, setStudentName] = useState<string | null>(null);
  const [scheduledTests, setScheduledTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('student_name');
    if (savedName) setStudentName(savedName);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (studentName) {
      const fetchTests = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('tests')
          .select('*')
          .lte('scheduled_date', today)
          .order('scheduled_date', { ascending: false });
        
        if (data) setScheduledTests(data);
      };
      fetchTests();
    }
  }, [studentName]);

  if (loading) return null;

  if (!studentName) {
    return <Onboarding onComplete={(name) => setStudentName(name)} />;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <FileText className="text-blue-400" />;
      case 'listening': return <Headphones className="text-purple-400" />;
      case 'writing': return <PenTool className="text-amber-400" />;
      case 'speaking': return <MessageSquare className="text-emerald-400" />;
      default: return <FileText />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Xush kelibsiz, <span className="gradient-text">{studentName}!</span>
          </h1>
          <p className="text-xl text-muted font-medium">Ready to hit Band 7+ today?</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 glass">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted font-bold uppercase tracking-wider">Overall Goal</p>
            <p className="text-lg font-bold">IELTS Band 7.5</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-20">
          <DailyTracker studentName={studentName} />
          <FourteenDayTracker studentName={studentName} />
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="text-primary" /> Scheduled Exams
            </h3>
          </div>

          <div className="space-y-4">
            {scheduledTests.length > 0 ? (
              scheduledTests.map((test) => (
                <motion.div
                  key={test.id}
                  whileHover={{ x: 4 }}
                  className="p-5 glass border border-white/10 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => window.location.href = `/exam/${test.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                      {getTypeIcon(test.type)}
                    </div>
                    <div>
                      <h4 className="font-bold capitalize">{test.type} Mock</h4>
                      <p className="text-xs text-muted font-medium">Date: {test.scheduled_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    START <ArrowRight size={16} />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-4">
                <div className="p-4 bg-white/5 rounded-full w-fit mx-auto">
                  <Calendar className="text-muted/40" size={32} />
                </div>
                <p className="text-muted font-medium">No tests scheduled for today.</p>
              </div>
            )}
          </div>

          {/* Quick Stats or Tips */}
          <div className="p-6 bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-3xl border border-primary/20 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Play size={20} fill="currentColor" />
              <span className="font-bold text-sm uppercase tracking-widest">Focus Mode</span>
            </div>
            <h4 className="text-xl font-bold">Don't forget the distraction audit!</h4>
            <p className="text-sm text-white/70 leading-relaxed">
              Spending 15 minutes on the Listening audit each day can boost your score by 0.5 bands in just a week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
