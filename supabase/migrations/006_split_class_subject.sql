-- ===================================================================
-- 006  Split conflated "Class-Subject" classes into Class + Subject.
--
-- Some classes were created as a class+subject combo, e.g. "IGCSE-ICT",
-- "GED-Math", "G8-Science". This migration:
--   • adds a `subjects` table (admin-managed, like `classes`)
--   • adds `teacher_subjects` (teacher ⇄ subject, many-to-many)
--   • creates the real classes (IGCSE / GED / G8)
--   • re-points existing EXAMS at the real class and sets the right subject
--   • re-points existing TEACHER assignments to class + subject
--   • deletes ONLY the bad combo class rows (no exams are deleted)
--
-- Only names starting with 'IGCSE-', 'GED-' or 'G8-' are treated as combos,
-- so pure classes like "Pre-K", "Level-1", "Jr. Nursery" are never touched.
--
-- Safe to paste into the Supabase SQL editor. Runs in a single transaction.
-- ===================================================================

begin;

-- 1) Subjects: admin-managed list, readable by any signed-in user. ---------
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.subjects enable row level security;

drop policy if exists "subjects_read_all" on public.subjects;
create policy "subjects_read_all" on public.subjects
  for select using (auth.uid() is not null);

drop policy if exists "subjects_admin_write" on public.subjects;
create policy "subjects_admin_write" on public.subjects
  for all using (public.is_admin());

-- 2) Teacher ⇄ Subject assignments (many-to-many). ------------------------
create table if not exists public.teacher_subjects (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, subject_id)
);
alter table public.teacher_subjects enable row level security;
create index if not exists teacher_subjects_subject_id_idx on public.teacher_subjects(subject_id);

drop policy if exists "teacher_subjects_self_read" on public.teacher_subjects;
create policy "teacher_subjects_self_read" on public.teacher_subjects
  for select using (teacher_id = auth.uid());

drop policy if exists "teacher_subjects_admin_all" on public.teacher_subjects;
create policy "teacher_subjects_admin_all" on public.teacher_subjects
  for all using (public.is_admin());

-- 3) Snapshot of the combo classes, with class/subject split out. ----------
create temporary table _combo as
select
  id                                                  as old_id,
  name                                                as old_name,
  split_part(name, '-', 1)                            as class_name,
  substring(name from position('-' in name) + 1)      as subject_name
from public.classes
where name like 'IGCSE-%' or name like 'GED-%' or name like 'G8-%';

-- 4) Create the real classes (IGCSE / GED / G8) if they don't exist. -------
insert into public.classes (name, sort_order)
select distinct c.class_name,
       case c.class_name when 'G8' then 210 when 'IGCSE' then 250 when 'GED' then 260 else 900 end
from _combo c
on conflict (name) do nothing;

-- 5) Create the subjects pulled out of the combos. -------------------------
insert into public.subjects (name, sort_order)
select subject_name, (row_number() over (order by subject_name)) * 10
from (select distinct subject_name from _combo) s
on conflict (name) do nothing;

-- 6) Re-point EXAMS: real class + correct subject text. No exams deleted. ---
update public.exams e
set class_id = nc.id,
    subject  = c.subject_name
from _combo c
join public.classes nc on nc.name = c.class_name
where e.class_id = c.old_id;

-- 7) Re-point TEACHER assignments: add the real class + the subject. -------
insert into public.teacher_classes (teacher_id, class_id)
select tc.teacher_id, nc.id
from public.teacher_classes tc
join _combo c        on c.old_id = tc.class_id
join public.classes nc on nc.name = c.class_name
on conflict do nothing;

insert into public.teacher_subjects (teacher_id, subject_id)
select tc.teacher_id, s.id
from public.teacher_classes tc
join _combo c          on c.old_id = tc.class_id
join public.subjects s on s.name = c.subject_name
on conflict do nothing;

delete from public.teacher_classes tc
using _combo c
where tc.class_id = c.old_id;

-- 8) Clear the deprecated single-class pointer if it referenced a combo. ----
update public.profiles p
set class_id = null
from _combo c
where p.class_id = c.old_id;

-- 9) Finally remove the bad combo class rows (nothing references them now). -
delete from public.classes c using _combo x where c.id = x.old_id;

drop table _combo;

commit;
