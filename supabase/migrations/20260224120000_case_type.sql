-- Migration: Add case_type column to cases table for filtering (Vorsorge, Trauerfall, Beratung, etc.)

alter table public.cases
  add column if not exists case_type text default 'sonstiges'
  check (case_type in ('vorsorge', 'trauerfall', 'beratung', 'sonstiges'));

-- Backfill: VORSORGE: prefix -> vorsorge
update public.cases
set case_type = 'vorsorge'
where name like 'VORSORGE:%';

-- Backfill: no prefix (admin-created cases) -> trauerfall
update public.cases
set case_type = 'trauerfall'
where case_type = 'sonstiges'
  and name not like 'VORSORGE:%';
