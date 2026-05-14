-- Fix: the admin-check RLS policies caused infinite recursion because
-- they queried `profiles` from inside `profiles`'s own SELECT policy.
-- Solution: move the admin check into a SECURITY DEFINER function which
-- bypasses RLS, so policies that need "is this user admin?" no longer
-- recurse into the table they're protecting.

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
-- profiles
-- ===================================================================
drop policy if exists "profiles_admin_read" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- ===================================================================
-- templates
-- ===================================================================
drop policy if exists "templates_admin_write" on public.templates;

create policy "templates_admin_write" on public.templates
  for all using (public.is_admin());

-- ===================================================================
-- exams
-- ===================================================================
drop policy if exists "exams_admin_all" on public.exams;

create policy "exams_admin_all" on public.exams
  for all using (public.is_admin());

-- ===================================================================
-- submissions
-- ===================================================================
drop policy if exists "submissions_admin_select" on public.submissions;
drop policy if exists "submissions_admin_update" on public.submissions;

create policy "submissions_admin_select" on public.submissions
  for select using (public.is_admin());

create policy "submissions_admin_update" on public.submissions
  for update using (public.is_admin());

-- ===================================================================
-- storage
-- ===================================================================
drop policy if exists "template_assets_admin_write" on storage.objects;

create policy "template_assets_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'template-assets' and public.is_admin()
  );
