-- Migration: Employee mail account linking (Phase 1 - simple email association)

create table public.employee_mail_accounts (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.employees(id) on delete cascade not null,
  email text not null,
  provider text default 'custom' check (provider in ('gmail', 'outlook', 'custom')),
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(employee_id, email)
);

create index idx_employee_mail_accounts_employee on public.employee_mail_accounts(employee_id);
create index idx_employee_mail_accounts_email on public.employee_mail_accounts(lower(email));

alter table public.employee_mail_accounts enable row level security;

create policy "Employees can read mail accounts"
  on public.employee_mail_accounts for select to authenticated
  using (public.is_employee());

create policy "Employees can manage mail accounts"
  on public.employee_mail_accounts for all to authenticated
  using (public.is_employee())
  with check (public.is_employee());

create policy "Service role can manage mail accounts"
  on public.employee_mail_accounts for all to service_role
  using (true) with check (true);
