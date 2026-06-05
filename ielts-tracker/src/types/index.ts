// src/types/index.ts
export type TestType    = 'reading' | 'listening' | 'writing' | 'speaking';
export type ExamMode    = 'exam' | 'exercise';
export type WritingTask = 'task1' | 'task2';

export interface Test {
  id: string;
  created_at: string;
  title: string;
  scheduled_date: string;
  type: TestType;
  content_html?: string;
  content_url?: string;
  audio_url?: string;
  has_embedded_audio?: boolean;
  answer_key?: string[];
  writing_task?: WritingTask;
  writing_prompt_text?: string;
  writing_prompt_image?: string;
  speaking_part1?: string[];
  speaking_part2?: string[];
  speaking_part3?: string[];
}

export interface StudentSubmission {
  id: string;
  created_at: string;
  submitted_at: string;
  student_name: string;
  test_id: string;
  test_type?: string;
  test_title?: string;
  exam_mode?: ExamMode;
  student_answers?: Record<string, string>;
  score_raw?: number;
  score_band?: number;
  score_summary?: string;
  writing_text?: string;
  word_count?: number;
  time_taken_secs?: number;
  is_reviewed?: boolean;
}

export interface ProgressTracker {
  id: string;
  student_name: string;
  date_key: string;
  completed_daily_tasks: Record<string, boolean>;
  completed_fourteen_day_grid: Record<string, {
    input: Record<string, boolean>;
    output: Record<string, boolean>;
  }>;
}

export interface TeacherNotification {
  id: string;
  created_at: string;
  student_name: string;
  submission_id: string;
  is_read: boolean;
}

// IELTS Band Score Tables
export const READING_BAND: Record<number, number> = {
  40:9.0,39:9.0,38:8.5,37:8.5,36:8.0,35:8.0,
  34:7.5,33:7.5,32:7.5,31:7.0,30:7.0,29:7.0,
  28:6.5,27:6.5,26:6.5,25:6.0,24:6.0,23:6.0,
  22:5.5,21:5.5,20:5.5,19:5.0,18:5.0,17:5.0,
  16:4.5,15:4.5,14:4.5,13:4.0,12:4.0,
};
export const LISTENING_BAND: Record<number, number> = {
  40:9.0,39:9.0,38:8.5,37:8.5,36:8.0,35:8.0,
  34:7.5,33:7.5,32:7.0,31:7.0,30:6.5,29:6.5,
  28:6.5,27:6.0,26:6.0,25:6.0,24:5.5,23:5.5,
  22:5.0,21:5.0,20:5.0,19:4.5,18:4.5,17:4.0,
  16:4.0,15:3.5,
};
export function getBand(raw: number, type: 'reading' | 'listening'): number {
  const t = type === 'reading' ? READING_BAND : LISTENING_BAND;
  return t[raw] ?? (raw > 0 ? 3.0 : 0);
}

// Daily Band 7 Skill Zone — from the uploaded PDF tracker
export const DAILY_TASKS = [
  { id:'complex_accuracy',    emoji:'🔧', title:'Complex Accuracy',
    desc:'Grammar & Collocation Audit: Review 3 recent errors. Rewrite using inversion, third conditional, or complex noun phrase with 100% accuracy.',
    time:'5 min' },
  { id:'speaking_cohesion',   emoji:'🗣️', title:'Speaking Part 2 Cohesion & Idioms',
    desc:'Record a 2-min cue card. Transcribe it. Replace basic transitions with advanced discourse markers (not but/because/so). Re-record for fluency.',
    time:'15 min' },
  { id:'reading_crunch',      emoji:'📖', title:'Reading 18-Minute Crunch',
    desc:'Complete exactly 1 reading passage (13-14 questions) under a strict 18-minute timer to save time for harder passages.',
    time:'18 min' },
  { id:'vocab_collocation',   emoji:'💡', title:'Vocabulary Collocation Mapping',
    desc:'From your passage: find 3 key words, map text synonyms, look up dictionary collocations, write 2 original sentences using them naturally.',
    time:'12 min' },
  { id:'listening_distractor',emoji:'🎧', title:'Listening Distractor Audit',
    desc:'Do 1 audio section (Section 3 or 4). Analyze missed questions: write down the exact trap/distractor the speaker used + spelling/plural check.',
    time:'15 min' },
  { id:'writing_task1_drill', emoji:'✍️', title:'Writing Task 1 High-Feature Drill',
    desc:'Pick any chart. Write intro paraphrase + 2-sentence overview highlighting key trends using complex comparison structures, not just numbers.',
    time:'15 min' },
  { id:'writing_task2_peel',  emoji:'✍️', title:'Writing Task 2 Advanced PEEL Build',
    desc:"Write 1 PEEL body paragraph. Explanation must use conditional/concession clauses. Example uses precise, topic-specific vocabulary.",
    time:'20 min' },
] as const;

// 14-Day Tracker — from the uploaded 14-day PDF
export const INPUT_TASKS_14 = [
  { id:'carnegie',        label:'Reading Novel: Dale Carnegie (20 pages)',     note:'Note 3 conversational expressions'                  },
  { id:'documentary',     label:'Watching Documentary (1 hour)',               note:'Focus on native-speed pronunciation'                },
  { id:'new_scientist',   label:'Reading New Scientist: 1 article',            note:'Highlight 5 advanced collocations'                  },
  { id:'speaking_videos', label:'Watching Speaking Videos: Band 8/9 tests',    note:'Analyze Part 3 abstract ideas'                      },
  { id:'sample_writing',  label:'Reading Sample Writing',                      note:'Deconstruct 1 Task 1 report + 1 Task 2 essay'       },
] as const;

export const OUTPUT_TASKS_14 = [
  { id:'reading_full',   label:'Reading Passages 1, 2, 3',       note:'Full test under strict exam conditions'                   },
  { id:'listening_full', label:'Listening Sections 1, 2, 3, 4', note:'Full test with strict spelling/plural audits'             },
  { id:'writing_full',   label:'Writing Task 1 / 2',             note:'Write 1 advanced overview or 1 complex PEEL paragraph'   },
  { id:'speaking_full',  label:'Speaking Parts 1, 2, 3',         note:'Record, transcribe, and re-record to fix slips'          },
] as const;

export const DAYS_14 = Array.from({length:14}, (_,i) => `D${i+1}`);
