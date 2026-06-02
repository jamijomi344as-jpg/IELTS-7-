'use client';

import React, { useEffect, useState } from 'react';
import { Mic, RotateCcw, Play, Pause } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

export const SpeakingSimulator = ({ test }: { test: any }) => {
  const [phase, setPhase] = useState<'prep' | 'speak'>('prep');
  const [isActive, setIsActive] = useState(false);
  const duration = phase === 'prep' ? 60 : 120;
  const { timeLeft, formattedTime, start, reset } = useCountdown(duration, false);
  const promptText = test.speaking_prompt_text || test.content?.text || test.writing_prompt_text || 'Describe a time when you had to work in a team to achieve a goal.';

  useEffect(() => {
    if (timeLeft === 0) {
      if (phase === 'prep') {
        setPhase('speak');
        reset();
        start();
      } else {
        setIsActive(false);
      }
    }
  }, [timeLeft, phase, reset, start]);

  const startTimer = () => {
    if (!isActive) {
      if (phase === 'prep' && timeLeft === 0) {
        reset();
      }
      setIsActive(true);
      start();
    } else {
      setIsActive(false);
    }
  };

  const handleReset = () => {
    setPhase('prep');
    reset();
    setIsActive(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl border-white/10 space-y-10 max-w-4xl mx-auto shadow-2xl">
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${phase === 'prep' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'}`}>
          {phase === 'prep' ? '1-Min Preparation' : '2-Min Speaking'}
        </div>
        <h2 className="text-5xl font-black tabular-nums tracking-tighter">{formattedTime}</h2>
      </div>

      <div className="w-full grid gap-8">
        <div className="p-8 bg-white/5 rounded-2xl border border-white/10 relative group">
          <div className="absolute -top-3 left-6 px-3 bg-card border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted">
            Topic Card
          </div>
          <p className="text-2xl font-medium leading-relaxed italic text-white/90">"{promptText}"</p>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleReset}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-muted"
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={startTimer}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_40px_rgba(244,63,94,0.3)]' : 'bg-primary shadow-[0_0_40px_rgba(16,185,129,0.3)] text-white'}`}
          >
            {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
          </button>

          <div className={`p-4 rounded-2xl border transition-all ${isActive && phase === 'speak' ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse' : 'bg-white/5 border-white/10 text-muted'}`}>
            <Mic size={24} />
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        <p className="text-center text-sm font-bold text-muted uppercase tracking-widest">Assessment Criteria</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Fluency', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'].map((criterion) => (
            <div key={criterion} className="p-3 glass rounded-xl text-center text-xs font-bold border-white/5">{criterion}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
