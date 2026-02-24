-- Add leistung_type to leistungen for precise type selection (Bestattungsart, Sarg, Urne, Rahmen, etc.)
create type public.leistung_type as enum (
  'bestattungsart',
  'ausstattung_sarg',
  'ausstattung_urne',
  'rahmen',
  'sonstiges'
);

alter table public.leistungen
  add column if not exists leistung_type public.leistung_type not null default 'sonstiges';

comment on column public.leistungen.leistung_type is 'Typ der Leistung: bestattungsart, ausstattung_sarg, ausstattung_urne, rahmen, sonstiges';

-- Backfill existing leistungen based on category name
update public.leistungen l
set leistung_type = case
  when lc.name = 'Bestattungsart' then 'bestattungsart'::public.leistung_type
  when lc.name = 'Ausstattung' then 'ausstattung_urne'::public.leistung_type
  when lc.name = 'Rahmen der Abschiednahme' then 'rahmen'::public.leistung_type
  else 'sonstiges'::public.leistung_type
end
from public.leistung_categories lc
where l.category_id = lc.id;
