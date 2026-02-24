-- Migration: RBAC - Roles and employee role assignments

create table public.roles (
  id text primary key,
  display_name text not null
);

create table public.employee_roles (
  employee_id uuid references public.employees(id) on delete cascade,
  role_id text references public.roles(id) on delete cascade,
  primary key (employee_id, role_id)
);

create table public.role_permissions (
  role_id text references public.roles(id) on delete cascade,
  permission text not null,
  primary key (role_id, permission)
);

insert into public.roles (id, display_name) values
  ('admin', 'Administrator'),
  ('mitarbeiter', 'Mitarbeiter')
on conflict (id) do nothing;

alter table public.roles enable row level security;
alter table public.employee_roles enable row level security;
alter table public.role_permissions enable row level security;

-- Roles: readable by employees
create policy "Employees can read roles"
  on public.roles for select to authenticated
  using (public.is_employee());

create policy "Service role can manage roles"
  on public.roles for all to service_role using (true) with check (true);

-- Employee roles: employees can read (for UI); only admins can modify (via service role or future admin check)
create policy "Employees can read employee_roles"
  on public.employee_roles for select to authenticated
  using (public.is_employee());

create policy "Service role can manage employee_roles"
  on public.employee_roles for all to service_role using (true) with check (true);

-- Role permissions: readable by employees
create policy "Employees can read role_permissions"
  on public.role_permissions for select to authenticated
  using (public.is_employee());

create policy "Service role can manage role_permissions"
  on public.role_permissions for all to service_role using (true) with check (true);
