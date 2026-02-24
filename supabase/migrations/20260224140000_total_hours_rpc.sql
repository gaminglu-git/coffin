-- RPC: Berechnet Gesamtstunden aus gepaarten clock_in/clock_out-Einträgen.
-- Ersetzt das Laden aller Einträge und Berechnung in der App.

create or replace function public.get_total_hours_for_employee(
  p_employee_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns double precision
language sql
stable
security invoker
as $$
  with ordered as (
    select event_type, recorded_at,
      lag(recorded_at) over (order by recorded_at) as prev_at,
      lag(event_type) over (order by recorded_at) as prev_type
    from public.employee_time_entries
    where employee_id = p_employee_id
      and recorded_at >= p_from
      and recorded_at <= p_to
  ),
  pairs as (
    select (recorded_at - prev_at) as duration
    from ordered
    where event_type = 'clock_out' and prev_type = 'clock_in'
  )
  select coalesce(sum(extract(epoch from duration)), 0)::double precision / 3600.0
  from pairs;
$$;
