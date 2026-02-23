-- Migration: Notifications and notification preferences for real-time alerts

-- 1. NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.employees(id) on delete cascade not null,
  type text not null check (type in ('handover', 'task_assigned', 'communication')),
  title text not null,
  body text,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Employees can read own notifications" on public.notifications
  for select to authenticated
  using (employee_id in (select id from public.employees where auth_user_id = auth.uid()));

create policy "Employees can update own notifications (mark read)" on public.notifications
  for update to authenticated
  using (employee_id in (select id from public.employees where auth_user_id = auth.uid()))
  with check (employee_id in (select id from public.employees where auth_user_id = auth.uid()));

create policy "Service role can insert notifications" on public.notifications
  for insert to service_role with check (true);

create index notifications_employee_id_idx on public.notifications(employee_id);
create index notifications_created_at_idx on public.notifications(created_at desc);

-- 2. NOTIFICATION_PREFERENCES TABLE
create table public.notification_preferences (
  employee_id uuid references public.employees(id) on delete cascade primary key,
  handover boolean default true,
  task_assigned boolean default true,
  communication boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notification_preferences enable row level security;

create policy "Employees can manage own preferences" on public.notification_preferences
  for all to authenticated
  using (employee_id in (select id from public.employees where auth_user_id = auth.uid()))
  with check (employee_id in (select id from public.employees where auth_user_id = auth.uid()));

-- 3. TRIGGER: handover_logs INSERT -> notify all employees except author (respecting preferences)
create or replace function public.notify_handover_insert()
returns trigger as $$
begin
  insert into public.notifications (employee_id, type, title, body, link)
  select e.id, 'handover', 'Neuer Übergabebuch-Eintrag', left(NEW.text, 100), '/admin/dashboard'
  from public.employees e
  left join public.notification_preferences np on np.employee_id = e.id
  where (e.id is distinct from NEW.author_id or NEW.author_id is null)
    and (np.handover is null or np.handover = true);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger handover_logs_notify
  after insert on public.handover_logs
  for each row execute function public.notify_handover_insert();

-- 4. TRIGGER: tasks INSERT/UPDATE -> notify assignee when assignee_id is set (respecting preferences)
create or replace function public.notify_task_assigned()
returns trigger as $$
begin
  if NEW.assignee_id is not null then
    insert into public.notifications (employee_id, type, title, body, link)
    select NEW.assignee_id, 'task_assigned', 'Neue Aufgabe zugewiesen', NEW.title, '/admin/dashboard'
    from public.employees e
    left join public.notification_preferences np on np.employee_id = e.id
    where e.id = NEW.assignee_id
      and (np.task_assigned is null or np.task_assigned = true);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger tasks_notify_assignee_insert
  after insert on public.tasks
  for each row execute function public.notify_task_assigned();

create trigger tasks_notify_assignee_update
  after update on public.tasks
  for each row
  when (OLD.assignee_id is distinct from NEW.assignee_id and NEW.assignee_id is not null)
  execute function public.notify_task_assigned();

-- 5. TRIGGER: communications INSERT -> notify all employees (respecting preferences)
create or replace function public.notify_communication_insert()
returns trigger as $$
begin
  insert into public.notifications (employee_id, type, title, body, link)
  select e.id, 'communication', 'Neue Kommunikation', coalesce(NEW.subject, 'Betreff'), '/admin/dashboard'
  from public.employees e
  left join public.notification_preferences np on np.employee_id = e.id
  where (np.communication is null or np.communication = true);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger communications_notify
  after insert on public.communications
  for each row execute function public.notify_communication_insert();

-- 6. Add notifications to Realtime publication
alter publication supabase_realtime add table notifications;
