-- Migration: company_settings for whitelabel (display name, styles, etc.)
-- Only service_role (admin actions) can access.

create table public.company_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now() not null
);

alter table public.company_settings enable row level security;

-- Only service_role (server actions with createAdminClient) can access
create policy "Service role only" on public.company_settings
  for all to service_role using (true) with check (true);

-- Keys: display_name, tagline, primary_color, secondary_color, logo_url, favicon_url, page_content (Puck JSON)
