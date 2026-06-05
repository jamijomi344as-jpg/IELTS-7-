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

  // HTML fayl ekanligini aniqlash (content_url yoki kontent ichida html borligini tekshirish)
  const isHtmlFile = 
    (test.content_url && (test.content_url.endsWith('.html') || test.content_url.includes('html'))) ||
    (test.content_html && test.content_html.trim().startsWith('<!DOCTYPE') || test.content_html?.trim().startsWith('<html'));

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
  const { timeLeft, formattedTime, isActive, start, pause } = useCountdown(initSecs, true);
  const timerColor = timeLeft < 300 ? 'text-rose-500' : timeLeft < 600 ? 'text-amber-400' : 'text-blue-400';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPaused, setAudioPaused] = useState(true);
  const [audioTime, setAudioTime]     = useState(0);
  const [audioDur, setAudioDur]       = useState(0);
  const [muted, setMuted]             = useState(false);

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

  // ── HTML / PDF JAVOB BERISH USULI ──────────────────────────────────
  if (isHtmlFile) {
    // Agar fayl ochiq matn (raw string) sifatida kelayotgan bo'lsa, uni blob URL qilib yuklaymiz
    const htmlSrc = test.content_url || (test.content_html ? `data:text/html;charset=utf-8,${encodeURIComponent(test.content_html)}` : '');

    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden">
        {/* Yuqori kichik boshqaruv paneli */}
        <div className="bg-slate-900 border-b border-white/10 px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold rounded-md border border-sky-500/20">HTML Test</span>
            <p className="font-bold text-sm text-white">{test.title}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            Dashboardga qaytish
          </button>
        </div>
        {/* HTML testni butun ekranda interaktiv ochish */}
        <div className="flex-1 w-full h-full bg-white">
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

  // ── STANDART INTERFEYS: PDF va boshqa formatlar uchun (Ikkiga bo'lingan) ────────────────
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
          {isListening && !test.has_embedded_audio && test.audio_url && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4">
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

          <div className="h-full min-h-[75vh] bg-slate-800 rounded-xl overflow-hidden border border-white/10">
            {test.content_url ? (
              <iframe src={`${test.content_url}#toolbar=0&navpanes=0`} className="w-full h-full border-none" title="PDF Content" />
            ) : (
              <div className="prose prose-invert prose-sm p-4" dangerouslySetInnerHTML={{ __html: test.content_html || '' }} />
            )}
          </div>
        </div>
      </div>

      {/* O'NG TOMON */}
      <div className="flex flex-col bg-[#0f172a] border-l border-white/10 h-screen">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-blue-400" />
            <span className="font-bold text-sm">Questions & Answer Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{answered}/{totalQ}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {(test as any).questions_html && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-950 p-5 rounded-2xl border border-white/5 mb-4" dangerouslySetInnerHTML={{ __html: (test as any).questions_html }} />
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <HelpCircle size={13} className="text-blue-400" /> Enter Your Answers:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: totalQ }, (_, i) => i + 1).map(n => (
                <div key={n} className="flex items-center gap-2.5 bg-slate-900/30 p-2 rounded-xl border border-white/5">
                  <span className="w-7 text-right text-xs text-slate-400 font-mono font-bold">{n}.</span>
                  <input
                    type="text"
                    value={answers[String(n)] ?? ''}
                    onChange={e => setAnswer(n, e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white uppercase font-mono font-bold"
                    placeholder={`Answer ${n}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900/20">
          <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
            {submitting ? 'Grading…' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}'use client';

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

  // HTML fayl ekanligini aniqlash (content_url yoki kontent ichida html borligini tekshirish)
  const isHtmlFile = 
    (test.content_url && (test.content_url.endsWith('.html') || test.content_url.includes('html'))) ||
    (test.content_html && test.content_html.trim().startsWith('<!DOCTYPE') || test.content_html?.trim().startsWith('<html'));

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
  const { timeLeft, formattedTime, isActive, start, pause } = useCountdown(initSecs, true);
  const timerColor = timeLeft < 300 ? 'text-rose-500' : timeLeft < 600 ? 'text-amber-400' : 'text-blue-400';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPaused, setAudioPaused] = useState(true);
  const [audioTime, setAudioTime]     = useState(0);
  const [audioDur, setAudioDur]       = useState(0);
  const [muted, setMuted]             = useState(false);

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

  // ── HTML / PDF JAVOB BERISH USULI ──────────────────────────────────
  if (isHtmlFile) {
    // Agar fayl ochiq matn (raw string) sifatida kelayotgan bo'lsa, uni blob URL qilib yuklaymiz
    const htmlSrc = test.content_url || (test.content_html ? `data:text/html;charset=utf-8,${encodeURIComponent(test.content_html)}` : '');

    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden">
        {/* Yuqori kichik boshqaruv paneli */}
        <div className="bg-slate-900 border-b border-white/10 px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold rounded-md border border-sky-500/20">HTML Test</span>
            <p className="font-bold text-sm text-white">{test.title}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            Dashboardga qaytish
          </button>
        </div>
        {/* HTML testni butun ekranda interaktiv ochish */}
        <div className="flex-1 w-full h-full bg-white">
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

  // ── STANDART INTERFEYS: PDF va boshqa formatlar uchun (Ikkiga bo'lingan) ────────────────
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
          {isListening && !test.has_embedded_audio && test.audio_url && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4">
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

          <div className="h-full min-h-[75vh] bg-slate-800 rounded-xl overflow-hidden border border-white/10">
            {test.content_url ? (
              <iframe src={`${test.content_url}#toolbar=0&navpanes=0`} className="w-full h-full border-none" title="PDF Content" />
            ) : (
              <div className="prose prose-invert prose-sm p-4" dangerouslySetInnerHTML={{ __html: test.content_html || '' }} />
            )}
          </div>
        </div>
      </div>

      {/* O'NG TOMON */}
      <div className="flex flex-col bg-[#0f172a] border-l border-white/10 h-screen">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-blue-400" />
            <span className="font-bold text-sm">Questions & Answer Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{answered}/{totalQ}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {(test as any).questions_html && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-950 p-5 rounded-2xl border border-white/5 mb-4" dangerouslySetInnerHTML={{ __html: (test as any).questions_html }} />
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <HelpCircle size={13} className="text-blue-400" /> Enter Your Answers:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: totalQ }, (_, i) => i + 1).map(n => (
                <div key={n} className="flex items-center gap-2.5 bg-slate-900/30 p-2 rounded-xl border border-white/5">
                  <span className="w-7 text-right text-xs text-slate-400 font-mono font-bold">{n}.</span>
                  <input
                    type="text"
                    value={answers[String(n)] ?? ''}
                    onChange={e => setAnswer(n, e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white uppercase font-mono font-bold"
                    placeholder={`Answer ${n}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900/20">
          <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
            {submitting ? 'Grading…' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}
