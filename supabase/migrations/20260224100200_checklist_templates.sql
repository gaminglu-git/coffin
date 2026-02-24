-- Checklist templates for user-defined checklist structures.
-- Items can contain {{placeholder}} for case data substitution.

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  burial_type text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- items structure: [{ "title": "Gruppentitel", "items": [{ "text": "Aufgabe (kann {{placeholder}} enthalten)" }] }]

alter table public.checklist_templates enable row level security;

create policy "Employees can do everything on checklist_templates"
on public.checklist_templates for all to authenticated
using (public.is_employee())
with check (public.is_employee());
