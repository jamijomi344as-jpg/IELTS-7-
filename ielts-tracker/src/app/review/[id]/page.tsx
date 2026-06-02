'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ReviewInterface } from '@/components/ReviewInterface';
import { supabase } from '@/lib/supabase';

export default function ReviewPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ test: any; submission: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let studentName = localStorage.getItem('student_name');
      const queryUser = searchParams?.get('user');
      if (!studentName && queryUser) studentName = queryUser;

      const { data: test } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .single();

      const { data: submission } = await supabase
        .from('student_submissions')
        .select('*')
        .eq('test_id', id)
        .eq('student_name', studentName)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (test && submission) {
        setData({ test, submission });
      }
      setLoading(false);
    };
    fetchData();
  }, [id, searchParams]);

  if (loading) return <div>Loading review...</div>;
  if (!data) return <div>Review not found</div>;

  return <ReviewInterface test={data.test} submission={data.submission} />;
}
