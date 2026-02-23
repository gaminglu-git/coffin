-- Migration: Fix RLS policies to address Supabase Security Advisor warnings
-- 1. Restrict "admin" policies to employees only (auth.uid() IN employees)
-- 2. Remove dangerous anon update/delete on cases (not used, allows anyone to modify/delete any case)

-- Helper: true if current user is an employee
create or replace function public.is_employee()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.employees where auth_user_id = auth.uid()
  );
$$;

-- ========== 1. EMPLOYEES TABLE ==========
drop policy if exists "Employees readable by authenticated" on public.employees;
create policy "Employees readable by employees" on public.employees
  for select to authenticated
  using (public.is_employee());

-- ========== 2. CASES ==========
drop policy if exists "Admins can do everything on cases" on public.cases;
create policy "Employees can do everything on cases" on public.cases
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- Remove dangerous anon update/delete (not used - family portal only reads/inserts)
drop policy if exists "Anyone can update cases" on public.cases;
drop policy if exists "Anyone can delete cases" on public.cases;

-- ========== 3. TASKS ==========
drop policy if exists "Admins can do everything on tasks" on public.tasks;
create policy "Employees can do everything on tasks" on public.tasks
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 4. APPOINTMENTS ==========
drop policy if exists "Admins can do everything on appointments" on public.appointments;
create policy "Employees can do everything on appointments" on public.appointments
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 5. MEMORIES ==========
drop policy if exists "Admins can do everything on memories" on public.memories;
create policy "Employees can do everything on memories" on public.memories
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 6. NOTES ==========
drop policy if exists "Admins can do everything on notes" on public.notes;
create policy "Employees can do everything on notes" on public.notes
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 7. HANDOVER_LOGS ==========
drop policy if exists "Admins can do everything on handover_logs" on public.handover_logs;
create policy "Employees can do everything on handover_logs" on public.handover_logs
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 8. FAMILY_PHOTOS ==========
drop policy if exists "Admins can do everything on family_photos" on public.family_photos;
create policy "Employees can do everything on family_photos" on public.family_photos
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 9. INVENTORY_CATEGORIES ==========
drop policy if exists "Authenticated can manage categories" on public.inventory_categories;
create policy "Employees can manage categories" on public.inventory_categories
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 10. INVENTORY_LOCATIONS ==========
drop policy if exists "Authenticated can manage locations" on public.inventory_locations;
create policy "Employees can manage locations" on public.inventory_locations
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 11. INVENTORY_ITEMS ==========
drop policy if exists "Authenticated can manage items" on public.inventory_items;
create policy "Employees can manage items" on public.inventory_items
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 12. QR_CODES ==========
drop policy if exists "Authenticated can manage qr_codes" on public.qr_codes;
create policy "Employees can manage qr_codes" on public.qr_codes
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- ========== 13. INVENTORY_SCANS ==========
drop policy if exists "Authenticated can manage scans" on public.inventory_scans;
create policy "Employees can manage scans" on public.inventory_scans
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());
