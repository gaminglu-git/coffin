-- Migration: Tasks (reminder_at), Appointments (assignee_id, end_at, reminder_at), Events table
-- Enables reminders, employee assignment for appointments, and public events/Veranstaltungen

-- 1. TASKS: Add reminder_at
alter table public.tasks
  add column if not exists reminder_at timestamptz;

-- 2. APPOINTMENTS: Add assignee_id, assignee, end_at, reminder_at
alter table public.appointments
  add column if not exists assignee_id uuid references public.employees(id) on delete set null,
  add column if not exists assignee text default 'Alle',
  add column if not exists end_at timestamptz,
  add column if not exists reminder_at timestamptz;

-- 3. EVENTS TABLE (Veranstaltungen)
create table public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  is_public boolean default false,
  recurrence_type text not null default 'none' check (recurrence_type in ('none', 'weekly', 'monthly', 'monthly_nth')),
  recurrence_config jsonb default '{}',
  recurrence_until date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.events enable row level security;

-- Employees can do everything on events
create policy "Employees can do everything on events"
  on public.events for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- Anonymous can read only public events
create policy "Anon can read public events"
  on public.events for select to anon
  using (is_public = true);

-- 4. Realtime for events
alter publication supabase_realtime add table events;
