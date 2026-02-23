-- Migration: Add correspondences table for case-linked correspondence tracking
-- Correspondences can optionally be linked to tasks and appointments

create table public.correspondences (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  type text not null check (type in ('email', 'letter', 'phone', 'other')),
  direction text not null check (direction in ('incoming', 'outgoing')),
  subject text,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.correspondences enable row level security;

create policy "Employees can do everything on correspondences" on public.correspondences
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());
