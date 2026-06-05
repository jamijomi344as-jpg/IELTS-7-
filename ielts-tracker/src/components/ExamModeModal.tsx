'use client';
import { motion } from 'framer-motion';
import { Timer, BookOpen, X } from 'lucide-react';
import type { Test } from '@/types';

interface Props {
  test: Test;
  onSelect: (mode: 'exam' | 'exercise') => void;
  onClose: () => void;
}

export function ExamModeModal({ test, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Choose Mode</h2>
            <p className="text-muted text-sm mt-0.5">{test.title}</p>
          </div>
          <button onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4">
          {/* EXAM MODE */}
          <button
            onClick={() => onSelect('exam')}
            className="p-5 rounded-2xl border border-accent/30 bg-accent/10 text-left
                       hover:border-accent/60 hover:bg-accent/15 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                <Timer size={18} className="text-accent" />
              </div>
              <span className="font-extrabold text-base text-accent">Exam Mode</span>
            </div>
            <ul className="text-sm text-white/60 space-y-1 ml-12">
              <li>• Strict IELTS countdown timer — cannot be paused</li>
              <li>• Listening audio plays once — no rewind or pause</li>
              <li>• Simulates real test conditions</li>
            </ul>
          </button>

          {/* EXERCISE MODE */}
          <button
            onClick={() => onSelect('exercise')}
            className="p-5 rounded-2xl border border-primary/30 bg-primary/10 text-left
                       hover:border-primary/60 hover:bg-primary/15 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen size={18} className="text-primary" />
              </div>
              <span className="font-extrabold text-base text-primary">Exercise Mode</span>
            </div>
            <ul className="text-sm text-white/60 space-y-1 ml-12">
              <li>• Timer can be paused and resumed freely</li>
              <li>• Full audio control: rewind, fast-forward, pause</li>
              <li>• Best for learning and practice drills</li>
            </ul>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
