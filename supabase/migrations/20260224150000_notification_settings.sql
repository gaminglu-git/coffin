-- Migration: notification_settings for form notification config (Telegram, Email, WhatsApp)
-- Used by the install wizard; only service_role (admin actions) can access.

create table public.notification_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz default now() not null
);

alter table public.notification_settings enable row level security;

-- Only service_role (server actions with createAdminClient) can access
create policy "Service role only" on public.notification_settings
  for all to service_role using (true) with check (true);

-- Keys: telegram_bot_token, telegram_chat_ids, resend_api_key, email_notify_recipients, email_notify_from
-- whatsapp_access_token, whatsapp_phone_number_id, whatsapp_recipient_phone_numbers, whatsapp_template_name
