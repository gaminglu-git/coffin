-- Migration: Add employee_id to correspondences, case_id to handover_logs
-- Links correspondences to the employee who handled them, and handover_logs to optional case

-- 1. Add employee_id to correspondences (optional - who handled the correspondence)
alter table public.correspondences
  add column if not exists employee_id uuid references public.employees(id) on delete set null;

create index if not exists correspondences_employee_id_idx on public.correspondences(employee_id);

-- 2. Add case_id to handover_logs (optional - for case-specific handover notes)
alter table public.handover_logs
  add column if not exists case_id uuid references public.cases(id) on delete set null;

create index if not exists handover_logs_case_id_idx on public.handover_logs(case_id);
