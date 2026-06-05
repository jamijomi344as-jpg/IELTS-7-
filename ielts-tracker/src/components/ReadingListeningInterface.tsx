'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Headphones, AlertCircle, CheckCircle2,
  Pause, Play, Volume2, VolumeX, RotateCcw, Clock, HelpCircle
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

const TIMER_READING  = 60 * 60;  // 60 minutes
const TIMER_LISTENING = 30 * 60; // 30 minutes

function formatAudioTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ReadingListeningInterface({ test, studentName, mode }: Props) {
  const STORAGE_KEY = `exam_answers_${test.id}`;
  const isListening = test.type === 'listening';
  const isExam      = mode === 'exam';

  // ── LocalStorage-dan eski javoblarni tiklash ─────────────────────────
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

  // ── Taymer sozlamalari ──────────────────────────────────────────────
  const initSecs = isListening ? TIMER_LISTENING : TIMER_READING;
  const { timeLeft, formattedTime, isActive, start, pause } = useCountdown(initSecs, true);
  const timerColor = timeLeft < 300 ? 'text-rose-500' : timeLeft < 600 ? 'text-amber-400' : 'text-blue-400';

  // ── Audio holatlari ────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPaused, setAudioPaused] = useState(true);
  const [audioTime, setAudioTime]     = useState(0);
  const [audioDur, setAudioDur]       = useState(0);
  const [muted, setMuted]             = useState(false);

  // ── Har safar javob o'zgarganda LocalStorage-ga avto-saqlash ───────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers, STORAGE_KEY]);

  function setAnswer(n: number, val: string) {
    setAnswers(prev => ({ ...prev, [String(n)]: val }));
  }

  // ── Audio boshqaruvi ─────────────────────────────────────────────────
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

  // ── Testni yakunlash va Natijalarni yuborish ─────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting || showResult) return;
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
  }, [answers, submitting, showResult, test, studentName, mode, STORAGE_KEY, isActive, pause]);

  useEffect(() => {
    if (timeLeft === 0 && isExam && !showResult) {
      handleSubmit();
    }
  }, [timeLeft, isExam, showResult, handleSubmit]);

  const totalQ   = test.answer_key?.length || 40;
  const answered = Object.values(answers).filter(v => v.trim()).length;

  // ── HTML VA PDF ULTRA DINAMIK RENDERER ──────────────────────────
  function renderContent() {
    if (test.content_url) {
      const isPdf = test.content_url.endsWith('.pdf') || test.content_url.includes('pdf');
      const isHtml = test.content_url.endsWith('.html') || test.content_url.includes('html');

      // Agar yuklangan fayl HTML bo'lsa
      if (isHtml) {
        return (
          <div className="w-full h-full min-h-[75vh] bg-white rounded-xl overflow-hidden border border-white/10">
            <iframe 
              src={test.content_url} 
              className="w-full h-full border-none"
              title="IELTS Reading HTML Content"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      }

      // Agar yuklangan fayl PDF bo'lsa
      if (isPdf) {
        return (
          <div className="w-full h-full min-h-[75vh] bg-slate-800 rounded-xl overflow-hidden border border-white/10">
            <iframe
              src={`${test.content_url}#toolbar=0&navpanes=0`}
              className="w-full h-full border-none"
              title="IELTS Reading PDF Content"
            />
          </div>
        );
      }
    }
    
    // Agar fayl linki emas, Supabase Rich Text orqali yozilgan HTML matn bo'lsa
    if (test.content_html) {
      return (
        <div
          className="prose prose-invert prose-sm max-w-none leading-relaxed text-slate-300 bg-slate-900/20 p-4 rounded-xl border border-white/5 font-serif selection:bg-blue-500/30 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: test.content_html }}
        />
      );
    }
    
    return (
      <div className="p-6 bg-slate-900/40 border border-white/5 rounded-xl text-center flex flex-col items-center justify-center min-h-[40vh]">
        <AlertCircle className="text-slate-500 mb-2" size={24} />
        <p className="text-sm text-slate-400 italic">No test content, HTML, or PDF passage uploaded.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-[#020817] text-white">
      {/* ── CHAP TOMON: Passage yoki Audio bo'limi ─────────────────────────────── */}
      <div className="overflow-y-auto flex flex-col border-r border-white/10 h-screen">
        <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              {isListening ? <Headphones size={15} className="text-sky-400" /> : <BookOpen size={15} className="text-emerald-400" />}
            </div>
            <div>
              <p className="font-bold text-sm text-white">{test.title}</p>
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
          {isListening && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                  <Volume2 size={13}/> Audio Track
                </p>
                {isExam && (
                  <span className="text-[11px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-semibold">
                    Exam Mode — Player Locked
                  </span>
                )}
              </div>

              {test.audio_url && (
                <audio
                  ref={audioRef}
                  src={test.audio_url}
                  onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime ?? 0)}
                  onLoadedMetadata={() => setAudioDur(audioRef.current?.duration ?? 0)}
                  onEnded={() => setAudioPaused(true)}
                  muted={muted}
                />
              )}

              {!test.has_embedded_audio && test.audio_url && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={audioPaused ? startAudio : toggleAudio}
                      disabled={isExam && !audioPaused}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
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
                        className="w-full h-1.5 accent-sky-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                        <span>{formatAudioTime(audioTime)}</span>
                        <span>{formatAudioTime(audioDur)}</span>
                      </div>
                    </div>

                    {!isExam && (
                      <button 
                        onClick={() => setMuted(v => !v)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
                      </button>
                    )}
                    
                    {!isExam && (
                      <button
                        onClick={() => { 
                          if (audioRef.current) { 
                            audioRef.current.currentTime = Math.max(0, audioTime - 10); 
                          }
                        }}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer" 
                        title="Back 10s"
                      >
                        <RotateCcw size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {test.has_embedded_audio && test.content_html && (
                <div dangerouslySetInnerHTML={{ __html: test.content_html }} />
              )}
            </div>
          )}

          <div className="h-full">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ── O'NG TOMON: Dynamic Questions Form & Answer Sheet ─────────────────────────── */}
      <div className="flex flex-col bg-[#0f172a] border-l border-white/10 h-screen">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-blue-400" />
            <span className="font-bold text-sm">Questions & Answer Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{answered}/{totalQ}</span>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Grading…' : 'Finish Test'}
            </button>
          </div>
        </div>

        <div className="h-1 bg-white/5">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${(answered / totalQ) * 100}%` }} 
          />
        </div>

        {/* ── SAVOLLAR INTEGRATSIYASI ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* TypeScript xatosi batamom hal qilingan qism: (test as any) */}
          {(test as any).questions_html && (
            <div 
              className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-950 p-5 rounded-2xl border border-white/5 mb-4 leading-relaxed dynamic-html-questions selection:bg-blue-500/30"
              dangerouslySetInnerHTML={{ __html: (test as any).questions_html }}
            />
          )}

          {/* Doimiy va qulay javob kiritish katakchalari */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <HelpCircle size={13} className="text-blue-400" /> Enter Your Final Answers Here:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: totalQ }, (_, i) => i + 1).map(n => (
                <div key={n} className="flex items-center gap-2.5 bg-slate-900/30 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="w-7 text-right text-xs text-slate-400 font-mono shrink-0 font-bold">{n}.</span>
                  <input
                    type="text"
                    value={answers[String(n)] ?? ''}
                    onChange={e => setAnswer(n, e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-white uppercase placeholder:text-slate-700 font-mono font-bold"
                    placeholder={`Write answer for number ${n}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900/20">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Grading…' : 'Submit & Grade'}
          </button>
        </div>
      </div>

      {/* ── Natija Modali ──────────────────────────────────────── */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Test Submitted!</h2>
              <p className="text-slate-400 text-sm">Your answers have been evaluated successfully.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Raw Score</p>
                <p className="text-2xl font-black text-white">{score.raw} / {totalQ}</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 font-bold">Band Score</p>
                <p className="text-2xl font-black text-blue-400">{score.band}</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <button
                onClick={() => window.location.href = `/review/${test.id}`}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                Review Answers
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
