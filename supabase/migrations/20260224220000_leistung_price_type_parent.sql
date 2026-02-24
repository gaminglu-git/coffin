-- Add price_type, unit_label, parent_id to leistungen for flexible pricing
-- Supports: fixed, per_unit, min_price (ab X), on_request (nach Wahl)

create type public.leistung_price_type as enum (
  'fixed',           -- fester Preis (price_cents)
  'per_unit',         -- price_cents × quantity
  'min_price',       -- ab X (price_cents = Mindestpreis)
  'on_request'       -- nach Wahl (kein Preis)
);

alter table public.leistungen
  add column if not exists price_type public.leistung_price_type not null default 'fixed',
  add column if not exists unit_label text,
  add column if not exists parent_id uuid references public.leistungen(id) on delete set null;

comment on column public.leistungen.price_type is 'Typ der Preisberechnung: fixed, per_unit, min_price, on_request';
comment on column public.leistungen.unit_label is 'Einheitenbezeichnung für per_unit (z.B. Stück, Tag, km)';
comment on column public.leistungen.parent_id is 'Weitere Leistung: verweist auf Hauptleistung';

create index if not exists leistungen_parent_id_idx on public.leistungen(parent_id)
  where parent_id is not null;
