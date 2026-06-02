'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Zap, Clock, BookOpen, MessageSquare, Headphones, PenTool } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TASKS = [
  { id: 'complex_accuracy', title: 'Complex Accuracy', desc: 'Grammar & Collocation Audit', time: '5 mins', icon: Zap },
  { id: 'speaking_part_2', title: 'Speaking Part 2 Cohesion & Idioms', desc: '15 mins', time: '15 mins', icon: MessageSquare },
  { id: 'reading_18', title: 'Reading 18-Minute Crunch', desc: '18 mins', time: '18 mins', icon: BookOpen },
  { id: 'vocab_collocation', title: 'Vocabulary Collocation Mapping', desc: '12 mins', time: '12 mins', icon: BookOpen },
  { id: 'listening_audit', title: 'Listening Distractor Audit', desc: '15 mins', time: '15 mins', icon: Headphones },
  { id: 'writing_task_1', title: 'Writing Task 1 High-Feature Drill', desc: '15 mins', time: '15 mins', icon: PenTool },
];

export const DailyTracker = ({ studentName }: { studentName: string }) => {
  const [completed, setCompleted] = useState<string[]>([]);
  const dateKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchTracker = async () => {
      const { data } = await supabase
        .from('student_progress_trackers')
        .select('completed_daily_tasks')
        .eq('student_name', studentName)
        .eq('date_key', dateKey)
        .single();
      
      if (data) setCompleted(data.completed_daily_tasks || []);
    };
    fetchTracker();
  }, [studentName, dateKey]);

  const toggleTask = async (taskId: string) => {
    const newCompleted = completed.includes(taskId)
      ? completed.filter(id => id !== taskId)
      : [...completed, taskId];

    setCompleted(newCompleted);

    await supabase
      .from('student_progress_trackers')
      .upsert({
        student_name: studentName,
        date_key: dateKey,
        completed_daily_tasks: newCompleted
}, { onConflict: 'student_name,date_key' }); // ✨ Massiv o'rniga bitta toza string qildik
      };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="text-primary" /> Daily Band 7 Skill Zone Tracker
        </h3>
        <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
          {completed.length} / {TASKS.length} Done
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((task) => {
          const isDone = completed.includes(task.id);
          const Icon = task.icon;
          return (
            <motion.button
              type="button"
              key={task.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => toggleTask(task.id)}
              className={`p-5 rounded-2xl border transition-all text-left cursor-pointer flex items-start gap-4 ${
                isDone 
                  ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(16,185,129,0.12)]' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`p-3 rounded-xl ${isDone ? 'bg-primary text-white' : 'bg-white/5 text-muted'}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm leading-snug">{task.title}</h4>
                  {isDone ? <CheckCircle2 size={18} className="text-primary shrink-0" /> : <Circle size={18} className="text-white/20 shrink-0" />}
                </div>
                <p className="text-xs text-muted mb-2">{task.desc}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted/60">{task.time}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
