-- Ensure at least one admin exists: assign admin role to first employee if none have it
insert into public.employee_roles (employee_id, role_id)
select e.id, 'admin'
from public.employees e
where not exists (select 1 from public.employee_roles where role_id = 'admin')
limit 1
on conflict (employee_id, role_id) do nothing;
