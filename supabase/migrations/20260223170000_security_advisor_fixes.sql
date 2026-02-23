-- Migration: Address Supabase Security Advisor warnings
-- 1. function_search_path_mutable: Set search_path on is_employee (SECURITY DEFINER)
-- 2. rls_policy_always_true: Replace WITH CHECK (true) with explicit validation
--    (Intentional public inserts for family portal/configurator/scans - add minimal validation)

-- ========== 1. FIX is_employee SEARCH PATH ==========
create or replace function public.is_employee()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.employees where auth_user_id = auth.uid()
  );
$$;

-- ========== 2. TIGHTEN RLS POLICIES (replace WITH CHECK true) ==========

-- cases: Vorsorge Configurator - require valid case structure
drop policy if exists "Anyone can insert a new case" on public.cases;
create policy "Anyone can insert a new case" on public.cases
  for insert to anon
  with check (name is not null and length(trim(name)) > 0);

-- memories: Family portal - require case_id and text
drop policy if exists "Anyone can insert memories" on public.memories;
create policy "Anyone can insert memories" on public.memories
  for insert to anon
  with check (case_id is not null and text is not null and length(trim(text)) > 0);

-- family_photos: Family portal - require required fields
drop policy if exists "Anyone can insert family_photos" on public.family_photos;
create policy "Anyone can insert family_photos" on public.family_photos
  for insert to anon
  with check (
    case_id is not null
    and storage_path is not null
    and length(trim(storage_path)) > 0
    and uploaded_by_name is not null
    and length(trim(uploaded_by_name)) > 0
  );

-- inventory_scans: QR scan recording - require qr_code_id
drop policy if exists "Anyone can insert scans" on public.inventory_scans;
create policy "Anyone can insert scans" on public.inventory_scans
  for insert to anon
  with check (qr_code_id is not null and length(trim(qr_code_id)) > 0);

drop policy if exists "Anyone can insert scans auth" on public.inventory_scans;
create policy "Anyone can insert scans auth" on public.inventory_scans
  for insert to authenticated
  with check (qr_code_id is not null and length(trim(qr_code_id)) > 0);
