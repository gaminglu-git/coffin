-- Migration: Messenger notifications

-- 1. Add 'messenger' to notifications type check
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('handover', 'task_assigned', 'communication', 'messenger'));

-- 2. Add messenger column to notification_preferences
alter table public.notification_preferences
  add column if not exists messenger boolean default true;

-- 3. Trigger: messenger_messages INSERT -> notify channel members except sender
create or replace function public.notify_messenger_insert()
returns trigger as $$
begin
  insert into public.notifications (employee_id, type, title, body, link)
  select m.employee_id, 'messenger', 'Neue Nachricht', 'Neue Nachricht im Messenger', '/admin/dashboard'
  from public.messenger_channel_members m
  left join public.notification_preferences np on np.employee_id = m.employee_id
  where m.channel_id = NEW.channel_id
    and m.employee_id is distinct from NEW.sender_id
    and (np.messenger is null or np.messenger = true);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger messenger_messages_notify
  after insert on public.messenger_messages
  for each row execute function public.notify_messenger_insert();
