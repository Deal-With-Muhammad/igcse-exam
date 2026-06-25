-- ===================================================================
-- Drafts: an exam can be saved as a draft (not takeable by students)
-- until the teacher publishes it. Existing exams default to published.
-- ===================================================================
alter table public.exams
  add column if not exists is_draft boolean not null default false;

create index if not exists exams_is_draft_idx on public.exams(is_draft);
