'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Headphones, AlertCircle, CheckCircle2,
  Pause, Play, Volume2, VolumeX, RotateCcw, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getBand } from '@/types';
import type { Test, ExamMode } from '@/types';
import { useCountdown } from '@/hooks/useCountdown';

interface Props { test: Test; studentName: string; mode: ExamMode; }

const TIMER_READING  = 60 * 60;  // 60 minutes
const TIMER_LISTENING = 30 * 60; // 30 minutes

export function ReadingListeningInterface({ test, studentName, mode }: Props) {
  const STORAGE_KEY = `exam_answers_${test.id}`;
  const isListening = test.type === 'listening';
  const isExam      = mode === 'exam';

  // ── Restore answers from localStorage ─────────────────────────
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
  });

  const [showResult, setShowResult] = useState(false);
  const [score, setScore]           = useState({ raw: 0, band: 0 });
  const [submitting, setSubmitting] = useState(false);

  // ── Timer ──────────────────────────────────────────────────────
  const initSecs = isListening ? TIMER_LISTENING : TIMER_READING;
  const { timeLeft, formattedTime, isActive, start, pause } = useCountdown(initSecs, true);
  const timerColor = timeLeft < 300 ? 'text-accent' : timeLeft < 600 ? 'text-amber-400' : 'text-primary';

  // ── Audio state ────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPaused, setAudioPaused] = useState(true);
  const [audioTime, setAudioTime]     = useState(0);
  const [audioDur, setAudioDur]       = useState(0);
  const [muted, setMuted]             = useState(false);

  // ── Save answers to localStorage on every change ───────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers, STORAGE_KEY]);

  function setAnswer(n: number, val: string) {
    setAnswers(prev => ({ ...prev, [String(n)]: val }));
  }

  // ── Audio controls ─────────────────────────────────────────────
  function toggleAudio() {
    const a = audioRef.current;
    if (!a) return;
    if (isExam) return; // locked in exam mode
    if (a.paused) { a.play(); setAudioPaused(false); }
    else          { a.pause(); setAudioPaused(true); }
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
    a.play();
    setAudioPaused(false);
  }

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting || showResult) return;
    setSubmitting(true);
    if (isExam || !isActive) {} else pause();

    const key     = test.answer_key ?? [];
    let correct   = 0;
    key.forEach((ans, i) => {
      if ((answers[String(i + 1)] ?? '').trim().toLowerCase() === ans.trim().toLowerCase()) correct++;
    });
    const total = key.length || 40;
    const band  = getBand(correct, test.type as 'reading' | 'listening');

    await supabase.from('student_submissions').insert({
      student_name:   studentName,
      test_id:        test.id,
      test_type:      test.type,
      test_title:     test.title,
      exam_mode:      mode,
      submitted_at:   new Date().toISOString(),
      student_answers: answers,
      score_raw:      correct,
      score_band:     band,
      score_summary:  `${correct}/${total} — Band ${band}`,
    });

    localStorage.removeItem(STORAGE_KEY); // clear saved draft
    setScore({ raw: correct, band });
    setShowResult(true);
    setSubmitting(false);
  }, [answers, submitting, showResult, test, studentName, mode, STORAGE_KEY]);

  // ── Auto-submit when timer hits 0 in exam mode ─────────────────
  useEffect(() => {
    if (timeLeft === 0 && isExam && !showResult) handleSubmit();
  }, [timeLeft]);

  const totalQ   = test.answer_key?.length || 40;
  const answered = Object.values(answers).filter(v => v.trim()).length;

  // ── Render passage/content ─────────────────────────────────────
  function renderContent() {
    if (test.content_url) {
      const isPdf = test.content_url.endsWith('.pdf') || test.content_url.includes('pdf');
      if (isPdf) return (
        <object
          data={test.content_url}
          type="application/pdf"
          className="w-full h-full rounded-xl"
          aria-label="PDF passage"
        >
          <a href={test.content_url} target="_blank" rel="noreferrer"
            className="text-primary underline text-sm">Open PDF ↗</a>
        </object>
      );
    }
    if (test.content_html) return (
      <div
        className="prose prose-invert prose-sm max-w-none leading-relaxed text-white/80"
        dangerouslySetInnerHTML={{ __html: test.content_html }}
      />
    );
    return <p className="text-muted text-sm">No passage content uploaded.</p>;
  }

  return (
    <div className="exam-split bg-[#020817]">
      {/* ── LEFT: Passage / Audio ─────────────────────────────── */}
      <div className="overflow-y-auto flex flex-col border-r border-white/8">
        {/* Sub-header */}
        <div className="sticky top-0 z-10 glass border-b border-white/8 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              {isListening
                ? <Headphones size={15} className="text-sky-400" />
                : <BookOpen   size={15} className="text-emerald-400" />}
            </div>
            <div>
              <p className="font-bold text-sm">{test.title}</p>
              <p className="text-xs text-muted capitalize">{mode} mode</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 font-mono text-base font-bold ${timerColor}`}>
            <Clock size={14} />
            {formattedTime}
            {!isExam && (
              <button onClick={isActive ? pause : start}
                className="ml-1 p-1 hover:bg-white/10 rounded transition-colors text-muted">
                {isActive ? <Pause size={13}/> : <Play size={13}/>}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Listening audio engine */}
          {isListening && (
            <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                  <Volume2 size={13}/> Audio Track
                </p>
                {isExam && (
                  <span className="text-[11px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">
                    Exam Mode — no controls
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                                  ${audioPaused
                                    ? 'bg-sky-600 hover:bg-sky-500 text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {audioPaused ? <Play size={16} className="ml-0.5"/> : <Pause size={16}/>}
                    </button>
                    <div className="flex-1">
                      <input
                        type="range" min={0} max={audioDur || 100} value={audioTime}
                        onChange={e => seek(Number(e.target.value))}
                        disabled={isExam}
                        className="w-full h-1.5 accent-sky-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                        <span>{fmt(audioTime)}</span>
                        <span>{fmt(audioDur)}</span>
                      </div>
                    </div>
                    {!isExam && (
                      <button onClick={() => setMuted(v => !v)}
                        className="text-muted hover:text-white transition-colors">
                        {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
                      </button>
                    )}
                    {!isExam && (
                      <button
                        onClick={() => { if (audioRef.current) { audioRef.current.currentTime = Math.max(0, audioTime - 10); }}}
                        className="text-muted hover:text-white transition-colors" title="Back 10s">
                        <RotateCcw size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* HTML-embedded audio */}
              {test.has_embedded_audio && test.content_html && (
                <div dangerouslySetInnerHTML={{ __html: test.content_html }} />
              )}
            </div>
          )}

          {/* Content */}
          {renderContent()}
        </div>
      </div>

      {/* ── RIGHT: Answer Sheet ───────────────────────────────── */}
      <div className="flex flex-col bg-[#0f172a] border-l border-white/5">
        <div className="p-4 border-b border-white/8 flex items-center justify-between bg-surface/60">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-primary" />
            <span className="font-bold text-sm">Answer Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-mono">{answered}/{totalQ}</span>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 bg-primary hover:bg-emerald-400 text-white text-xs font-bold
                         rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Grading…' : 'Finish Test'}
            </button>
          </div>
        </div>
        {/* Progress */}
        <div className="h-1 bg-white/5">
          <div className="h-full bg-primary progress-fill" style={{width:`${(answered/totalQ)*100}%`}} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {Array.from({length: totalQ}, (_, i) => i + 1).map(n => (
            <div key={n} className="flex items-center gap-2.5">
              <span className="w-7 text-right text-xs text-muted font-mono shrink-0">{n}</span>
              <input
                type="text"
                value={answers[String(n)] ?? ''}
                onChange={e => setAnswer(n, e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-white/4 border border-white/10 rounded-lg px-3 py-1.5 text-sm
                           focus:outline-none focus:border-primary/60 transition-colors uppercase
                           placeholder:text-white/20"
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-primary hover:bg-emerald-400 text-white font-bold rounded-xl
                       transition-colors text-sm disabled:opacity-50">
            {submitting ? 'Grading…' : 'Submit & Grade'}
          </button>
        </div>
      </div>

      {/* ── Result Modal ──────────────────────────────────────── */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass w-full max-w-sm rounded-3xl p-10 text-center space-y-7 shadow-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-1">Test Submitted!</h2>
              <p className="text-muted text-sm">Your answers have been graded instantly.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-muted uppercase tracking-widest mb-1">Raw Score</p>
                <p className="text-3xl font-black">{score.raw} / {totalQ}</p>
              </div>
              <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20">
                <p className="text-xs text-primary uppercase tracking-widest mb-1 font-bold">Band Score</p>
                <p className="text-3xl font-black text-primary">{score.band}</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = `/review/${test.id}`}
                className="w-full py-4 bg-primary hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors">
                Review Answers
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
