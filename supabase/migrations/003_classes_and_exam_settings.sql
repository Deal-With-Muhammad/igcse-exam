-- ===================================================================
-- Classes (Jr. Nursery … GED) — admin-managed list. A teacher is
-- optionally pinned to one class so their dashboard only shows that
-- class's exams. Admins have no class and see everything.
-- ===================================================================
create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.classes enable row level security;

create policy "classes_read_all" on public.classes
  for select using (auth.uid() is not null);
create policy "classes_admin_write" on public.classes
  for all using (public.is_admin());

insert into public.classes (name, sort_order) values
  ('Jr. Nursery', 10),
  ('Sr. Nursery', 20),
  ('Prep',        30),
  ('Pre-K',       40),
  ('KG',          50),
  ('Level-1',     60),
  ('Level-2',     70),
  ('Level-3',     80),
  ('Level-4',     90),
  ('Level-5',    100),
  ('Level-6',    110),
  ('Level-7',    120),
  ('Level-8',    130),
  ('Grade-1',    140),
  ('Grade-2',    150),
  ('Grade-3',    160),
  ('Grade-4',    170),
  ('Grade-5',    180),
  ('Grade-6',    190),
  ('Grade-7',    200),
  ('IGCSE-1',    210),
  ('IGCSE-2',    220),
  ('IGCSE-3',    230),
  ('GED',        240)
on conflict (name) do nothing;

-- ===================================================================
-- profiles: optional class_id
-- ===================================================================
alter table public.profiles
  add column if not exists class_id uuid references public.classes(id) on delete set null;

-- ===================================================================
-- exams: class pin + termination + nullable timer
-- ===================================================================
alter table public.exams
  add column if not exists class_id uuid references public.classes(id) on delete set null;

alter table public.exams
  add column if not exists terminate_on_switch boolean not null default true;

alter table public.exams
  add column if not exists max_warnings integer not null default 1;

-- allow null time limit (= no time limit). The old default of 60 stays
-- for rows that were already inserted; new code passes explicit values.
alter table public.exams alter column time_limit_minutes drop not null;
alter table public.exams alter column time_limit_minutes drop default;

create index if not exists exams_class_id_idx on public.exams(class_id);

-- ===================================================================
-- Exam-list policy: teacher with a class only sees their class's exams
-- (plus their own). Admins see everything via exams_admin_all.
-- ===================================================================
drop policy if exists "exams_owner_all" on public.exams;
create policy "exams_owner_all" on public.exams
  for all using (
    created_by = auth.uid()
    or class_id is not null
       and class_id = (select class_id from public.profiles where id = auth.uid())
  );
