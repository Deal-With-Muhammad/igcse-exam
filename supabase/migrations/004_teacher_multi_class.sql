-- ===================================================================
-- Teacher ⇄ Class assignments (many-to-many).
--
-- Previously a teacher was pinned to at most ONE class via
-- profiles.class_id. A teacher can now be assigned to MANY classes.
-- A teacher sees every exam pinned to ANY of their classes (plus the
-- exams they personally created). Admins still see everything.
--
-- Run this in the Supabase SQL editor (same as the earlier migrations).
-- ===================================================================

create table if not exists public.teacher_classes (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id   uuid not null references public.classes(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, class_id)
);
alter table public.teacher_classes enable row level security;

create index if not exists teacher_classes_class_id_idx on public.teacher_classes(class_id);

-- A teacher reads their own assignments; admins read/write everything.
drop policy if exists "teacher_classes_self_read" on public.teacher_classes;
create policy "teacher_classes_self_read" on public.teacher_classes
  for select using (teacher_id = auth.uid());

drop policy if exists "teacher_classes_admin_all" on public.teacher_classes;
create policy "teacher_classes_admin_all" on public.teacher_classes
  for all using (public.is_admin());

-- Backfill from the old single-class column so existing teachers keep
-- the class they already had.
insert into public.teacher_classes (teacher_id, class_id)
  select id, class_id from public.profiles where class_id is not null
on conflict do nothing;

-- ===================================================================
-- SECURITY DEFINER helper: the set of class ids the current user is
-- assigned to. Bypasses RLS so the exam policy can reference it without
-- recursing into teacher_classes' own policies.
-- ===================================================================
create or replace function public.my_class_ids()
  returns setof uuid
  language sql
  security definer
  stable
  set search_path = public
as $$
  select class_id from public.teacher_classes where teacher_id = auth.uid();
$$;
revoke all on function public.my_class_ids() from public;
grant execute on function public.my_class_ids() to authenticated, anon;

-- ===================================================================
-- Exam-list policy: a teacher sees exams they created OR exams pinned
-- to any class they're assigned to. Admins keep full access via
-- exams_admin_all.
-- ===================================================================
drop policy if exists "exams_owner_all" on public.exams;
create policy "exams_owner_all" on public.exams
  for all using (
    created_by = auth.uid()
    or (class_id is not null and class_id in (select public.my_class_ids()))
  );

-- profiles.class_id is now deprecated (kept only for the backfill above
-- and historical rows). teacher_classes is the source of truth; new code
-- no longer reads or writes profiles.class_id.
