'use client';
import { motion } from 'framer-motion';
import { Timer, BookOpen, X, Zap, Volume2 } from 'lucide-react';
import type { Test } from '@/types';

interface Props {
  test: Test;
  onSelect: (mode: 'exam' | 'exercise') => void;
  onClose: () => void;
}

export function ExamModeModal({ test, onSelect, onClose }: Props) {
  const isListening = test.type === 'listening';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass w-full max-w-md rounded-2xl p-7 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-extrabold text-lg">Rejim tanlang</h2>
            <p className="text-muted text-sm mt-0.5 truncate max-w-[280px]">{test.title}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3">
          {/* EXAM MODE */}
          <button onClick={() => onSelect('exam')}
            className="p-5 rounded-xl border border-accent/25 bg-accent/8 text-left
                       hover:border-accent/50 hover:bg-accent/12 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-accent/20 border border-accent/30
                              flex items-center justify-center group-hover:scale-105 transition-transform">
                <Timer size={17} className="text-accent" />
              </div>
              <div>
                <p className="font-extrabold text-accent">EXAM Mode</p>
                <p className="text-xs text-muted">Haqiqiy imtihon sharoiti</p>
              </div>
            </div>
            <ul className="space-y-1 ml-12">
              <li className="flex items-center gap-2 text-xs text-white/55">
                <Zap size={11} className="text-accent/60" />
                Taymer to'xtatib bo'lmaydi
              </li>
              {isListening && (
                <li className="flex items-center gap-2 text-xs text-white/55">
                  <Volume2 size={11} className="text-accent/60" />
                  Audio — ortga qaytarish va to'xtatish YO'Q
                </li>
              )}
              <li className="flex items-center gap-2 text-xs text-white/55">
                <Zap size={11} className="text-accent/60" />
                Haqiqiy IELTS sharoitiga tayyorlanasiz
              </li>
            </ul>
          </button>

          {/* EXERCISE MODE */}
          <button onClick={() => onSelect('exercise')}
            className="p-5 rounded-xl border border-primary/25 bg-primary/8 text-left
                       hover:border-primary/50 hover:bg-primary/12 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30
                              flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen size={17} className="text-primary" />
              </div>
              <div>
                <p className="font-extrabold text-primary">EXERCISE Mode</p>
                <p className="text-xs text-muted">Erkin mashq rejimi</p>
              </div>
            </div>
            <ul className="space-y-1 ml-12">
              <li className="flex items-center gap-2 text-xs text-white/55">
                <Zap size={11} className="text-primary/60" />
                Taymerni to'xtatib, davom ettirish mumkin
              </li>
              {isListening && (
                <li className="flex items-center gap-2 text-xs text-white/55">
                  <Volume2 size={11} className="text-primary/60" />
                  Audio — ortga qaytarish va to'xtatish MUMKIN
                </li>
              )}
              <li className="flex items-center gap-2 text-xs text-white/55">
                <Zap size={11} className="text-primary/60" />
                O'rganish va tahlil qilish uchun ideal
              </li>
            </ul>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
