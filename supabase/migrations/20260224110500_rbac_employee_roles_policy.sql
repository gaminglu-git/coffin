-- Migration: Allow admins to manage employee_roles (insert/update/delete)
-- Uses user_role from JWT when auth hook is enabled.
-- Falls back to is_employee() when hook not yet enabled (backward compatible).

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() ->> 'user_role') = 'admin',
    false
  );
$$;

-- Allow admins to insert/update/delete employee_roles
-- When hook is not enabled, user_role is null so is_admin() is false - no one can modify via RLS
-- Service role can always modify
drop policy if exists "Employees can read employee_roles" on public.employee_roles;
create policy "Employees can read employee_roles"
  on public.employee_roles for select to authenticated
  using (public.is_employee());

create policy "Admins can insert employee_roles"
  on public.employee_roles for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update employee_roles"
  on public.employee_roles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete employee_roles"
  on public.employee_roles for delete to authenticated
  using (public.is_admin());
