-- Migration: Link inventory items to cases (Lagergegenstände an Fälle anbinden)
-- Enables tracking which items are assigned/reserved/delivered per case

alter table public.inventory_items
  add column if not exists case_id uuid references public.cases(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists delivery_status text;

comment on column public.inventory_items.case_id is 'Fall, dem der Gegenstand zugeordnet ist (optional)';
comment on column public.inventory_items.assigned_at is 'Zeitpunkt der Zuweisung an einen Fall';
comment on column public.inventory_items.delivery_status is 'Lieferstatus: reserved, assigned, delivered oder null';

create index if not exists inventory_items_case_id_idx on public.inventory_items(case_id);
