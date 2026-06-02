'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const ReadingListeningInterface = ({ test, studentName }: { test: any; studentName: string }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ raw: 0, band: 0 });

  const calculateBand = (raw: number) => {
    if (raw >= 39) return 9.0;
    if (raw >= 37) return 8.5;
    if (raw >= 35) return 8.0;
    if (raw >= 33) return 7.5;
    if (raw >= 30) return 7.0;
    if (raw >= 27) return 6.5;
    if (raw >= 23) return 6.0;
    if (raw >= 19) return 5.5;
    if (raw >= 15) return 5.0;
    return 4.0;
  };

  const handleSubmit = async () => {
    let correct = 0;
    const key = test.answer_key || [];

    key.forEach((correctAnswer: string, index: number) => {
      const studentAns = (answers[index + 1] || '').trim().toLowerCase();
      if (studentAns === correctAnswer.toLowerCase()) {
        correct++;
      }
    });

    const band = calculateBand(correct);
    setScore({ raw: correct, band });
    setShowResult(true);

    await supabase.from('student_submissions').insert({
      student_name: studentName,
      test_id: test.id,
      submitted_at: new Date().toISOString(),
      student_answers: answers,
      score_raw: correct,
      score_band: band,
      score_summary: `${correct} / 40 — Band ${band}`,
    });
  };

  const renderContent = () => {
    if (test.content_url?.endsWith('.pdf')) {
      return (
        <object data={test.content_url} type="application/pdf" className="w-full h-[70vh] rounded-3xl overflow-hidden border border-white/10" aria-label="PDF passage viewer">
          <p className="text-sm text-muted">PDF preview is unavailable. Please use the link below.</p>
          <a href={test.content_url} className="text-primary underline" target="_blank" rel="noreferrer">Open PDF</a>
        </object>
      );
    }

    return test.content?.html ? (
      <div dangerouslySetInnerHTML={{ __html: test.content.html }} />
    ) : (
      <p className="whitespace-pre-wrap">{test.content?.text || 'Test content loading...'}</p>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-card/30 p-10 space-y-8 scrollbar-hide">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            {test.type === 'listening' ? <Headphones size={24} className="text-primary" /> : <BookOpen size={24} className="text-primary" />}
          </div>
          <h2 className="text-3xl font-bold">{test.title || `${test.type} Mock Exam`}</h2>
        </div>

        {test.type === 'listening' && test.content_url && (
          <div className="glass p-6 rounded-2xl border-white/10 sticky top-0 z-10 mb-8">
            <audio controls className="w-full">
              <source src={test.content_url} type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        <div className="prose prose-invert max-w-none text-lg leading-relaxed text-white/80">
          {renderContent()}
        </div>
      </div>

      <aside className="w-[400px] border-l border-white/10 bg-background flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-card/50">
          <h3 className="font-bold flex items-center gap-2">
            <AlertCircle size={18} className="text-primary" /> Answer Sheet
          </h3>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 transition-all"
          >
            Finish Test
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-8 text-sm font-bold text-muted text-right">{i + 1}</span>
              <input
                type="text"
                value={answers[i + 1] || ''}
                onChange={(e) => setAnswers({ ...answers, [i + 1]: e.target.value })}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary/50 outline-none transition-all uppercase"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </aside>

      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full glass p-10 rounded-3xl text-center space-y-8 shadow-2xl"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Exam Completed!</h2>
              <p className="text-muted">Your answers have been saved and graded instantly.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Raw Score</p>
                <p className="text-3xl font-black">{score.raw} / 40</p>
              </div>
              <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Band Score</p>
                <p className="text-3xl font-black text-primary">{score.band}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.href = `/review/${test.id}`}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                Review Answers (Javoblarni ko'rish)
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
