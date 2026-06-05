'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Test, ExamMode } from '@/types';
import { ReadingListeningInterface } from '@/components/ReadingListeningInterface';
import { WritingInterface } from '@/components/WritingInterface';
import { SpeakingSimulator } from '@/components/SpeakingSimulator';

export default function ExamPage() {
  const { id }        = useParams<{ id: string }>();
  const searchParams  = useSearchParams();
  const mode          = (searchParams.get('mode') ?? 'exercise') as ExamMode;

  const [test, setTest]           = useState<Test | null>(null);
  const [studentName, setStudent] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const name = localStorage.getItem('student_name');
    if (!name) { window.location.href = '/'; return; }
    setStudent(name);
    supabase.from('tests').select('*').eq('id', id).single().then(({ data }) => {
      setTest(data as Test);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!test || !studentName) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center text-muted">
      Test not found.
    </div>
  );

  if (test.type === 'writing')  return <WritingInterface   test={test} studentName={studentName} mode={mode} />;
  if (test.type === 'speaking') return <SpeakingSimulator  test={test} />;
  return <ReadingListeningInterface test={test} studentName={studentName} mode={mode} />;
}
