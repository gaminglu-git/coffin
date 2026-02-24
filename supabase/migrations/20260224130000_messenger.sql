-- Migration: Messenger - secure internal communication with E2E support

-- 1. messenger_channels
create table public.messenger_channels (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('direct', 'group')),
  name text,
  case_id uuid references public.cases(id) on delete set null,
  created_by_id uuid references public.employees(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index messenger_channels_type_idx on public.messenger_channels(type);
create index messenger_channels_case_id_idx on public.messenger_channels(case_id);

-- 2. messenger_channel_members
create table public.messenger_channel_members (
  channel_id uuid references public.messenger_channels(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (channel_id, employee_id)
);

create index messenger_channel_members_employee_idx on public.messenger_channel_members(employee_id);

-- 3. messenger_messages
create table public.messenger_messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.messenger_channels(id) on delete cascade not null,
  sender_id uuid references public.employees(id) on delete set null not null,
  encrypted_content text not null,
  nonce text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index messenger_messages_channel_idx on public.messenger_messages(channel_id);
create index messenger_messages_created_idx on public.messenger_messages(created_at desc);

-- 4. messenger_identity_keys (public keys for E2E)
create table public.messenger_identity_keys (
  employee_id uuid references public.employees(id) on delete cascade primary key,
  public_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. messenger_group_keys (encrypted group keys per member)
create table public.messenger_group_keys (
  channel_id uuid references public.messenger_channels(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  encrypted_group_key text not null,
  nonce text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (channel_id, employee_id)
);

-- RLS
alter table public.messenger_channels enable row level security;
alter table public.messenger_channel_members enable row level security;
alter table public.messenger_messages enable row level security;
alter table public.messenger_identity_keys enable row level security;
alter table public.messenger_group_keys enable row level security;

-- Helper: is member of channel
create or replace function public.is_messenger_channel_member(p_channel_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.messenger_channel_members m
    join public.employees e on e.id = m.employee_id
    where m.channel_id = p_channel_id and e.auth_user_id = auth.uid()
  );
$$;

-- messenger_channels: employees can insert; select only if member
create policy "Employees can insert messenger_channels"
  on public.messenger_channels for insert to authenticated
  with check (public.is_employee());

create policy "Members can select messenger_channels"
  on public.messenger_channels for select to authenticated
  using (
    public.is_employee() and public.is_messenger_channel_member(id)
  );

-- messenger_channel_members: employees can insert; select only own channels
create policy "Employees can insert messenger_channel_members"
  on public.messenger_channel_members for insert to authenticated
  with check (public.is_employee());

create policy "Members can select messenger_channel_members"
  on public.messenger_channel_members for select to authenticated
  using (
    public.is_employee() and (
      employee_id in (select id from public.employees where auth_user_id = auth.uid())
      or channel_id in (
        select m.channel_id from public.messenger_channel_members m
        join public.employees e on e.id = m.employee_id
        where e.auth_user_id = auth.uid()
      )
    )
  );

-- messenger_messages: members can select and insert
create policy "Members can select messenger_messages"
  on public.messenger_messages for select to authenticated
  using (public.is_messenger_channel_member(channel_id));

create policy "Members can insert messenger_messages"
  on public.messenger_messages for insert to authenticated
  with check (
    public.is_employee() and public.is_messenger_channel_member(channel_id)
  );

-- messenger_identity_keys: all employees can read; own only for insert/update
create policy "Employees can read messenger_identity_keys"
  on public.messenger_identity_keys for select to authenticated
  using (public.is_employee());

create policy "Employees can upsert own messenger_identity_key"
  on public.messenger_identity_keys for all to authenticated
  using (
    public.is_employee() and employee_id in (select id from public.employees where auth_user_id = auth.uid())
  )
  with check (
    employee_id in (select id from public.employees where auth_user_id = auth.uid())
  );

-- messenger_group_keys: members can select; insert for channel creators
create policy "Members can select messenger_group_keys"
  on public.messenger_group_keys for select to authenticated
  using (
    public.is_employee() and public.is_messenger_channel_member(channel_id)
  );

create policy "Employees can insert messenger_group_keys"
  on public.messenger_group_keys for insert to authenticated
  with check (public.is_employee());

-- Realtime
alter publication supabase_realtime add table messenger_messages;
alter publication supabase_realtime add table messenger_channels;

-- Disable handover_logs notify trigger (messenger replaces it)
drop trigger if exists handover_logs_notify on public.handover_logs;
