-- Migration: Fix Storage Policies for anonymous Family Portal uploads + Add family_photos table
-- Family Portal uses anon (no login) - storage policies must use to anon, not to public

-- 1. Drop existing storage policies (they use to public)
drop policy if exists "Allow public uploads to family-files" on storage.objects;
drop policy if exists "Allow public viewing of family-files" on storage.objects;

-- 2. Recreate with to anon for anonymous Family Portal access
create policy "Allow anon uploads to family-files"
on storage.objects for insert
to anon
with check (bucket_id = 'family-files');

create policy "Allow anon viewing of family-files"
on storage.objects for select
to anon
using (bucket_id = 'family-files');

-- 3. Create family_photos table for Lieblingsbilder with uploaded_by_name
create table if not exists public.family_photos (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  storage_path text not null,
  uploaded_by_name text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RLS for family_photos
alter table public.family_photos enable row level security;

create policy "Admins can do everything on family_photos"
on public.family_photos for all to authenticated using (true) with check (true);

create policy "Anyone can insert family_photos"
on public.family_photos for insert to anon with check (true);

create policy "Anyone can read family_photos"
on public.family_photos for select to anon using (true);
