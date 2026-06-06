'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Headphones, AlertCircle,
  Pause, Play, Volume2, Clock, HelpCircle,
  Award, ChevronRight, RefreshCw, LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getBand } from '@/types';
import type { Test, ExamMode } from '@/types';
import { useCountdown } from '@/hooks/useCountdown';

interface Props { 
  test: Test; 
  studentName: string; 
  mode: ExamMode; 
}

const TIMER_READING  = 60 * 60;
const TIMER_LISTENING = 30 * 60;

function formatAudioTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ReadingListeningInterface({ test, studentName, mode }: Props) {
  const STORAGE_KEY = `exam_answers_${test.id}`;
  const isListening = test.type === 'listening';
  const isExam      = mode === 'exam';

  // 🔥 HTML ekanligini tekshirish
  const rawContent = (test.content_html || (test as any).content || '').trim();
  const isHtmlFile = 
    (test.content_url && (test.content_url.endsWith('.html') || test.content_url.includes('html'))) ||
    rawContent.startsWith('<!DOCTYPE') || 
    rawContent.startsWith('<html') ||
    rawContent.includes('<html') || 
    rawContent.includes('<!DOCTYPE html>');

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { 
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); 
    } catch { 
      return {}; 
    }
  });

  const [showResult, setShowResult] = useState(false);
  const [score, setScore]           = useState({ raw: 0, band: '0.0' });
  const [submitting, setSubmitting] = useState(false);

  const initSecs = isListening ? TIMER_LISTENING : TIMER_READING;
  
  // 🛠️ TO'G'RILANDI: Custom hook qaytarayotgan haqiqiy xususiyatlarni destructuring alias orqali kodingizga moslashtirdik
  const { 
    secs: timeLeft, 
    fmt: formattedTime, 
    running: isActive, 
    start, 
    pause 
  } = useCountdown(initSecs, true);

  const timerColor = timeLeft < 300 ? 'text-rose-500' : timeLeft < 600 ? 'text-amber-400' : 'text-blue-400';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPaused, setAudioPaused] = useState(true);
  const [audioTime, setAudioTime]     = useState(0);
  const [audioDur, setAudioDur]       = useState(0);
  const [muted]                       = useState(false);

  useEffect(() => {
    if (!isHtmlFile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers, STORAGE_KEY, isHtmlFile]);

  function setAnswer(n: number, val: string) {
    setAnswers(prev => ({ ...prev, [String(n)]: val }));
  }

  function toggleAudio() {
    const a = audioRef.current;
    if (!a || isExam) return; 
    if (a.paused) { 
      a.play().catch(err => console.log("Audio play error:", err)); 
      setAudioPaused(false); 
    } else { 
      a.pause(); 
      setAudioPaused(true); 
    }
  }

  function seek(val: number) {
    if (isExam) return;
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = val;
    setAudioTime(val);
  }

  function startAudio() {
    const a = audioRef.current;
    if (!a) return;
    a.play().catch(err => console.log("Audio play error:", err));
    setAudioPaused(false);
  }

  const handleSubmit = useCallback(async () => {
    if (submitting || showResult || isHtmlFile) return;
    setSubmitting(true);
    
    if (!isExam && isActive) {
      pause();
    }

    const key = test.answer_key ?? [];
    let correct = 0;
    
    key.forEach((ans, i) => {
      if ((answers[String(i + 1)] ?? '').trim().toLowerCase() === ans.trim().toLowerCase()) {
        correct++;
      }
    });
    
    const total = key.length || 40;
    const bandResult = getBand(correct, test.type as 'reading' | 'listening');
    const stringBand = typeof bandResult === 'number' ? bandResult.toFixed(1) : String(bandResult);

    try {
      await supabase.from('student_submissions').insert({
        student_name:   studentName,
        test_id:        test.id,
        test_type:      test.type,
        test_title:     test.title,
        exam_mode:      mode,
        submitted_at:   new Date().toISOString(),
        student_answers: answers,
        score_raw:      correct,
        score_band:     stringBand,
        score_summary:  `${correct}/${total} — Band ${stringBand}`,
      });
    } catch (err) {
      console.error("Submissions saving error:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    setScore({ raw: correct, band: stringBand });
    setShowResult(true);
    setSubmitting(false);
  }, [answers, submitting, showResult, test, studentName, mode, STORAGE_KEY, isActive, pause, isHtmlFile]);

  useEffect(() => {
    if (timeLeft === 0 && isExam && !showResult && !isHtmlFile) {
      handleSubmit();
    }
  }, [timeLeft, isExam, showResult, handleSubmit, isHtmlFile]);

  const totalQ   = test.answer_key?.length || 40;
  const answered = Object.values(answers).filter(v => v.trim()).length;

  // ── 🌍 INTERAKTIV HTML REJIMI ──
  if (isHtmlFile) {
    const htmlSrc = test.content_url || `data:text/html;charset=utf-8,${encodeURIComponent(rawContent)}`;

    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none">
        <div className="bg-slate-900 border-b border-white/10 px-6 py-3 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-black rounded-md border border-sky-400/30 uppercase tracking-wider">
              Interactive Exam Mode
            </span> 
            <h1 className="font-bold text-sm text-white tracking-wide">{test.title}</h1>
          </div>
          <button 
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LogOut size={13} /> Dashboardga Qaytish
          </button>
        </div>
        
        <div className="flex-1 w-full h-full bg-white relative">
          <iframe 
            src={htmlSrc}
            className="w-full h-full border-none"
            title="IELTS Interactive HTML Test"
            sandbox="allow-scripts allow-same-origin allow-downloads allow-forms"
            allow="autoplay; encrypted-media"
          />
        </div>
      </div>
    );
  }

  // ── 3️⃣ NATIJALAR EKRANI ──
  if (showResult) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500" />
          
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/5">
            <Award size={32} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-white">Test Completed!</h2>
            <p className="text-sm text-slate-400 font-medium">Sizning natijangiz muvaffaqiyatli saqlandi</p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5">
            <div className="p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">To&apos;g&apos;ri Javoblar</p>
              <p className="text-2xl font-black text-white mt-1 font-mono">{score.raw}<span className="text-xs text-slate-500 font-normal"> / {totalQ}</span></p>
            </div>
            <div className="p-3 text-center border-l border-white/5">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">IELTS Band Score</p>
              <p className="text-3xl font-black text-sky-400 mt-0.5 font-mono">{(Number(score.band)).toFixed(1)}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button 
              onClick={() => { window.location.reload(); }} 
              className="w-full py-3.5 bg-white text-slate-950 font-bold rounded-xl text-sm transition-all hover:bg-slate-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={15} /> Qayta urinib ko&apos;rish
            </button>
            <button 
              onClick={() => { window.location.href = '/'; }}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-bold rounded-xl text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              Dashboardga qaytish <ChevronRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 4️⃣ STANDART REJIM (PDF SPLIT-SCREEN) ──
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-[#020817] text-white">
      {/* CHAP TOMON */}
      <div className="overflow-y-auto flex flex-col border-r border-white/10 h-screen">
        <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              {isListening ? <Headphones size={15} className="text-sky-400" /> : <BookOpen size={15} className="text-emerald-400" />}
            </div>
            <div>
              <p className="font-bold text-sm text-white tracking-wide">{test.title}</p>
              <p className="text-xs text-slate-400 capitalize">{mode} mode</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 font-mono text-base font-bold ${timerColor}`}>
            <Clock size={14} />
            {formattedTime}
            {!isExam && (
              <button 
                onClick={isActive ? pause : start}
                className="ml-1 p-1 hover:bg-white/10 rounded transition-colors text-slate-400 cursor-pointer"
              >
                {isActive ? <Pause size={13}/> : <Play size={13}/>}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {isListening && !(test as any).has_embedded_audio && test.audio_url && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                  <Volume2 size={13}/> Audio Track
                </p>
              </div>
              <audio
                ref={audioRef}
                src={test.audio_url}
                onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => setAudioDur(audioRef.current?.duration ?? 0)}
                onEnded={() => setAudioPaused(true)}
                muted={muted}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={audioPaused ? startAudio : toggleAudio}
                  disabled={isExam && !audioPaused}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    audioPaused ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {audioPaused ? <Play size={16} className="ml-0.5"/> : <Pause size={16}/>}
                </button>
                <div className="flex-1">
                  <input
                    type="range" 
                    min={0} 
                    max={audioDur || 100} 
                    value={audioTime}
                    onChange={e => seek(Number(e.target.value))}
                    disabled={isExam}
                    className="w-full h-1.5 accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>{formatAudioTime(audioTime)}</span>
                    <span>{formatAudioTime(audioDur)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="h-full min-h-[75vh] bg-slate-800 rounded-xl overflow-hidden border border-white/10 shadow-inner">
            {test.content_url ? (
              <iframe src={`${test.content_url}#toolbar=0&navpanes=0`} className="w-full h-full border-none" title="PDF Content" />
            ) : (
              <div className="prose prose-invert prose-sm p-4" dangerouslySetInnerHTML={{ __html: test.content_html || (test as any).content || '' }} />
            )}
          </div>
        </div>
      </div>

      {/* O'NG TOMON */}
      <div className="flex flex-col bg-[#0f172a] border-l border-white/10 h-screen">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-blue-400" />
            <span className="font-bold text-sm tracking-wide">Questions & Answer Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono font-bold bg-slate-950 px-2 py-1 rounded-md border border-white/5">
              {answered} / {totalQ} Done
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {(test as any).questions_html && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-950 p-5 rounded-2xl border border-white/5 mb-4 shadow-inner" dangerouslySetInnerHTML={{ __html: (test as any).questions_html }} />
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <HelpCircle size={13} className="text-blue-400" /> Enter Your Answers:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: totalQ }, (_, i) => i + 1).map(n => (
                <div key={n} className="flex items-center gap-2.5 bg-slate-900/30 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="w-7 text-right text-xs text-slate-500 font-mono font-bold">{n}.</span>
                  <input
                    type="text"
                    value={answers[String(n)] ?? ''}
                    onChange={e => setAnswer(n, e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white uppercase font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={`Answer ${n}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900/20 backdrop-blur-md">
          <button 
            onClick={handleSubmit} 
            disabled={submitting} 
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-xl text-sm transition-all transform active:scale-95 shadow-xl cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Grading and Saving…' : 'Submit Test & View Score'}
          </button>
        </div>
      </div>
    </div>
  );
}
