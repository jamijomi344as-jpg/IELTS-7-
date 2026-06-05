'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Send, FileText, ImageIcon, Pause, Play, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCountdown } from '@/hooks/useCountdown';
import { useWordCount } from '@/hooks/useWordCount';
import type { Test, ExamMode } from '@/types';

interface Props { test: Test; studentName: string; mode: ExamMode; }

const TASK1_SECS = 20 * 60;
const TASK2_SECS = 40 * 60;
const MIN_WORDS  = { task1: 150, task2: 250 };

export function WritingInterface({ test, studentName, mode }: Props) {
  const STORAGE_KEY  = `writing_draft_${test.id}`;
  const isExam       = mode === 'exam';
  const taskKey      = (test.writing_task ?? 'task1') as 'task1' | 'task2';
  const initSecs     = taskKey === 'task1' ? TASK1_SECS : TASK2_SECS;
  const minWords     = MIN_WORDS[taskKey];

  const [text, setText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) ?? '';
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = useWordCount(text);
  const { timeLeft, formattedTime, isActive, start, pause } = useCountdown(initSecs, true);

  const timerColor = timeLeft < 300 ? 'text-accent' : timeLeft < 600 ? 'text-amber-400' : 'text-primary';
  const wordColor  = wordCount >= minWords ? 'text-primary' : wordCount > minWords * 0.8 ? 'text-amber-400' : 'text-muted';

  // Persist draft
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, text);
  }, [text, STORAGE_KEY]);

  // Auto-submit when timer hits 0 in exam mode
  useEffect(() => {
    if (timeLeft === 0 && isExam && !submitted) handleSubmit();
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);

    const elapsed = initSecs - timeLeft;
    await supabase.from('student_submissions').insert({
      student_name:  studentName,
      test_id:       test.id,
      test_type:     'writing',
      test_title:    test.title,
      exam_mode:     mode,
      submitted_at:  new Date().toISOString(),
      writing_text:  text,
      word_count:    wordCount,
      time_taken_secs: elapsed,
      score_summary: 'Pending teacher review',
    });

    localStorage.removeItem(STORAGE_KEY);
    setSubmitted(true);
    setSubmitting(false);
  }, [text, wordCount, submitting, submitted, test, studentName, mode, timeLeft, initSecs, STORAGE_KEY]);

  if (submitted) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#020817]">
      <div className="glass rounded-3xl p-12 text-center space-y-5 max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold">Essay Submitted!</h2>
        <p className="text-muted text-sm">Your teacher will review it shortly.</p>
        <p className="text-xs font-mono text-primary">{wordCount} words written</p>
        <button onClick={() => window.location.href = '/'}
          className="w-full py-3 bg-primary hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#020817] overflow-hidden">
      {/* LEFT: Editor */}
      <div className="flex-1 flex flex-col border-r border-white/8">
        {/* Toolbar */}
        <div className="glass border-b border-white/8 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${timerColor}`}>
              <Clock size={15}/>
              {formattedTime}
              {!isExam && (
                <button onClick={isActive ? pause : start}
                  className="ml-1 p-1 rounded hover:bg-white/10 text-muted transition-colors">
                  {isActive ? <Pause size={13}/> : <Play size={13}/>}
                </button>
              )}
            </div>
            {/* Word count */}
            <div className={`flex items-center gap-1.5 text-sm font-bold ${wordColor}`}>
              <FileText size={14}/>
              {wordCount} / {minWords}+ words
            </div>
            {/* Progress bar */}
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full progress-fill ${wordCount >= minWords ? 'bg-primary' : 'bg-amber-400'}`}
                style={{width:`${Math.min((wordCount/minWords)*100, 100)}%`}}
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-emerald-400 text-white
                       font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
            <Send size={14}/> {submitting ? 'Sending…' : 'Send to Teacher'}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Start writing your ${taskKey === 'task1' ? 'Task 1 report' : 'Task 2 essay'} here…\n\nMinimum ${minWords} words. Timer started automatically.`}
          className="flex-1 bg-transparent resize-none p-8 text-base leading-8 focus:outline-none
                     text-white/85 placeholder:text-muted/40"
        />
      </div>

      {/* RIGHT: Prompt panel */}
      <div className="w-[420px] xl:w-[480px] overflow-y-auto bg-surface/40 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
                              ${taskKey === 'task1' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'}`}>
              Writing {taskKey === 'task1' ? 'Task 1' : 'Task 2'}
            </span>
            <span className="text-xs text-muted">{taskKey === 'task1' ? '20 minutes' : '40 minutes'}</span>
          </div>
          <p className="text-xs text-muted mt-1">Keep this panel in view while writing.</p>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {/* Prompt text */}
          {test.writing_prompt_text && (
            <div className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
              {test.writing_prompt_text}
            </div>
          )}

          {/* Chart / Map image for Task 1 */}
          {test.writing_prompt_image && (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
              <div className="px-3 py-2 bg-black/40 flex items-center gap-1.5">
                <ImageIcon size={12} className="text-white/40"/>
                <span className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">Chart / Diagram</span>
              </div>
              <img src={test.writing_prompt_image} alt="Writing prompt visual"
                className="w-full object-contain max-h-80" />
            </div>
          )}

          {/* Tips */}
          <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              {taskKey === 'task1' ? 'Task 1 Checklist' : 'Task 2 Checklist'}
            </p>
            <ul className="text-xs text-muted/70 space-y-1 leading-relaxed">
              {taskKey === 'task1' ? <>
                <li>• Describe the overall trend or main feature first</li>
                <li>• Select and compare key data points — don't list all</li>
                <li>• Use complex comparison structures (whereas, while)</li>
                <li>• At least 150 words — aim for 175–190</li>
              </> : <>
                <li>• Clear position stated in the introduction</li>
                <li>• 2–3 PEEL body paragraphs with precise vocabulary</li>
                <li>• Concession clause in at least one body paragraph</li>
                <li>• At least 250 words — aim for 280–320</li>
              </>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
