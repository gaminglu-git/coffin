-- Migration: Custom Access Token Hook for RBAC
-- Adds user_role claim to JWT from employee_roles.
--
-- WICHTIG: Hook im Supabase Dashboard aktivieren:
-- Authentication > Hooks > Customize Access Token > public.custom_access_token_hook auswählen

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
  declare
    claims jsonb;
    user_role text;
  begin
    select r.id into user_role
    from public.employees e
    join public.employee_roles er on er.employee_id = e.id
    join public.roles r on r.id = er.role_id
    where e.auth_user_id = (event->>'user_id')::uuid
    order by case when r.id = 'admin' then 0 else 1 end
    limit 1;

    claims := event->'claims';

    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
  end;
$$;

-- Grant access to function to supabase_auth_admin
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Grant access to schema to supabase_auth_admin
grant usage on schema public to supabase_auth_admin;

-- Revoke function permissions from authenticated, anon and public
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
