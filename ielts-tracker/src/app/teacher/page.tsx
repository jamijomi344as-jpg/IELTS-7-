'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, FileText, Image, Headphones, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';

export default function TeacherTestManager() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Fayllarni saqlash uchun state-lar
  const [testFile, setTestFile] = useState<File | null>(null);
  const [readingImage, setReadingImage] = useState<File | null>(null);
  
  // Listening Section audiolari uchun alohida state-lar
  const [audioSec1, setAudioSec1] = useState<File | null>(null);
  const [audioSec2, setAudioSec2] = useState<File | null>(null);
  const [audioSec3, setAudioSec3] = useState<File | null>(null);
  const [audioSec4, setAudioSec4] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ status: 'success' | 'error'; text: string } | null>(null);

  // 📁 SUPABASE STORAGE'GA FAYL YUKLASh FUNKSIYASI
  async function uploadToStorage(file: File, folder: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // 'tests' nomli bucket'ga faylni yuklash
    const { data, error } = await supabase.storage
      .from('tests')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    // Yuklangan faylning ommaviy URL manzilini olish
    const { data: publicUrlData } = supabase.storage
      .from('tests')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  // 🚀 TESTNI BAZAGA SAQLASh
  async function handleCreateTest(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    if (!title.trim()) {
      setMessage({ status: 'error', text: 'Iltimos, test sarlavhasini kiriting!' });
      setUploading(false);
      return;
    }

    if (!testFile && type !== 'writing' && type !== 'speaking') {
      setMessage({ status: 'error', text: 'Iltimos, asosiy test hujjatini (PDF) yuklang!' });
      setUploading(false);
      return;
    }

    try {
      let finalContentUrl = '';
      let finalImageUrl = '';
      let urlAudio1 = '';
      let urlAudio2 = '';
      let urlAudio3 = '';
      let urlAudio4 = '';

      // 1. Asosiy test faylini yuklash (PDF)
      if (testFile) {
        finalContentUrl = await uploadToStorage(testFile, 'documents');
      }

      // 2. Agar Reading bo'lsa va rasm tanlangan bo'lsa yuklash
      if (type === 'reading' && readingImage) {
        finalImageUrl = await uploadToStorage(readingImage, 'images');
      }

      // 3. Agar Listening bo'lsa, har bir Section audiosini alohida yuklash
      if (type === 'listening') {
        if (audioSec1) urlAudio1 = await uploadToStorage(audioSec1, 'audio/section1');
        if (audioSec2) urlAudio2 = await uploadToStorage(audioSec2, 'audio/section2');
        if (audioSec3) urlAudio3 = await uploadToStorage(audioSec3, 'audio/section3');
        if (audioSec4) urlAudio4 = await uploadToStorage(audioSec4, 'audio/section4');
      }

      // 4. Ma'lumotlarni bazaga (Jadvalga) yozish
      const payload = {
        title: title.trim(),
        type: type,
        scheduled_date: scheduledDate,
        content_url: finalContentUrl,
        image_url: finalImageUrl || null,
        // Har bir section audiosi alohida column'ga tushadi
        audio_section1: urlAudio1 || null,
        audio_section2: urlAudio2 || null,
        audio_section3: urlAudio3 || null,
        audio_section4: urlAudio4 || null,
        // Eski kodlar bilan moslikni yo'qotmaslik uchun asosiy audio maydoniga 1-sectionni ulab qo'yamiz
        audio_url: urlAudio1 || null, 
        answer_key: [], // Interaktivlik brauzer yoki HTML tomonda hal bo'lishi uchun bo'sh massiv
        content: title.trim()
      };

      const { error } = await supabase.from('tests').insert(payload);
      if (error) throw error;

      setMessage({ status: 'success', text: 'Fayllar Supabase Storage\'ga yuklandi va test muvaffaqiyatli yaratildi!' });
      
      // Formani tozalash
      setTitle('');
      setTestFile(null);
      setReadingImage(null);
      setAudioSec1(null);
      setAudioSec2(null);
      setAudioSec3(null);
      setAudioSec4(null);

    } catch (err: any) {
      console.error(err);
      setMessage({ status: 'error', text: err.message || 'Fayllarni yuklashda yoki saqlashda xatolik yuz berdi.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 border border-white/10 rounded-3xl text-white space-y-6 my-10 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <UploadCloud className="text-blue-500" />
          <h2 className="text-xl font-bold tracking-tight">Direct File Upload Panel (Supabase Storage)</h2>
        </div>
        <button 
          type="button"
          onClick={() => window.location.href = '/'}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Dashboard
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm transition-all ${
          message.status === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {message.status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleCreateTest} className="space-y-5">
        {/* Test Nomi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Sarlavhasi</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" 
            placeholder="Masalan: Ultimate Practice Test - Volume 1"
          />
        </div>

        {/* Test Turi va Sana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Kategoriya</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktivlashish Sanasi</label>
            <input 
              type="date" 
              value={scheduledDate} 
              onChange={e => setScheduledDate(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" 
            />
          </div>
        </div>

        {/* ── MANA BU YERDA FAQAT FAYL YUKLASh ELEMENTLARI JOLAShGAN ── */}
        
        {/* 1. Asosiy Test Fayli (PDF yoki HTML) */}
        {type !== 'writing' && type !== 'speaking' && (
          <div className="flex flex-col gap-1.5 p-4 bg-slate-950 rounded-2xl border border-white/5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-blue-400" /> Asosiy Test Fayli (PDF yoki Interactive .html)
            </label>
            <input 
              type="file" 
              accept=".pdf,.html"
              onChange={e => setTestFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
            />
            {testFile && <p className="text-[11px] text-emerald-400 font-mono mt-1">Tanlandi: {testFile.name}</p>}
          </div>
        )}

        {/* 2. Reading uchun rasm yuklash paneli */}
        {type === 'reading' && (
          <div className="flex flex-col gap-1.5 p-4 bg-slate-950 rounded-2xl border border-white/5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Image size={14} className="text-emerald-400" /> Qo&apos;shimcha Rasm (Agar matnda xarita yoki diagramma bo&apos;lsa)
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setReadingImage(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer"
            />
            {readingImage && <p className="text-[11px] text-emerald-400 font-mono mt-1">Tanlandi: {readingImage.name}</p>}
          </div>
        )}

        {/* 3. Listening uchun Har bitta Section audio fayllari */}
        {type === 'listening' && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4">
            <label className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Headphones size={14} /> Listening Section Audio Files
            </label>
            
            {/* Section 1 */}
            <div className="flex flex-col gap-1 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-slate-400">Section 1 Audio Track</span>
              <input 
                type="file" 
                accept="audio/*"
                onChange={e => setAudioSec1(e.target.files?.[0] || null)}
                className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 file:cursor-pointer cursor-pointer"
              />
              {audioSec1 && <p className="text-[10px] text-sky-400 font-mono">{audioSec1.name}</p>}
            </div>

            {/* Section 2 */}
            <div className="flex flex-col gap-1 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-slate-400">Section 2 Audio Track</span>
              <input 
                type="file" 
                accept="audio/*"
                onChange={e => setAudioSec2(e.target.files?.[0] || null)}
                className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 file:cursor-pointer cursor-pointer"
              />
              {audioSec2 && <p className="text-[10px] text-sky-400 font-mono">{audioSec2.name}</p>}
            </div>

            {/* Section 3 */}
            <div className="flex flex-col gap-1 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-slate-400">Section 3 Audio Track</span>
              <input 
                type="file" 
                accept="audio/*"
                onChange={e => setAudioSec3(e.target.files?.[0] || null)}
                className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 file:cursor-pointer cursor-pointer"
              />
              {audioSec3 && <p className="text-[10px] text-sky-400 font-mono">{audioSec3.name}</p>}
            </div>

            {/* Section 4 */}
            <div className="flex flex-col gap-1 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-slate-400">Section 4 Audio Track</span>
              <input 
                type="file" 
                accept="audio/*"
                onChange={e => setAudioSec4(e.target.files?.[0] || null)}
                className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 file:cursor-pointer cursor-pointer"
              />
              {audioSec4 && <p className="text-[10px] text-sky-400 font-mono">{audioSec4.name}</p>}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Fayllar Supabase Storage&apos;ga yuklanmoqda...
            </>
          ) : (
            "Testni Avtomatik Yuklash va Saqlash"
          )}
        </button>
      </form>
    </div>
  );
}
