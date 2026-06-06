// src/types/index.ts

export type TestType    = 'reading' | 'listening' | 'writing' | 'speaking';
export type ExamMode    = 'exam' | 'exercise';
export type WritingTask = 'task1' | 'task2';
export type ContentType = 'html' | 'pdf';
export type AudioType   = 'embedded' | 'single' | 'sections';

// ── Savol turlari ────────────────────────────────────────────────
export type QuestionType = 'text' | 'mcq' | 'tfng' | 'fill' | 'matching';

export interface Question {
  num: number;
  type: QuestionType;
  question: string;
  options?: string[];      // mcq, matching uchun
  hint?: string;           // ixtiyoriy maslahat
}

export interface AudioSection {
  section: number;
  label?: string;          // "Section 1", "Part A" kabi
  url: string;
}

// ── Asosiy test interfeysi ───────────────────────────────────────
export interface Test {
  id: string;
  created_at: string;
  title: string;
  scheduled_date: string;
  type: TestType;
  is_active: boolean;

  // Reading / Listening
  content_type?: ContentType;
  content_html?: string;
  content_url?: string;
  questions?: Question[];
  answer_key?: Record<string, string>;
  time_limit_secs?: number;

  // Listening audio
  audio_type?: AudioType;
  audio_url?: string;
  audio_sections?: AudioSection[];

  // Writing
  writing_task?: WritingTask;
  writing_prompt_text?: string;
  writing_prompt_image?: string;
  writing_time_secs?: number;

  // Speaking
  speaking_part1?: string[];
  speaking_part2?: string[];
  speaking_part3?: string[];
}

// ── Talaba topshirig'i ───────────────────────────────────────────
export interface StudentSubmission {
  id: string;
  created_at: string;
  submitted_at: string;
  student_name: string;
  test_id: string;
  test_type?: string;
  test_title?: string;
  exam_mode?: ExamMode;
  status?: 'in_progress' | 'submitted';

  student_answers?: Record<string, string>;
  score_raw?: number;
  score_total?: number;
  score_band?: number;
  score_summary?: string;

  writing_text?: string;
  word_count?: number;
  time_taken_secs?: number;
  teacher_feedback?: string;
  is_reviewed?: boolean;
}

// ── Tracker ──────────────────────────────────────────────────────
export interface ProgressTracker {
  id: string;
  student_name: string;
  date_key: string;
  daily_tasks: Record<string, boolean>;
  grid_14day: Record<string, {
    input: Record<string, boolean>;
    output: Record<string, boolean>;
  }>;
  session_start?: string;
  score_before?: string;
  score_target?: string;
}

// ── Teacher notification ─────────────────────────────────────────
export interface TeacherNotification {
  id: string;
  created_at: string;
  student_name: string;
  submission_id: string;
  test_title?: string;
  test_type?: string;
  is_read: boolean;
}

// ════════════════════════════════════════════════════════════════
// IELTS BAND SCORE JADVALLAR (rasmiy)
// ════════════════════════════════════════════════════════════════
export const READING_BAND: Record<number, number> = {
  40:9.0, 39:9.0, 38:8.5, 37:8.5, 36:8.0, 35:8.0,
  34:7.5, 33:7.5, 32:7.5, 31:7.0, 30:7.0, 29:7.0,
  28:6.5, 27:6.5, 26:6.5, 25:6.0, 24:6.0, 23:6.0,
  22:5.5, 21:5.5, 20:5.5, 19:5.0, 18:5.0, 17:5.0,
  16:4.5, 15:4.5, 14:4.5, 13:4.0, 12:4.0, 11:3.5,
};
export const LISTENING_BAND: Record<number, number> = {
  40:9.0, 39:9.0, 38:8.5, 37:8.5, 36:8.0, 35:8.0,
  34:7.5, 33:7.5, 32:7.0, 31:7.0, 30:6.5, 29:6.5,
  28:6.5, 27:6.0, 26:6.0, 25:6.0, 24:5.5, 23:5.5,
  22:5.0, 21:5.0, 20:5.0, 19:4.5, 18:4.5, 17:4.0,
  16:4.0, 15:3.5, 14:3.5, 13:3.0,
};
export function getBand(raw: number, type: 'reading' | 'listening'): number {
  const table = type === 'reading' ? READING_BAND : LISTENING_BAND;
  return table[Math.min(raw, 40)] ?? (raw > 0 ? 3.0 : 0);
}

