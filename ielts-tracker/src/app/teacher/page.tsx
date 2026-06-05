'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, FileCode, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TeacherTestManager() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  
  // HTML kiritish usullari
  const [contentType, setContentType] = useState<'pdf' | 'html_code'>('pdf');
  const [contentHtml, setContentHtml] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Standart PDFlar uchun javoblar kaliti
  const [answers, setAnswers] = useState<string[]>([]);
  const [newAnswer, setNewAnswer] = useState('');

  const [message, setMessage] = useState<{ status: 'success' | 'error'; text: string } | null>(null);

  // Yuklanayotgan test HTML ekanligini aniqlash
  const isHtmlTest = 
    contentType === 'html_code' || 
    contentUrl.endsWith('.html') || 
    contentUrl.includes('html') ||
    contentHtml.trim().startsWith('<!DOCTYPE') || 
    contentHtml.trim().startsWith('<html');

  // Javob qo'shish (Faqat PDF/Standart testlar uchun)
  function handleAddAnswer() {
    if (!newAnswer.trim()) return;
    setAnswers([...answers, newAnswer.trim().toUpperCase()]);
    setNewAnswer('');
  }

  // Javobni o'chirish
  function handleRemoveAnswer(index: number) {
    setAnswers(answers.filter((_, i) => i !== index));
  }

  // 🚀 TESTNI BAZAGA YUKLASH FUNKSIYASI (Siz so'ragan asosiy qism)
  async function handleCreateTest(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    if (!title.trim()) {
      setMessage({ status: 'error', text: 'Iltimos, test nomini kiriting!' });
      setUploading(false);
      return;
    }

    // ── HTML TEST UCHUN TEKSHIRUV ──
    if (isHtmlTest) {
      // Agar HTML bo'lsa, answer_key mutlaqo shart emas va bo'sh massiv ketadi
      console.log("HTML test aniqlandi. Javoblar kaliti majburiy emas.");
    } else {
      // Agar PDF yoki oddiy test bo'lsa, javoblar kaliti kiritilganini tekshiramiz (Reading/Listening uchun)
      if ((type === 'reading' || type === 'listening') && answers.length === 0) {
        setMessage({ status: 'error', text: 'PDF testlar uchun kamida 1 ta to\'g\'ri javob (Answer Key) kiritishingiz shart!' });
        setUploading(false);
        return;
      }
    }

    try {
      const payload = {
        title: title.trim(),
        type: type,
        scheduled_date: scheduledDate,
        content_html: contentType === 'html_code' ? contentHtml : null,
        content_url: contentType === 'pdf' ? contentUrl : null,
        audio_url: type === 'listening' ? audioUrl : null,
        // Agarda HTML test bo'lsa javoblar kalitini o'rniga bo'sh array jo'natamiz
        answer_key: isHtmlTest ? [] : answers, 
        content: contentType === 'html_code' ? contentHtml : (contentUrl || title)
      };

      const { error } = await supabase.from('tests').insert(payload);

      if (error) throw error;

      setMessage({ status: 'success', text: 'Test muvaffaqiyatli yaratildi va bazaga qo\'shildi!' });
      
      // Formani tozalash
      setTitle('');
      setContentHtml('');
      setContentUrl('');
      setAudioUrl('');
      setAnswers([]);
    } catch (err: any) {
      console.error(err);
      setMessage({ status: 'error', text: err.message || 'Xatolik yuz berdi. SQL konfiguratsiyasini tekshiring.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 border border-white/10 rounded-3xl text-white space-y-6">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <Plus className="text-blue-500" />
        <h2 className="text-xl font-bold">Yangi IELTS Test Yuklash (Teacher Panel)</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${message.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {message.status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleCreateTest} className="space-y-4">
        {/* Test Nomi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase">Test Sarlavhasi</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" 
            placeholder="Masalan: Cambridge 18 - Test 1 Reading"
          />
        </div>

        {/* Test Turi va Sana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Test Turi</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">O'quvchilarga ko'rinish sanasi</label>
            <input 
              type="date" 
              value={scheduledDate} 
              onChange={e => setScheduledDate(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" 
            />
          </div>
        </div>

        {/* Kontent Turi (PDF yoki HTML) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase">Kontent formati</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-white/10">
            <button 
              type="button" 
              onClick={() => setContentType('pdf')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${contentType === 'pdf' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <FileText size={14} /> PDF / URL orqali
            </button>
            <button 
              type="button" 
              onClick={() => setContentType('html_code')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${contentType === 'html_code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <FileCode size={14} /> Interaktiv HTML fayl kodi
            </button>
          </div>
        </div>

        {/* Kontent kiritish maydoni */}
        {contentType === 'pdf' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Fayl URL manzili (Storage Public URL)</label>
            <input 
              type="text" 
              value={contentUrl} 
              onChange={e => setContentUrl(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" 
              placeholder="https://your-supabase.supabase.co/storage/v1/object/public/..."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">HTML To'liq Kodi (`<!DOCTYPE html>...` bilan birga)</label>
            <textarea 
              rows={6}
              value={contentHtml} 
              onChange={e => setContentHtml(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono" 
              placeholder="<!DOCTYPE html><html><head>...</head><body>...</body></html>"
            />
          </div>
        )}

        {/* Listening uchun Audio Track URL */}
        {type === 'listening' && (
          <div className="flex flex-col gap-1.5 bg-sky-950/20 p-4 rounded-xl border border-sky-500/10">
            <label className="text-xs font-bold text-sky-400 uppercase">Listening Audio URL (Agar HTML ichida audio bo'lmasa)</label>
            <input 
              type="text" 
              value={audioUrl} 
              onChange={e => setAudioUrl(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-mono" 
              placeholder="https://.../audio.mp3"
            />
          </div>
        )}

        {/* ── JAVOBLAR KALITI BO'LIMI (HTML BO'LSA AVTOMATIK YASHIRILADI VA SO'RALMAYDI) ── */}
        {!isHtmlTest && (type === 'reading' || type === 'listening') ? (
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-3">
            <label className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5">
              Answer Key Sheet (PDF uchun majburiy)
            </label>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAnswer())}
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white uppercase font-mono"
                placeholder="Masalan: TRUE, B, NOT GIVEN, 30"
              />
              <button 
                type="button" 
                onClick={handleAddAnswer}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-colors"
              >
                Qo'shish
              </button>
            </div>

            {/* Qo'shilgan javoblar ro'yxati */}
            <div className="grid grid-cols-4 gap-2 pt-2 max-h-32 overflow-y-auto">
              {answers.map((ans, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900 border border-white/10 px-2 py-1 rounded-lg text-xs font-mono">
                  <span><strong className="text-slate-500">{idx+1}.</strong> {ans}</span>
                  <button type="button" onClick={() => handleRemoveAnswer(idx)} className="text-rose-500 hover:text-rose-400 ml-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : isHtmlTest && (type === 'reading' || type === 'listening') ? (
          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
            <p className="text-xs text-emerald-400 italic">
              ℹ️ Siz interaktiv HTML format tanladingiz. Tizim javoblar paneli va Answer Key kiritishni avtomatik ravishda bekor qildi. Test ichidagi JavaScript o'zi natijalarni baholaydi.
            </p>
          </div>
        ) : null}

        {/* Submit tugmasi */}
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {uploading ? "Yuklanmoqda..." : "Testni Yakunlash va Saqlash"}
        </button>
      </form>
    </div>
  );
}

      
