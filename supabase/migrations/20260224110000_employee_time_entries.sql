-- Migration: Employee time entries (Zeiterfassung / Stempeluhr)
-- Event-based: each clock in/out is a separate record

create table public.employee_time_entries (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.employees(id) on delete cascade not null,
  event_type text not null check (event_type in ('clock_in', 'clock_out')),
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source text default 'manual' check (source in ('manual', 'auth_login', 'auth_logout')),
  notes text
);

create index idx_time_entries_employee_date on public.employee_time_entries(employee_id, recorded_at);

alter table public.employee_time_entries enable row level security;

-- Employees can read all time entries (for admin calendar view; RBAC will refine later)
create policy "Employees can read time entries"
  on public.employee_time_entries for select to authenticated
  using (public.is_employee());

-- Employees can insert only their own time entries (enforced in app via getCurrentEmployee)
create policy "Employees can insert own time entries"
  on public.employee_time_entries for insert to authenticated
  with check (public.is_employee());

-- Service role for admin operations
create policy "Service role can manage time entries"
  on public.employee_time_entries for all to service_role
  using (true) with check (true);
