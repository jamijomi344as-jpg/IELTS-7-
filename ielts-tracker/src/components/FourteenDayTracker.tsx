'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Download, Upload, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);

export const FourteenDayTracker = ({ studentName }: { studentName: string }) => {
  const [gridData, setGridData] = useState<Record<string, { input: boolean; output: boolean }>>({});
  const dateKey = '14_day_routine';

  useEffect(() => {
    const fetchGrid = async () => {
      const { data } = await supabase
        .from('student_progress_trackers')
        .select('completed_fourteen_day_grid')
        .eq('student_name', studentName)
        .eq('date_key', dateKey)
        .single();

      if (data) setGridData(data.completed_fourteen_day_grid || {});
    };
    fetchGrid();
  }, [studentName]);

  const toggleGrid = async (day: number, type: 'input' | 'output') => {
    const dayKey = `day_${day}`;
    const newGrid = {
      ...gridData,
      [dayKey]: {
        input: gridData[dayKey]?.input || false,
        output: gridData[dayKey]?.output || false,
        [type]: !gridData[dayKey]?.[type]
      }
    };

    setGridData(newGrid);

    await supabase
      .from('student_progress_trackers')
      .upsert({
        student_name: studentName,
        date_key: dateKey,
        completed_fourteen_day_grid: newGrid
      }, { onConflict: ['student_name', 'date_key'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutGrid className="text-accent" />
        <h3 className="text-2xl font-bold">14-Day Advanced Tracker (Input vs Output)</h3>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-left font-bold text-muted border-b border-white/5">TYPE</th>
              {DAYS.map(day => (
                <th key={day} className="p-4 text-center font-bold text-muted border-b border-white/5 min-w-[60px]">D{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="p-4 font-bold flex flex-col gap-1">
                <span className="flex items-center gap-2"><Download size={16} className="text-primary" /> INPUT</span>
                <span className="text-[10px] text-muted">Reading Novel, Documentary, New Scientist, Speaking Videos</span>
              </td>
              {DAYS.map(day => {
                const isDone = gridData[`day_${day}`]?.input;
                return (
                  <td key={day} className="p-2 text-center">
                    <button
                      onClick={() => toggleGrid(day, 'input')}
                      className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                        isDone ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isDone && <Check size={18} strokeWidth={3} />}
                    </button>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="p-4 font-bold flex flex-col gap-1">
                <span className="flex items-center gap-2"><Upload size={16} className="text-accent" /> OUTPUT</span>
                <span className="text-[10px] text-muted">Reading Tests, Listening Tests, Writing, Speaking Recording</span>
              </td>
              {DAYS.map(day => {
                const isDone = gridData[`day_${day}`]?.output;
                return (
                  <td key={day} className="p-2 text-center">
                    <button
                      onClick={() => toggleGrid(day, 'output')}
                      className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                        isDone ? 'bg-accent/20 border-accent text-accent' : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isDone && <Check size={18} strokeWidth={3} />}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 glass rounded-2xl border border-white/10">
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-[0.2em]">INPUT TASKS</p>
          <ul className="text-sm space-y-2 text-white/80">
            <li>• Reading Novel: Dale Carnegie (20 pages) — Note 3 conversational expressions.</li>
            <li>• Watching Documentary: (1 hour) — Focus on native-speed pronunciation.</li>
            <li>• Reading New Scientist: 1 article — Highlight 5 advanced collocations.</li>
            <li>• Watching Speaking Videos: Band 8/9 tests — Analyze Part 3 abstract ideas.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-[0.2em]">OUTPUT TASKS</p>
          <ul className="text-sm space-y-2 text-white/80">
            <li>• Reading Passages 1, 2, 3: Full test under strict exam conditions.</li>
            <li>• Listening Sections 1, 2, 3, 4: Full test with strict spelling/plural audits.</li>
            <li>• Writing Task 1 / 2: Write 1 advanced overview or 1 complex PEEL paragraph.</li>
            <li>• Speaking Parts 1, 2, 3: Record, transcribe, and re-record to fix slips.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
