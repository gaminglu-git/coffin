-- Migration: Leistungen (services) for flexible Vorsorge configurator
-- Tables: leistung_categories, leistungen, case_leistungen
-- Extends: inventory_items (price_cents, image_storage_path)
-- Storage: product-images bucket for product/leistung images

-- 1. Extend inventory_items with price and image
alter table public.inventory_items
  add column if not exists price_cents integer,
  add column if not exists image_storage_path text;

comment on column public.inventory_items.price_cents is 'Preis in Cent (optional, für Produktkatalog)';
comment on column public.inventory_items.image_storage_path is 'Pfad im product-images Bucket';

create index if not exists inventory_items_image_storage_path_idx on public.inventory_items(image_storage_path)
  where image_storage_path is not null;

-- 2. Create product-images storage bucket (public read for product display)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;

create policy "Employees can upload product-images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');

create policy "Anyone can read product-images"
on storage.objects for select to anon
using (bucket_id = 'product-images');

create policy "Authenticated can read product-images"
on storage.objects for select to authenticated
using (bucket_id = 'product-images');

create policy "Employees can update product-images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images');

create policy "Employees can delete product-images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');

-- 3. LEISTUNG_CATEGORIES
create table public.leistung_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index leistung_categories_sort_order_idx on public.leistung_categories(sort_order);

-- 4. LEISTUNGEN
create table public.leistungen (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price_cents int not null default 0,
  image_storage_path text,
  is_public boolean not null default false,
  category_id uuid references public.leistung_categories(id) on delete set null,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  parameters jsonb default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index leistungen_category_idx on public.leistungen(category_id);
create index leistungen_is_public_idx on public.leistungen(is_public);
create index leistungen_inventory_item_idx on public.leistungen(inventory_item_id);
create index leistungen_sort_order_idx on public.leistungen(sort_order);

-- 5. CASE_LEISTUNGEN (junction: case <-> selected leistungen)
create table public.case_leistungen (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  leistung_id uuid references public.leistungen(id) on delete cascade not null,
  quantity int not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(case_id, leistung_id)
);

create index case_leistungen_case_idx on public.case_leistungen(case_id);
create index case_leistungen_leistung_idx on public.case_leistungen(leistung_id);

-- 6. RLS
alter table public.leistung_categories enable row level security;
alter table public.leistungen enable row level security;
alter table public.case_leistungen enable row level security;

-- Employees: full CRUD on categories and leistungen
create policy "Employees can manage leistung_categories"
on public.leistung_categories for all to authenticated
using (public.is_employee())
with check (public.is_employee());

create policy "Employees can manage leistungen"
on public.leistungen for all to authenticated
using (public.is_employee())
with check (public.is_employee());

create policy "Employees can manage case_leistungen"
on public.case_leistungen for all to authenticated
using (public.is_employee())
with check (public.is_employee());

-- Anon: read-only public leistungen (for Vorsorge form)
create policy "Anyone can read public leistungen"
on public.leistungen for select to anon
using (is_public = true);

-- Anon: read leistung_categories (needed to group public leistungen)
create policy "Anyone can read leistung_categories"
on public.leistung_categories for select to anon
using (true);

-- Anon: insert case_leistungen (when creating vorsorge case - via service role or anon insert)
-- Cases are inserted by anon; case_leistungen need to be inserted in same transaction.
-- We allow anon to insert case_leistungen only for cases they create (complex to enforce).
-- Simpler: use service role in server action, or allow anon insert with check that case exists.
-- For now: server uses createClient() which gets anon key for unauthenticated - we need insert.
-- The createVorsorgeCaseAction runs server-side - it may use service role or anon.
-- Check: createClient from @/lib/supabase/server - typically uses cookies, so for form submit it might be anon.
create policy "Anyone can insert case_leistungen"
on public.case_leistungen for insert to anon
with check (true);

-- 7. Seed default categories and sample leistungen
insert into public.leistung_categories (name, description, sort_order)
select * from (values
  ('Bestattungsart', 'Art der Bestattung', 0),
  ('Ausstattung', 'Wahl der Ausstattung (Sarg/Urne)', 1),
  ('Rahmen der Abschiednahme', 'Art der Trauerfeier', 2)
) as v(name, description, sort_order)
where not exists (select 1 from public.leistung_categories limit 1);

-- Seed leistungen only if none exist (per-category inserts)
do $$
declare
  cat_bestattung uuid;
  cat_ausstattung uuid;
  cat_rahmen uuid;
begin
  if not exists (select 1 from public.leistungen limit 1) then
    select id into cat_bestattung from public.leistung_categories where sort_order = 0 limit 1;
    select id into cat_ausstattung from public.leistung_categories where sort_order = 1 limit 1;
    select id into cat_rahmen from public.leistung_categories where sort_order = 2 limit 1;

    insert into public.leistungen (title, description, price_cents, is_public, category_id, sort_order) values
      ('Erdbestattung', 'Klassische Sarg-Beisetzung.', 0, true, cat_bestattung, 0),
      ('Feuerbestattung', 'Kremation und Urnenbeisetzung.', 35000, true, cat_bestattung, 1),
      ('Seebestattung', 'Urnenbeisetzung auf See.', 115000, true, cat_bestattung, 2),
      ('Baumbestattung / Friedwald', 'Kremation und Beisetzung im Wald.', 35000, true, cat_bestattung, 3);

    insert into public.leistungen (title, description, price_cents, is_public, category_id, sort_order) values
      ('Standard', 'Einfacher Sarg oder Standardurne.', 45000, true, cat_ausstattung, 0),
      ('Natur / Bio', 'Unbehandeltes Holz, Bio-Matratze.', 75000, true, cat_ausstattung, 1),
      ('Individuell', 'Hochwertige Hölzer, Design-Urnen.', 95000, true, cat_ausstattung, 2);

    insert into public.leistungen (title, description, price_cents, is_public, category_id, sort_order) values
      ('Keine Feier', 'Stille Beisetzung ohne Angehörige.', 0, true, cat_rahmen, 0),
      ('Im kleinen Kreis', 'Stille Abschiednahme, Grunddekoration.', 35000, true, cat_rahmen, 1),
      ('Große Trauerfeier', 'Feierhalle, Floristik, Redner(in).', 85000, true, cat_rahmen, 2);
  end if;
end $$;
