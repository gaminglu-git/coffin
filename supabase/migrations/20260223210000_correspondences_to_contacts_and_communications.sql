-- Migration: Split correspondences into contacts (correspondences) and communication events (communications)
-- correspondences = Adressbuch (Personen/Firmen)
-- communications = Eingehende/ausgehende Nachrichten

-- 1. Rename old correspondences table to communications
alter table public.correspondences rename to communications;

-- 2. Drop old policy and create new one for communications
drop policy if exists "Employees can do everything on correspondences" on public.communications;
create policy "Employees can do everything on communications" on public.communications
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

-- 3. Create new correspondences table (contacts/address book)
create table public.correspondences (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  kind text not null check (kind in ('person', 'company')),
  display_name text not null,
  email text,
  phone text,
  address text,
  company_name text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.correspondences enable row level security;

create policy "Employees can do everything on correspondences" on public.correspondences
  for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

create index if not exists correspondences_case_id_idx on public.correspondences(case_id);
create index if not exists correspondences_display_name_idx on public.correspondences(display_name);

-- 4. Add correspondence_id to communications (links to contact)
alter table public.communications
  add column correspondence_id uuid references public.correspondences(id) on delete set null;

create index if not exists communications_correspondence_id_idx on public.communications(correspondence_id);
