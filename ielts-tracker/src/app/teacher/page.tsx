'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Calendar, FilePlus, Users, Trash2, ExternalLink, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TestForm = {
  title: string;
  type: 'reading' | 'listening' | 'writing' | 'speaking';
  scheduled_date: string;
  content_url: string;
  content_html: string;
  answer_key: string;
  writing_prompt_text: string;
  writing_prompt_image: string;
  speaking_part1: string; // Yangi qo'shildi
  speaking_part2: string; // Yangi qo'shildi
  speaking_part3: string; // Yangi qo'shildi
  writing_task: 'task1' | 'task2';
};

export default function TeacherDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [promptImageFile, setPromptImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<TestForm>({
    title: '',
    type: 'reading',
    scheduled_date: new Date().toISOString().split('T')[0],
    content_url: '',
    content_html: '',
    answer_key: '',
    writing_prompt_text: '',
    writing_prompt_image: '',
    speaking_part1: '',
    speaking_part2: '',
    speaking_part3: '',
    writing_task: 'task1',
  });

  useEffect(() => {
    const isTeacher = localStorage.getItem('is_teacher');
    if (isTeacher !== 'true') {
      window.location.href = '/';
      return;
    }

    const fetchData = async () => {
      const { data: testsData } = await supabase.from('tests').select('*').order('scheduled_date', { ascending: false });
      const { data: subsData } = await supabase.from('student_submissions').select('*').order('submitted_at', { ascending: false });

      if (testsData) setTests(testsData);
      if (subsData) setSubmissions(subsData);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const uploadAsset = async (file: File, folder: string) => {
    const filename = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('test-assets').upload(filename, file, { upsert: true });
    if (error) {
      console.warn('Asset upload failed', error.message);
      return null;
    }
    const { data: publicData } = supabase.storage.from('test-assets').getPublicUrl(data.path);
    return publicData.publicUrl;
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Creating new test...');

    let contentUrl = form.content_url;
    let promptImageUrl = form.writing_prompt_image;

    // Noutbukdan fayl tanlangan bo'lsa, to'g'ridan-to'g'ri Supabase storage'ga yuklaydi
    if (contentFile) {
      const uploaded = await uploadAsset(contentFile, form.type); // folder nomi test turiga moslanadi (reading/listening)
      if (uploaded) contentUrl = uploaded;
    }
    
    if (promptImageFile && form.type === 'writing' && form.writing_task === 'task1') {
      const uploaded = await uploadAsset(promptImageFile, 'writing-images');
      if (uploaded) promptImageUrl = uploaded;
    }

    // Agar o'qituvchi HTML fayl yuklagan bo'lsa, ichidagi matnni o'qib olamiz
    let finalHtml = form.content_html;
    if (contentFile && contentFile.type === 'text/html') {
      finalHtml = await contentFile.text();
    }

    const answerArray = form.answer_key
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const { data, error } = await supabase.from('tests').insert({
      title: form.title,
      type: form.type,
      scheduled_date: form.scheduled_date,
      content_url: contentUrl,
      content: { html: finalHtml },
      writing_prompt_text: form.type === 'writing' ? form.writing_prompt_text : null,
      writing_prompt_image: form.type === 'writing' ? promptImageUrl : null,
      writing_task: form.type === 'writing' ? form.writing_task : null,
      speaking_part1: form.type === 'speaking' ? form.speaking_part1 : null,
      speaking_part2: form.type === 'speaking' ? form.speaking_part2 : null,
      speaking_part3: form.type === 'speaking' ? form.speaking_part3 : null,
      answer_key: answerArray,
    }).select();

    if (error) {
      setMessage('Unable to create test. Check SQL configuration and try again.');
      console.error(error);
      return;
    }

    if (data?.[0]) {
      setTests([data[0], ...tests]);
      setForm({
        title: '',
        type: 'reading',
        scheduled_date: new Date().toISOString().split('T')[0],
        content_url: '',
        content_html: '',
        answer_key: '',
        writing_prompt_text: '',
        writing_prompt_image: '',
        speaking_part1: '',
        speaking_part2: '',
        speaking_part3: '',
        writing_task: 'task1',
      });
      setContentFile(null);
      setPromptImageFile(null);
      setMessage('Mock exam created successfully. ✅');
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (confirm("Haqiqatan ham bu testni o'chirmoqchimisiz?")) {
      await supabase.from('tests').delete().eq('id', id);
      setTests(tests.filter((t) => t.id !== id));
    }
  };

  if (isLoading) return null;

  return (
    <div className="container mx-auto px-6 py-12 space-y-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-4">
            <Calendar className="text-accent" /> Teacher Management Portal
          </h1>
          <p className="text-muted mt-2">Upload mock exams directly, assign dates, and manage student submissions.</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl text-sm font-bold text-muted">Static Admin: teachJasurbek</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <section className="space-y-8">
          <div className="p-8 glass rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FilePlus size={20} className="text-primary" /> Create New Mock
            </h3>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <input
                type="text"
                placeholder="Test Title (e.g. Cam 18 Test 1)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium text-white"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TestForm['type'] })}
                >
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="writing">Writing</option>
                  <option value="speaking">Speaking</option>
                </select>
                <input
                  type="date"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  required
                />
              </div>

              {/* READING & LISTENING INPUTS */}
              {(form.type === 'reading' || form.type === 'listening') && (
                <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <label className="text-sm font-semibold text-muted">Content URL (Optional link)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium"
                    value={form.content_url}
                    onChange={(e) => setForm({ ...form, content_url: e.target.value })}
                  />
                  <label className="text-sm font-semibold text-muted block">Or upload from your laptop instead:</label>
                  <input
                    type="file"
                    accept={form.type === 'reading' ? 'text/html,application/pdf' : 'audio/*'}
                    onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-white/80"
                  />
                </div>
              )}

              {/* QUESTIONS HTML SECTION (FOR READING/LISTENING) */}
              {(form.type === 'reading' || form.type === 'listening') && (
                <textarea
                  placeholder="Optional printed question HTML text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium h-24"
                  value={form.content_html}
                  onChange={(e) => setForm({ ...form, content_html: e.target.value })}
                />
              )}

              {/* ANSWER KEY (FOR READING/LISTENING) */}
              {(form.type === 'reading' || form.type === 'listening') && (
                <textarea
                  placeholder="Answer Key (comma separated: A, B, C, FALSE, NOT GIVEN)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium h-24"
                  value={form.answer_key}
                  onChange={(e) => setForm({ ...form, answer_key: e.target.value })}
                  required
                />
              )}

              {/* WRITING DYNAMIC SECTION */}
              {form.type === 'writing' && (
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <select
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium text-white"
                    value={form.writing_task}
                    onChange={(e) => setForm({ ...form, writing_task: e.target.value as TestForm['writing_task'] })}
                  >
                    <option value="task1">Task 1 — 20 mins (Report/Map)</option>
                    <option value="task2">Task 2 — 40 mins (Essay)</option>
                  </select>

                  {form.writing_task === 'task1' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted block">Upload Map/Graph Image:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPromptImageFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-white/80"
                      />
                      <input
                        type="url"
                        placeholder="Or paste prompt image URL"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-white"
                        value={form.writing_prompt_image}
                        onChange={(e) => setForm({ ...form, writing_prompt_image: e.target.value })}
                      />
                    </div>
                  )}

                  <textarea
                    placeholder="Writing prompt text question here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium h-24"
                    value={form.writing_prompt_text}
                    onChange={(e) => setForm({ ...form, writing_prompt_text: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* SPEAKING 3 TA PART INTEGRATSIYASI */}
              {form.type === 'speaking' && (
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <label className="text-xs font-bold text-primary block mb-1">PART 1 QUESTIONS</label>
                    <textarea
                      placeholder="Part 1 introduction questions..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none h-16 text-sm text-white"
                      value={form.speaking_part1}
                      onChange={(e) => setForm({ ...form, speaking_part1: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-accent block mb-1">PART 2 CUE CARD</label>
                    <textarea
                      placeholder="Part 2 cue card description..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none h-16 text-sm text-white"
                      value={form.speaking_part2}
                      onChange={(e) => setForm({ ...form, speaking_part2: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-yellow-500 block mb-1">PART 3 DISCUSSION</label>
                    <textarea
                      placeholder="Part 3 follow-up discussion questions..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none h-16 text-sm text-white"
                      value={form.speaking_part3}
                      onChange={(e) => setForm({ ...form, speaking_part3: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud size={20} /> Publish Mock
              </button>
              {message && <p className="text-sm text-center font-semibold text-primary mt-2">{message}</p>}
            </form>
          </div>
        </section>

        {/* O'NG TARAFI: SCHEDULED MOCKS & STUDENT SUBMISSIONS (Sizning kodingiz saqlandi) */}
        <section className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="text-muted" /> Scheduled Mock Exams
            </h3>
            <div className="grid gap-4 max-h-[350px] overflow-y-auto pr-2">
              {tests.map((test) => (
                <div key={test.id} className="p-5 glass border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center font-bold text-xs uppercase text-primary">
                      {test.type.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold">{test.title || 'Untitled'}</h4>
                      <p className="text-xs text-muted">Scheduled for: {test.scheduled_date}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTest(test.id)}
                    className="p-2 hover:bg-accent/10 text-muted hover:text-accent rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-muted" /> Student Submissions
            </h3>
            <div className="overflow-x-auto rounded-3xl border border-white/10 max-h-[400px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-muted sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Test ID</th>
                    <th className="p-4">Raw</th>
                    <th className="p-4">Band</th>
                    <th className="p-4">Date</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{sub.student_name}</td>
                      <td className="p-4 text-sm text-white/80">{sub.test_id}</td>
                      <td className="p-4 font-black">{sub.score_raw ?? '—'}</td>
                      <td className="p-4 font-black text-primary">{sub.score_band ?? '—'}</td>
                      <td className="p-4 text-xs text-muted">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <button
                          className="p-2 hover:text-primary transition-colors cursor-pointer"
                          onClick={() => window.open(`/review/${sub.test_id}?user=${encodeURIComponent(sub.student_name)}`, '_blank')}
                        >
                          <ExternalLink size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
