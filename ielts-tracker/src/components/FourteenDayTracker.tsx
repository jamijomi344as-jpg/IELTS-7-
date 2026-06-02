'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FourteenDayTrackerProps {
  studentName: string;
}

export const FourteenDayTracker: React.FC<FourteenDayTrackerProps> = ({ studentName }) => {
  const [grid, setGrid] = useState<string[]>([]);
  const dateKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchTracker = async () => {
      const { data } = await supabase
        .from('student_progress_trackers')
        .select('completed_fourteen_day_grid')
        .eq('student_name', studentName)
        .eq('date_key', dateKey)
        .single();
      
      if (data && data.completed_fourteen_day_grid) {
        setGrid(data.completed_fourteen_day_grid);
      }
    };
    fetchTracker();
  }, [studentName, dateKey]);

  const toggleDay = async (dayId: string) => {
    const newGrid = grid.includes(dayId)
      ? grid.filter(id => id !== dayId)
      : [...grid, dayId];

    setGrid(newGrid);

    // TypeScript build-dan muammosiz o'tishi uchun 'as any' qo'shildi
    await supabase
      .from('student_progress_trackers')
      .upsert({
        student_name: studentName,
        date_key: dateKey,
        completed_fourteen_day_grid: newGrid
      }, { onConflict: 'student_name,date_key' as any });
  };

  return (
    <div className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="text-primary" /> 14-Day Sprint Tracker
        </h3>
        <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
          {grid.length} / 14 Days Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
        {Array.from({ length: 14 }, (_, i) => {
          const dayId = `day_${i + 1}`;
          const isDone = grid.includes(dayId);
          return (
            <motion.button
              type="button"
              key={dayId}
              whileHover={{ scale: 1.05 }}
              onClick={() => toggleDay(dayId)}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all ${
                isDone
                  ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted/80">Day {i + 1}</span>
              {isDone ? (
                <CheckCircle2 size={20} className="text-primary" />
              ) : (
                <Circle size={20} className="text-white/20" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
