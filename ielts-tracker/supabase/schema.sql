-- supabase/schema.sql

create extension if not exists "uuid-ossp";

create table if not exists tests (
  id uuid primary key default uuid_generate_v4(),
  scheduled_date date not null,
  type text not null check (type in ('reading', 'listening', 'writing', 'speaking')),
  content_url text,
  content jsonb,
  writing_prompt_text text,
  writing_prompt_image text,
  speaking_prompt_text text,
  writing_task text,
  answer_key jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists student_submissions (
  id uuid primary key default uuid_generate_v4(),
  student_name text not null,
  test_id uuid references tests(id) on delete cascade,
  submitted_at timestamp with time zone default now(),
  student_answers jsonb,
  score_summary text,
  score_raw integer,
  score_band numeric,
  writing_text text
);

create table if not exists student_progress_trackers (
  id uuid primary key default uuid_generate_v4(),
  student_name text not null,
  date_key text not null,
  completed_daily_tasks jsonb default '[]'::jsonb,
  completed_fourteen_day_grid jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now(),
  unique (student_name, date_key)
);
