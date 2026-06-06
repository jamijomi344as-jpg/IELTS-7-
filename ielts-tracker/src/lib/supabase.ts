// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anon);

// ── Storage ──────────────────────────────────────────────────────
export const BUCKET = 'ielts-files';

export function getFileUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  file: File,
  folder: 'reading' | 'audio' | 'images'
): Promise<string> {
  const ext  = file.name.split('.').pop() ?? 'bin';
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(name, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return getFileUrl(data.path);
}

// ── localStorage kalitlari ───────────────────────────────────────
export const LS = {
  STUDENT_NAME: 'ielts_student_name',
  IS_TEACHER:   'ielts_is_teacher',
  EXAM_ANSWERS: (id: string) => `ielts_answers_${id}`,
  WRITING_DRAFT: (id: string) => `ielts_writing_${id}`,
};
