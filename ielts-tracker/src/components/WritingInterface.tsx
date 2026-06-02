'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Send, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCountdown } from '@/hooks/useCountdown';
import { useWordCount } from '@/hooks/useWordCount';

export const WritingInterface = ({ test, studentName }: { test: any; studentName: string }) => {
  const initialDuration = test.writing_duration || (test.writing_task === 'task1' ? 1200 : 2400);
  const { timeLeft, formattedTime, isActive, start, reset } = useCountdown(initialDuration, true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wordCount = useWordCount(text);

  useEffect(() => {
    if (!isActive) start();
  }, [isActive, start]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await supabase.from('student_submissions').insert({
      student_name: studentName,
      test_id: test.id,
      submitted_at: new Date().toISOString(),
      student_answers: null,
      writing_text: text,
      score_summary: 'Pending teacher review',
      score_raw: 0,
      score_band: 0
    });
    window.location.href = '/';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 flex flex-col bg-background p-8 border-r border-white/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/10">
              <Clock size={18} className="text-primary" />
              <span className={`font-mono text-xl font-bold ${timeLeft <= 300 ? 'text-accent' : 'text-primary'}`}>
                {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/10">
              <FileText size={18} className="text-muted" />
              <span className="font-bold text-lg">{wordCount} Words</span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send to Teacher'}
            <Send size={18} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your response here with full band 7 vocabulary and structure..."
          className="flex-1 w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-lg leading-relaxed focus:outline-none focus:border-primary/50 transition-all resize-none font-sans"
        />
      </div>

      <aside className="w-[450px] bg-card p-10 overflow-y-auto space-y-8 scrollbar-hide">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            Writing Prompt
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-lg leading-relaxed whitespace-pre-line">
            {test.writing_prompt_text || test.content?.text || 'No writing prompt provided.'}
          </div>
        </div>

        {test.writing_prompt_image && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted flex items-center gap-2">
              <ImageIcon size={16} /> Diagram / Chart
            </h3>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white">
              <img
                src={test.writing_prompt_image}
                alt="Writing prompt chart"
                className="w-full object-contain max-h-[420px]"
              />
            </div>
          </div>
        )}

        <div className="p-6 rounded-3xl bg-accent/10 border border-accent/20">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent/80 mb-3">Task Guidance</p>
          <div className="space-y-2 text-sm leading-6 text-white/75">
            <p>• Write with clarity, coherence and advanced linking phrases.</p>
            <p>• Keep the prompt visible while typing; do not switch away.</p>
            <p>• Use the live word counter and countdown to pace yourself.</p>
          </div>
        </div>
      </aside>
    </div>
  );
};
