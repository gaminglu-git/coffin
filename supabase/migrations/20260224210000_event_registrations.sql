-- Migration: event_registrations for online event sign-up
-- Allows anonymous users to register for public events

create table public.event_registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  instance_start_at timestamptz not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz default now() not null
);

create index idx_event_registrations_event_instance
  on public.event_registrations(event_id, instance_start_at);

-- Prevent duplicate registrations (same email for same event instance)
create unique index idx_event_registrations_unique
  on public.event_registrations(event_id, instance_start_at, lower(email));

alter table public.event_registrations enable row level security;

-- Anonymous can only INSERT (register)
create policy "Anon can insert event registrations"
  on public.event_registrations for insert to anon
  with check (true);

-- Employees can do everything
create policy "Employees can do everything on event_registrations"
  on public.event_registrations for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());
