-- Migration: Inventory Management (Shelf.nu-inspired)
-- Tables: categories, locations, items, qr_codes, scans

-- 1. INVENTORY_CATEGORIES
create table public.inventory_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text default '#6b7280',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. INVENTORY_LOCATIONS
create table public.inventory_locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. INVENTORY_ITEMS
create type public.inventory_item_status as enum ('in_stock', 'in_use', 'checked_out');

create table public.inventory_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status public.inventory_item_status not null default 'in_stock',
  sequential_id text,
  category_id uuid references public.inventory_categories(id) on delete set null,
  location_id uuid references public.inventory_locations(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index inventory_items_category_idx on public.inventory_items(category_id);
create index inventory_items_location_idx on public.inventory_items(location_id);
create index inventory_items_status_idx on public.inventory_items(status);
create index inventory_items_sequential_id_idx on public.inventory_items(sequential_id);

-- 4. QR_CODES (CUID-like ids for short URLs; we use text id for compatibility)
create table public.qr_codes (
  id text primary key,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index qr_codes_item_idx on public.qr_codes(inventory_item_id);

-- 5. INVENTORY_SCANS (audit log)
create table public.inventory_scans (
  id uuid default gen_random_uuid() primary key,
  qr_code_id text not null references public.qr_codes(id) on delete cascade,
  user_agent text,
  scanned_by uuid references auth.users(id) on delete set null,
  latitude text,
  longitude text,
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index inventory_scans_qr_idx on public.inventory_scans(qr_code_id);
create index inventory_scans_scanned_at_idx on public.inventory_scans(scanned_at);

-- RLS
alter table public.inventory_categories enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.qr_codes enable row level security;
alter table public.inventory_scans enable row level security;

-- Authenticated users (employees) can do everything on inventory
create policy "Authenticated can manage categories" on public.inventory_categories for all to authenticated using (true) with check (true);
create policy "Authenticated can manage locations" on public.inventory_locations for all to authenticated using (true) with check (true);
create policy "Authenticated can manage items" on public.inventory_items for all to authenticated using (true) with check (true);
create policy "Authenticated can manage qr_codes" on public.qr_codes for all to authenticated using (true) with check (true);
create policy "Authenticated can manage scans" on public.inventory_scans for all to authenticated using (true) with check (true);

-- Public insert on scans (for /qr/[qrId] route - anonymous scan recording)
create policy "Anyone can insert scans" on public.inventory_scans for insert to anon with check (true);
create policy "Anyone can insert scans auth" on public.inventory_scans for insert to authenticated with check (true);

-- Public read on qr_codes (to resolve qrId -> itemId for redirect)
create policy "Anyone can read qr_codes" on public.qr_codes for select to anon using (true);
