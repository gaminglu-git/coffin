-- Supabase Database Schema for Minten & Walter Bestattungen

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CASES TABLE
create table public.cases (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status text not null default 'Neu',
  family_pin text unique,
  wishes jsonb default '{}'::jsonb,
  deceased jsonb default '{}'::jsonb,
  contact jsonb default '{}'::jsonb,
  checklists jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  position float8 default 0,
  post_care_generated boolean default false
);

-- 2. TASKS TABLE
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  assignee text default 'Alle',
  due_date timestamp with time zone,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. APPOINTMENTS TABLE
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  appointment_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. MEMORIES (Family Portal) TABLE
create table public.memories (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. NOTES (Internal CRM) TABLE
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  text text not null,
  author text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. HANDOVER LOG TABLE
create table public.handover_logs (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  author text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. SET UP ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table public.cases enable row level security;
alter table public.tasks enable row level security;
alter table public.appointments enable row level security;
alter table public.memories enable row level security;
alter table public.notes enable row level security;
alter table public.handover_logs enable row level security;

-- Admin Policy: Admins (authenticated users) can do everything
create policy "Admins can do everything on cases" on public.cases for all to authenticated using (true);
create policy "Anyone can update cases" on public.cases for update to anon using (true) with check (true);
create policy "Anyone can delete cases" on public.cases for delete to anon using (true);
create policy "Admins can do everything on tasks" on public.tasks for all to authenticated using (true);
create policy "Admins can do everything on appointments" on public.appointments for all to authenticated using (true);
create policy "Admins can do everything on memories" on public.memories for all to authenticated using (true);
create policy "Admins can do everything on notes" on public.notes for all to authenticated using (true);
create policy "Admins can do everything on handover_logs" on public.handover_logs for all to authenticated using (true);

-- Family Policy: Anonymous users can only access cases if they know the family_pin
-- In a real production app, we would use a more robust custom auth or Edge Function for PIN validation.
create policy "Anyone can read a case by PIN" 
on public.cases for select 
to anon 
using (true); -- Requires application logic to filter by PIN

create policy "Anyone can insert a new case" 
on public.cases for insert 
to anon 
with check (true); -- For the Vorsorge Configurator

-- Family Policy: Can read and insert memories for their case
create policy "Anyone can insert memories"
on public.memories for insert
to anon
with check (true);

create policy "Anyone can read memories"
on public.memories for select
to anon
using (true);

-- 8. STORAGE BUCKET FOR FILES (Optional but good to set up)
insert into storage.buckets (id, name, public) values ('family-files', 'family-files', true);

create policy "Allow anon uploads to family-files"
on storage.objects for insert
to anon
with check (bucket_id = 'family-files');

create policy "Allow anon viewing of family-files"
on storage.objects for select
to anon
using (bucket_id = 'family-files');

-- 9. FAMILY_PHOTOS (Lieblingsbilder pro Angehörigen)
create table public.family_photos (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  storage_path text not null,
  uploaded_by_name text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.family_photos enable row level security;

create policy "Admins can do everything on family_photos"
on public.family_photos for all to authenticated using (true) with check (true);

create policy "Anyone can insert family_photos"
on public.family_photos for insert to anon with check (true);

create policy "Anyone can read family_photos"
on public.family_photos for select to anon using (true);
