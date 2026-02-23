-- Migration: Add employees table and link tasks, notes, handover_logs to employees
-- Enables multi-employee accounts with individual logins

-- 1. EMPLOYEES TABLE (links to auth.users)
create table public.employees (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid references auth.users(id) on delete cascade unique not null,
  display_name text not null,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for employees
alter table public.employees enable row level security;
create policy "Employees readable by authenticated" on public.employees for select to authenticated using (true);
create policy "Service role can manage employees" on public.employees for all to service_role using (true) with check (true);

-- 2. Add assignee_id to tasks (keep assignee text for backward compatibility during transition)
alter table public.tasks add column if not exists assignee_id uuid references public.employees(id) on delete set null;

-- 3. Add author_id to notes
alter table public.notes add column if not exists author_id uuid references public.employees(id) on delete set null;

-- 4. Add author_id to handover_logs
alter table public.handover_logs add column if not exists author_id uuid references public.employees(id) on delete set null;
