-- Migration: Infohub Phase 1 - Document attachments, storage bucket, letter/email templates
-- Supports: correspondence-docs bucket, storage_path on correspondences, template tables

-- 1. Add storage_path to correspondences (optional - for document attachments)
alter table public.correspondences
  add column if not exists storage_path text;

create index if not exists correspondences_storage_path_idx on public.correspondences(storage_path)
  where storage_path is not null;

-- 2. Create correspondence-docs storage bucket (employees only, no anon)
insert into storage.buckets (id, name, public) values ('correspondence-docs', 'correspondence-docs', false)
  on conflict (id) do nothing;

create policy "Employees can upload correspondence-docs"
on storage.objects for insert to authenticated
with check (bucket_id = 'correspondence-docs');

create policy "Employees can read correspondence-docs"
on storage.objects for select to authenticated
using (bucket_id = 'correspondence-docs');

create policy "Employees can update correspondence-docs"
on storage.objects for update to authenticated
using (bucket_id = 'correspondence-docs');

create policy "Employees can delete correspondence-docs"
on storage.objects for delete to authenticated
using (bucket_id = 'correspondence-docs');

-- 3. Letter templates (for printed letters)
create table if not exists public.letter_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.letter_templates enable row level security;

create policy "Employees can do everything on letter_templates"
on public.letter_templates for all to authenticated
using (public.is_employee())
with check (public.is_employee());

-- 4. Email templates (for outgoing emails)
create table if not exists public.email_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.email_templates enable row level security;

create policy "Employees can do everything on email_templates"
on public.email_templates for all to authenticated
using (public.is_employee())
with check (public.is_employee());

-- 5. Seed default templates with placeholder examples (only if empty)
insert into public.letter_templates (name, subject, body)
select 'Kondolenzschreiben', 'Kondolenz zum Verlust von {{deceased_name}}',
  'Sehr geehrte {{contact_name}},\n\nwir trauern mit Ihnen um den Verlust von {{deceased_name}}.\n\nMit herzlichem Beileid\nIhr Team'
where not exists (select 1 from public.letter_templates limit 1);

insert into public.email_templates (name, subject, body)
select 'Einladung Trauerfeier', 'Einladung zur Trauerfeier für {{deceased_name}}',
  'Sehr geehrte {{contact_name}},\n\nhiermit laden wir Sie herzlich zur Trauerfeier für {{deceased_name}} ein.\n\nMit freundlichen Grüßen\nIhr Team'
where not exists (select 1 from public.email_templates limit 1);
