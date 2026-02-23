-- Migration: Enable Supabase Realtime for collaboration tables
-- Allows clients to subscribe to postgres_changes for live updates without page refresh

alter publication supabase_realtime add table handover_logs;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table cases;
alter publication supabase_realtime add table communications;
alter publication supabase_realtime add table correspondences;
