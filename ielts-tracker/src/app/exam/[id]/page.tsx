'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ReadingListeningInterface } from '@/components/ReadingListeningInterface';
import { WritingInterface } from '@/components/WritingInterface';
import { SpeakingSimulator } from '@/components/SpeakingSimulator';

import { supabase } from '@/lib/supabase';

export default function ExamPage() {
  const { id } = useParams();
  const [test, setTest] = useState<any>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('student_name');
    setStudentName(savedName);

    const fetchTest = async () => {
      const { data } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setTest(data);
      setLoading(false);
    };
    fetchTest();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-b-2"></div>
    </div>
  );

  if (!test || !studentName) return <div>Test not found or not authenticated</div>;

  if (test.type === 'writing') {
    return <WritingInterface test={test} studentName={studentName} />;
  }

  if (test.type === 'speaking') {
    return <SpeakingSimulator test={test} />;
  }

  return <ReadingListeningInterface test={test} studentName={studentName} />;
}

