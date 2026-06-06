'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones, BookOpen, PenLine, Mic, User, ArrowRight,
  CheckCircle2, Circle, Clock, Calendar, BarChart2,
  ChevronDown, ChevronUp, Zap, MessageSquare, PenTool,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Test, ProgressTracker } from '@/types';
import { DAILY_TASKS, INPUT_TASKS_14, OUTPUT_TASKS_14, DAYS_14 } from '@/types';
import { ExamModeModal } from '@/components/ExamModeModal';

// ── Section metadata ──────────────────────────────────────────────
const SECTIONS = [
  { type: 'listening' as const, label: 'Listening', icon: Headphones, color: 'sky',     border: 'hover:border-sky-500/40',    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20'    },
  { type: 'reading'   as const, label: 'Reading',   icon: BookOpen,   color: 'emerald', border: 'hover:border-emerald-500/40',badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  { type: 'writing'   as const, label: 'Writing',   icon: PenLine,    color: 'amber',   border: 'hover:border-amber-500/40',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'  },
  { type: 'speaking'  as const, label: 'Speaking',  icon: Mic,        color: 'rose',    border: 'hover:border-rose-500/40',   badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20'     },
];

export default function HomePage() {
  const [studentName, setStudentName] = useState<string | null>(null);
  const [nameInput, setNameInput]     = useState('');
  const [hydrated, setHydrated]       = useState(false);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [tests, setTests]       = useState<Record<string, Test[]>>({});
  const [loadingTests, setLoadingTests] = useState(false);

  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showModeModal, setShowModeModal] = useState(false);

  // Tracker state
  const [showTracker, setShowTracker] = useState(false);
  const [tracker, setTracker]         = useState<ProgressTracker | null>(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // ── Hydrate student name from localStorage ────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('student_name');
    if (saved) setStudentName(saved);
    setHydrated(true);
  }, []);

  // ── Fetch tracker when name is known ─────────────────────────
  useEffect(() => {
    if (!studentName) return;
    fetchTracker();
  }, [studentName]);

  async function fetchTracker() {
    if (!studentName) return;
    setTrackerLoading(true);
    const { data } = await supabase
      .from('student_progress_trackers')
      .select('*')
      .eq('student_name', studentName)
      .eq('date_key', today)
      .maybeSingle();
    if (data) setTracker(data as ProgressTracker);
    setTrackerLoading(false);
  }

  // ── Save name to localStorage ────────────────────────────────
  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = nameInput.trim();
    if (!n) return;
    localStorage.setItem('student_name', n);
    setStudentName(n);
  }

  // ── Fetch tests for a section ────────────────────────────────
  async function openSection(type: string) {
    if (activeSection === type) { setActiveSection(null); return; }
    setActiveSection(type);
    if (tests[type]) return; // cached
    setLoadingTests(true);
    const { data } = await supabase
      .from('tests')
      .select('*')
      .eq('type', type)
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: false });
    setTests(prev => ({ ...prev, [type]: (data as Test[]) ?? [] }));
    setLoadingTests(false);
  }

  // ── Start test → show mode modal ────────────────────────────
  function startTest(test: Test) {
    if (test.type === 'speaking') {
      window.location.href = `/exam/${test.id}?mode=exercise`;
      return;
    }
    setSelectedTest(test);
    setShowModeModal(true);
  }

  // Mode chosen handler
  function onModeChosen(mode: 'exam' | 'exercise') {
    if (!selectedTest) return;
    setShowModeModal(false);
    window.location.href = `/exam/${selectedTest.id}?mode=${mode}`;
  }

  // ── Toggle daily task ────────────────────────────────────────
  async function toggleDailyTask(id: string) {
    if (!studentName) return;
    const current = tracker?.completed_daily_tasks ?? {};
    const updated  = { ...current, [id]: !current[id] };
    setTracker(prev => prev
      ? { ...prev, completed_daily_tasks: updated }
      : { id:'', student_name: studentName, date_key: today,
          completed_daily_tasks: updated, grid_14day: {} }
    );
    await supabase.from('student_progress_trackers').upsert(
      { student_name: studentName, date_key: today, completed_daily_tasks: updated },
      { onConflict: 'student_name,date_key' }
    );
  }

  // ── Toggle 14-day cell ───────────────────────────────────────
  async function toggle14Day(day: string, kind: 'input'|'output', taskId: string) {
    if (!studentName) return;
    const grid    = tracker?.grid_14day ?? {}; // ✅ To'g'rilandi: grid_14day ishlatildi
    const dayData = grid[day] ?? { input:{}, output:{} };
    const updated = {
      ...grid,
      [day]: { ...dayData, [kind]: { ...dayData[kind], [taskId]: !dayData[kind]?.[taskId] } },
    };
    setTracker(prev => prev
      ? { ...prev, grid_14day: updated } // ✅ To'g'rilandi: grid_14day ishlatildi
      : { id:'', student_name: studentName, date_key: today,
          completed_daily_tasks: {}, grid_14day: updated } // ✅ To'g'rilandi: grid_14day ishlatildi
    );
    await supabase.from('student_progress_trackers').upsert(
      { student_name: studentName, date_key: today, grid_14day: updated }, // ✅ Ma'lumotlar bazasi uchun ham to'g'rilandi
      { onConflict: 'student_name,date_key' }
    );
  }

  if (!hydrated) return null;

  // ── Onboarding overlay ───────────────────────────────────────
  if (!studentName) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020817]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass w-full max-w-md p-10 rounded-3xl shadow-2xl space-y-8"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
              <span className="text-2xl font-black gradient-text">I7</span>
            </div>
            <h1 className="text-3xl font-extrabold">Welcome to IELTS 7+</h1>
            <p className="text-muted text-sm">Enter your name once — your progress is saved forever.</p>
          </div>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="e.g. Hushnudbek"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                required autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-4
                           text-lg focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button type="submit"
              className="w-full py-4 bg-primary hover:bg-emerald-400 text-white font-bold rounded-xl
                         flex items-center justify-center gap-2 transition-colors group">
              Start Preparing
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          <p className="text-center text-xs text-muted">No account needed. Name saved in this browser.</p>
        </motion.div>
      </div>
    );
  }

  // ── Main dashboard ───────────────────────────────────────────
  const dailyDone  = Object.values(tracker?.completed_daily_tasks ?? {}).filter(Boolean).length;
  const dailyTotal = DAILY_TASKS.length;

  return (
    <div className="min-h-screen bg-[#020817]">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-0.5">
              {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
            </p>
            <h1 className="text-2xl font-extrabold">
              Good {hour() < 12 ? 'morning' : hour() < 18 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text">{studentName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTracker(v => !v)}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/10
                         text-sm font-semibold hover:border-primary/40 transition-colors">
              <BarChart2 size={16} className="text-primary" />
              Daily Tracker
              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-mono">
                {dailyDone}/{dailyTotal}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Daily Tracker Panel ───────────────────────────── */}
        <AnimatePresence>
          {showTracker && (
            <motion.div
              initial={{ opacity:0, height:0 }}
              animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }}
              transition={{ duration:0.3 }}
              className="overflow-hidden"
            >
              <DailyTrackerSection
                tasks={tracker?.completed_daily_tasks ?? {}}
                onToggle={toggleDailyTask}
              />
              <FourteenDaySection
                grid={tracker?.grid_14day ?? {}} // ✅ To'g'rilandi: grid_14day uzatildi
                onToggle={toggle14Day}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 4 Module Sections ─────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white/80 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" /> Mock Exam Modules
          </h2>
          {SECTIONS.map(sec => {
            const Icon    = sec.icon;
            const open    = activeSection === sec.type;
            const secTests = tests[sec.type] ?? [];
            return (
              <div key={sec.type} className={`glass rounded-2xl border border-white/8 transition-all duration-200 ${open ? 'border-white/15' : ''}`}>
                {/* Section header */}
                <button
                  onClick={() => openSection(sec.type)}
                  className="w-full flex items-center justify-between p-5 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center
                                    ${sec.badge} transition-all group-hover:scale-105`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{sec.label}</h3>
                      <p className="text-xs text-muted">
                        {open
                          ? `${secTests.length} test${secTests.length !== 1 ? 's' : ''} available`
                          : 'Click to view available tests'}
                      </p>
                    </div>
                  </div>
                  {open
                    ? <ChevronUp size={18} className="text-muted" />
                    : <ChevronDown size={18} className="text-muted" />}
                </button>

                {/* Tests list */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity:0, height:0 }}
                      animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }}
                      transition={{ duration:0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                        {loadingTests && (
                          <div className="flex items-center gap-3 py-4">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-muted text-sm">Loading tests…</span>
                          </div>
                        )}
                        {!loadingTests && secTests.length === 0 && (
                          <p className="text-muted text-sm py-3 text-center">No tests scheduled yet. Check back soon.</p>
                        )}
                        {secTests.map(test => (
                          <div key={test.id}
                            className={`flex items-center justify-between p-4 rounded-xl bg-white/4
                                        border border-white/8 card-lift ${sec.border}`}>
                            <div>
                              <p className="font-semibold text-sm">{test.title}</p>
                              <p className="text-xs text-muted mt-0.5">
                                <Calendar size={10} className="inline mr-1" />
                                {new Date(test.scheduled_date + 'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                                {test.writing_task && (
                                  <span className="ml-2 capitalize text-amber-400">· {test.writing_task}</span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => startTest(test)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors text-white
                                          ${sec.type === 'listening' ? 'bg-sky-600 hover:bg-sky-500'
                                          : sec.type === 'reading'   ? 'bg-emerald-600 hover:bg-emerald-500'
                                          : sec.type === 'writing'   ? 'bg-amber-600 hover:bg-amber-500'
                                          : 'bg-rose-600 hover:bg-rose-500'}`}
                            >
                              Start
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam mode modal */}
      {showModeModal && selectedTest && (
        <ExamModeModal
          test={selectedTest}
          onSelect={onModeChosen}
          onClose={() => setShowModeModal(false)}
        />
      )}
    </div>
  );
}

function hour() { return new Date().getHours(); }

// ── Daily Tracker Section ─────────────────────────────────────────
function DailyTrackerSection({ tasks, onToggle }: {
  tasks: Record<string,boolean>;
  onToggle: (id:string) => void;
}) {
  const done  = Object.values(tasks).filter(Boolean).length;
  const total = DAILY_TASKS.length;
  const pct   = Math.round((done / total) * 100);

  const ICON_MAP: Record<string, React.ElementType> = {
    complex_accuracy: Zap,
    speaking_cohesion: MessageSquare,
    reading_crunch: BookOpen,
    vocab_collocation: BookOpen,
    listening_distractor: Headphones,
    writing_task1_drill: PenTool,
    writing_task2_peel: PenTool,
  };

  return (
    <div className="glass rounded-2xl border border-white/8 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          Daily Band 7 Skill Zone
          <span className="text-xs text-muted font-normal">— {new Date().toLocaleDateString('en-GB',{weekday:'long'})}</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary font-bold">{done}/{total}</span>
          {done === total && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">All done! 🎉</span>}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-primary rounded-full progress-fill" style={{width:`${pct}%`}} />
      </div>
      {/* Task grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAILY_TASKS.map(task => {
          const done  = !!tasks[task.id];
          const Icon  = ICON_MAP[task.id] ?? Zap;
          return (
            <button key={task.id} type="button" onClick={() => onToggle(task.id)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer
                          ${done
                            ? 'bg-primary/10 border-primary/30 shadow-[0_0_16px_rgba(16,185,129,0.1)]'
                            : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/6'}`}>
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${done ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted'}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className={`text-xs font-bold leading-snug ${done ? 'text-primary' : 'text-white/80'}`}>
                    {task.emoji} {task.title}
                  </p>
                  {done
                    ? <CheckCircle2 size={14} className="text-primary shrink-0" />
                    : <Circle size={14} className="text-white/20 shrink-0" />}
                </div>
                <p className="text-[11px] text-muted leading-snug line-clamp-2">{task.desc}</p>
                <span className="text-[10px] font-mono text-muted/50 mt-1 block">{task.time}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 14-Day Grid Section ───────────────────────────────────────────
function FourteenDaySection({ grid, onToggle }: {
  grid: Record<string, { input: Record<string,boolean>; output: Record<string,boolean> }>;
  onToggle: (day:string, kind:'input'|'output', id:string) => void;
}) {
  const totalCells = DAYS_14.length * (INPUT_TASKS_14.length + OUTPUT_TASKS_14.length);
  const doneCells  = DAYS_14.reduce((acc, d) => {
    const dayData = grid[d] ?? {};
    return acc
      + INPUT_TASKS_14.filter(t => dayData.input?.[t.id]).length
      + OUTPUT_TASKS_14.filter(t => dayData.output?.[t.id]).length;
  }, 0);

  return (
    <div className="glass rounded-2xl border border-white/8 p-6 mb-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Calendar size={16} className="text-amber-400" />
          14-Day Advanced Tracker: Input vs. Output
        </h3>
        <span className="text-xs font-mono text-amber-400 font-bold">{doneCells}/{totalCells} tasks</span>
      </div>

      <div className="min-w-[900px]">
        {/* Header row */}
        <div className="grid mb-1" style={{gridTemplateColumns:'180px repeat(14, minmax(52px,1fr))'}}>
          <div className="text-xs text-muted font-bold uppercase tracking-widest p-2">Task</div>
          {DAYS_14.map(d => (
            <div key={d} className="text-center text-xs text-muted font-mono p-2 font-bold">{d}</div>
          ))}
        </div>

        {/* INPUT rows */}
        <div className="mb-1 mt-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-sky-400 px-2 py-1">
            📥 Input
          </div>
          {INPUT_TASKS_14.map(task => (
            <div key={task.id} className="grid items-center border-t border-white/5"
              style={{gridTemplateColumns:'180px repeat(14, minmax(52px,1fr))'}}>
              <div className="px-2 py-2.5">
                <p className="text-xs font-semibold text-white/70 leading-snug">{task.label}</p>
                <p className="text-[10px] text-muted leading-snug">{task.note}</p>
              </div>
              {DAYS_14.map(d => {
                const checked = !!(grid[d]?.input?.[task.id]);
                return (
                  <div key={d} className="flex justify-center py-2">
                    <button onClick={() => onToggle(d, 'input', task.id)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
                                  ${checked
                                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                                    : 'bg-white/3 border-white/10 text-white/20 hover:border-white/30'}`}>
                      {checked
                        ? <CheckCircle2 size={14} />
                        : <Circle size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* OUTPUT rows */}
        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-rose-400 px-2 py-1">
            📤 Output
          </div>
          {OUTPUT_TASKS_14.map(task => (
            <div key={task.id} className="grid items-center border-t border-white/5"
              style={{gridTemplateColumns:'180px repeat(14, minmax(52px,1fr))'}}>
              <div className="px-2 py-2.5">
                <p className="text-xs font-semibold text-white/70 leading-snug">{task.label}</p>
                <p className="text-[10px] text-muted leading-snug">{task.note}</p>
              </div>
              {DAYS_14.map(d => {
                const checked = !!(grid[d]?.output?.[task.id]);
                return (
                  <div key={d} className="flex justify-center py-2">
                    <button onClick={() => onToggle(d, 'output', task.id)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
                                  ${checked
                                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                    : 'bg-white/3 border-white/10 text-white/20 hover:border-white/30'}`}>
                      {checked
                        ? <CheckCircle2 size={14} />
                        : <Circle size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