// ════════════════════════════════════════════════════════════════
// KUNLIK TRACKER VAZIFALARI (PDF 1 dan — to'liq)
// ════════════════════════════════════════════════════════════════
export const DAILY_TASKS = [
  {
    id: 'complex_accuracy',
    emoji: '🔧',
    zone: 'Complex Accuracy',
    title: 'Grammar & Collocation Audit',
    desc: '3 ta so\'nggi xatingizni ko\'rib chiqing. Har birini inversiya, uchinchi shartli gap yoki murakkab ot iborasi ishlatib qayta yozing.',
    time: '5 daqiqa',
    color: 'emerald',
  },
  {
    id: 'speaking_cohesion',
    emoji: '🗣️',
    zone: 'Speaking',
    title: 'Part 2 Cohesion & Idioms',
    desc: '2 daqiqalik cue card javobini yozing. Matnni tekshiring: "but", "because", "so" o\'rniga ilg\'or bog\'lovchilar qo\'llang. Qayta yozing.',
    time: '15 daqiqa',
    color: 'sky',
  },
  {
    id: 'reading_crunch',
    emoji: '📖',
    zone: 'Reading',
    title: '18 Daqiqalik Crunch',
    desc: 'Aynan 1 ta reading passage (13-14 savol) qiling. Band 7 uchun 18 daqiqa limitga rioya qiling — qiyin passajlarga vaqt qolsin.',
    time: '18 daqiqa',
    color: 'violet',
  },
  {
    id: 'vocab_collocation',
    emoji: '💡',
    zone: 'Vocabulary',
    title: 'Collocation & Context Mapping',
    desc: 'Reading passajingizdan 3 ta kalit so\'z toping. Matn sinonimlarini xaritalashtiring. Lug\'at kolokatsiyalarini qidiring, 2 ta original jumla yozing.',
    time: '12 daqiqa',
    color: 'amber',
  },
  {
    id: 'listening_distractor',
    emoji: '🎧',
    zone: 'Listening',
    title: 'Distractor & Detail Audit',
    desc: '1 ta audio bo\'lim bajaring (Section 3 yoki 4). Faqat javoblarni emas, noto\'g\'ri javoblarni tahlil qiling: \'tuzog\'ni\' aniqlang, imlo/ko\'plik tekshiring.',
    time: '15 daqiqa',
    color: 'rose',
  },
  {
    id: 'writing_task1',
    emoji: '✍️',
    zone: 'Writing',
    title: 'Task 1 High-Feature Drill',
    desc: 'Istalgan chart tanlang. Kirish parafrazini va 2 jumlali umumiy ko\'rinishni yozing. Faqat raqam sanash emas — murakkab taqqoslash tuzilmalari ishlating.',
    time: '15 daqiqa',
    color: 'orange',
  },
  {
    id: 'writing_task2',
    emoji: '✍️',
    zone: 'Writing',
    title: 'Task 2 Advanced PEEL Build',
    desc: 'Esse prompti tanlang, PEEL tuzilmasida 1 ta asosiy paragraf yozing. "Explanation" da shartli/yo\'l qo\'yish gaplari, "Example" da aniq leksika bo\'lsin.',
    time: '20 daqiqa',
    color: 'teal',
  },
] as const;

// ════════════════════════════════════════════════════════════════
// 14 KUNLIK TRACKER (PDF 2 dan — to'liq)
// ════════════════════════════════════════════════════════════════
export const INPUT_TASKS = [
  { id: 'carnegie',        label: 'Reading Novel: Dale Carnegie (20 bet)',     note: '3 ta suhbat ifodasini yozing'             },
  { id: 'documentary',     label: 'Documentary ko\'rish (1 soat)',             note: 'Ona tili tezligiga e\'tibor bering'        },
  { id: 'new_scientist',   label: 'New Scientist: 1 ta maqola',               note: '5 ta ilg\'or kolokatsiyani belgilang'      },
  { id: 'speaking_videos', label: 'Speaking Videos ko\'rish: Band 8/9',        note: 'Part 3 abstrak g\'oyalarni tahlil qiling'  },
  { id: 'sample_writing',  label: 'Namuna Writing o\'qish',                   note: '1 Task 1 + 1 Task 2 esseni parchalang'    },
] as const;

export const OUTPUT_TASKS = [
  { id: 'reading_full',   label: 'Reading Passages 1, 2, 3',        note: 'To\'liq test, qattiq imtihon sharoitida'         },
  { id: 'listening_full', label: 'Listening Sections 1, 2, 3, 4',  note: 'To\'liq test, imlo/ko\'plik auditini o\'tkazing' },
  { id: 'writing_full',   label: 'Writing Task 1 / 2',              note: 'Ilg\'or umumiy ko\'rinish yoki PEEL paragraf'     },
  { id: 'speaking_full',  label: 'Speaking Parts 1, 2, 3',          note: 'Yozing, transkripsiya qiling, qayta yozing'      },
] as const;

export const DAYS_14 = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
