'use client';

import React from 'react';
import { ArrowLeft, Check, X, Info } from 'lucide-react';

export const ReviewInterface = ({ test, submission }: { test: any; submission: any }) => {
  const studentAnswers = submission.student_answers || {};
  const answerKey = test.answer_key || [];

  return (
    <div className="container mx-auto px-6 py-12 space-y-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <h1 className="text-3xl font-bold">Review: {test.title || test.type}</h1>
          <p className="text-muted">Exact performance feedback with direct comparison to the teacher answer key.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
          <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/20">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Raw Score</p>
            <p className="text-3xl font-black text-emerald-200">{submission.score_raw} / 40</p>
          </div>
          <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/20">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Band Score</p>
            <p className="text-3xl font-black text-emerald-200">{submission.score_band}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Info className="text-green-300" size={20} /> Your Answers
          </h3>
          <div className="grid gap-3">
            {answerKey.map((correct: string, i: number) => {
              const num = i + 1;
              const studentAns = studentAnswers[num] || '';
              const isCorrect = studentAns.trim().toLowerCase() === correct.toLowerCase();

              return (
                <div
                  key={i}
                  className={`p-4 rounded-3xl border flex items-center justify-between transition-all ${
                    isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-bold text-muted">{num}</span>
                      <span className={`font-medium ${isCorrect ? 'text-emerald-200' : 'text-rose-200'}`}>
                        {studentAns || '—'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <p className="text-xs text-rose-200/70 mt-2">Expected: {correct}</p>
                    )}
                  </div>
                  {isCorrect ? <Check size={20} className="text-emerald-300" /> : <X size={20} className="text-rose-300" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-muted">Teacher Answer Key</h3>
          <div className="grid gap-3">
            {answerKey.map((correct: string, i: number) => (
              <div key={i} className="p-4 rounded-3xl border border-white/10 bg-white/5">
                <span className="text-xs text-muted/70">Question {i + 1}</span>
                <p className="mt-2 font-semibold text-white/90">{correct}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
