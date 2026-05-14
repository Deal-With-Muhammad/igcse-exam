-- ELS Exam System — initial schema
-- Run this in Supabase SQL editor, or via the Supabase CLI: `supabase db push`.

create extension if not exists "uuid-ossp";

-- ===================================================================
-- profiles: extends auth.users with role and display name
-- ===================================================================
create type user_role as enum ('admin', 'teacher');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role user_role not null default 'teacher',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ===================================================================
-- templates: exam paper templates (header, logo, instructions, etc.)
-- ===================================================================
create table public.templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  school_name text not null default 'ELS',
  school_full_name text not null default 'Empower Learning System',
  logo_url text,
  motto text default 'HUMANITY FIRST',
  header_title text default 'Tri-Review',
  header_year text default '2026',
  instructions text[] default array[]::text[],
  information text[] default array[]::text[],
  final_reminder text default '',
  is_default boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.templates enable row level security;

-- ===================================================================
-- exams: curriculum, subject, level, time, questions live as jsonb
-- ===================================================================
create type exam_curriculum as enum ('igcse', 'ged', 'other');

create table public.exams (
  id uuid primary key default uuid_generate_v4(),
  share_code text unique not null,
  title text not null,
  description text default '',
  curriculum exam_curriculum not null default 'igcse',
  subject text not null,
  level text default '',
  part text default '',
  time_limit_minutes integer default 60,
  total_marks integer default 0,
  template_id uuid references public.templates(id) on delete set null,
  reference_images text[] default array[]::text[],
  questions jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.exams enable row level security;

create index exams_created_by_idx on public.exams(created_by);
create index exams_share_code_idx on public.exams(share_code);

-- ===================================================================
-- submissions: student attempts + answers + grading state
-- ===================================================================
create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  exam_title text not null,
  student_name text not null,
  student_class text not null,
  branch text not null,
  branch_name text not null,
  answers jsonb not null default '[]'::jsonb,
  switch_log jsonb not null default '[]'::jsonb,
  warnings integer not null default 0,
  total_switches integer not null default 0,
  terminated boolean not null default false,
  submitted_at timestamptz not null default now(),
  graded boolean not null default false,
  grades jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  total_score numeric default 0,
  max_score numeric default 0,
  graded_at timestamptz
);
alter table public.submissions enable row level security;

create index submissions_exam_id_idx on public.submissions(exam_id);
create index submissions_graded_idx on public.submissions(graded);

-- ===================================================================
-- Admin check helper — SECURITY DEFINER bypasses RLS so policies that
-- ask "is the current user an admin?" don't recurse back into profiles.
-- ===================================================================
create or replace function public.is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from profiles where id = auth.uid()),
    false
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- ===================================================================
-- RLS policies
-- ===================================================================
-- profiles
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- templates: any authenticated user can read, only admins write
create policy "templates_read_all" on public.templates
  for select using (auth.uid() is not null);
create policy "templates_admin_write" on public.templates
  for all using (public.is_admin());

-- exams: teachers can CRUD their own, admins can CRUD all, students can read by share_code
create policy "exams_owner_all" on public.exams
  for all using (created_by = auth.uid());
create policy "exams_admin_all" on public.exams
  for all using (public.is_admin());
create policy "exams_public_read" on public.exams
  for select using (true);  -- public read for students; share code lookup is the gate

-- submissions
create policy "submissions_public_insert" on public.submissions
  for insert with check (true);
create policy "submissions_owner_select" on public.submissions
  for select using (
    exists (select 1 from public.exams e where e.id = submissions.exam_id and e.created_by = auth.uid())
  );
create policy "submissions_admin_select" on public.submissions
  for select using (public.is_admin());
create policy "submissions_owner_update" on public.submissions
  for update using (
    exists (select 1 from public.exams e where e.id = submissions.exam_id and e.created_by = auth.uid())
  );
create policy "submissions_admin_update" on public.submissions
  for update using (public.is_admin());
create policy "submissions_owner_delete" on public.submissions
  for delete using (
    exists (select 1 from public.exams e where e.id = submissions.exam_id and e.created_by = auth.uid())
  );

-- ===================================================================
-- Storage buckets (run separately if SQL fails: create via dashboard)
-- ===================================================================
insert into storage.buckets (id, name, public) values ('question-images', 'question-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('template-assets', 'template-assets', true)
  on conflict (id) do nothing;

create policy "question_images_public_read" on storage.objects
  for select using (bucket_id = 'question-images');
create policy "question_images_auth_write" on storage.objects
  for insert with check (bucket_id = 'question-images' and auth.uid() is not null);
create policy "question_images_auth_delete" on storage.objects
  for delete using (bucket_id = 'question-images' and auth.uid() is not null);

create policy "template_assets_public_read" on storage.objects
  for select using (bucket_id = 'template-assets');
create policy "template_assets_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'template-assets' and public.is_admin()
  );

-- ===================================================================
-- Seed default ELS template
-- ===================================================================
insert into public.templates (name, school_name, school_full_name, motto, header_title, header_year, instructions, information, final_reminder, is_default)
values (
  'ELS Default Template',
  'ELS',
  'Empower Learning System',
  'HUMANITY FIRST',
  'Tri-Review',
  '2026',
  array[
    'Answer all questions.',
    'Use a black or dark blue pen.',
    'Write your name, centre number and candidate number in the boxes at the top of the page.',
    'Write your answer to each question in the space provided.',
    'Do not use an erasable pen or correction fluid.',
    'Do not write on any bar codes.',
    'You may use an HB pencil for any diagrams, graphs or rough working.',
    'You must complete the quiz and turn it in within the allotted time.',
    'Read each question carefully before answering to ensure you understand what is being asked.',
    'Misinterpreted questions due to rushing may lead to incorrect answers.'
  ],
  array[
    'The total mark for this paper is shown on the front cover.',
    'The number of marks for each question or part question is shown in brackets [ ].',
    'Once the quiz begins, you must finish and submit it no later than the given deadline.',
    'If you finish early, review your answers before submitting.'
  ],
  'Stay focused, watch the time, and ensure your quiz is submitted before time runs out.',
  true
)
on conflict do nothing;
