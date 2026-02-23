-- Seed mock data for correspondences (and demo cases/tasks/appointments if needed)

-- 1. Insert demo cases (skip if family_pin already exists)
INSERT INTO public.cases (name, status, family_pin, wishes, deceased, contact, checklists)
VALUES
  ('Muster, Max', 'In Planung', 'DEMO01', '{"burialType":"Feuerbestattung"}'::jsonb, '{"firstName":"Max","lastName":"Muster","deathDate":"2025-02-15"}'::jsonb, '{"firstName":"Maria","lastName":"Muster","phone":"0228 123456","email":"maria@example.com"}'::jsonb, '[]'::jsonb),
  ('Schmidt, Anna', 'Behörden & Orga', 'DEMO02', '{"burialType":"Erdbestattung"}'::jsonb, '{"firstName":"Anna","lastName":"Schmidt","deathDate":"2025-02-10"}'::jsonb, '{"firstName":"Peter","lastName":"Schmidt","phone":"0228 654321","email":"peter@example.com"}'::jsonb, '[]'::jsonb)
ON CONFLICT (family_pin) DO NOTHING;

-- 2. Insert demo tasks for demo cases
INSERT INTO public.tasks (case_id, title, assignee, due_date, completed)
SELECT c.id, t.title, t.assignee, t.due_date, t.completed
FROM public.cases c
CROSS JOIN (VALUES
  ('Sterbeurkunde beim Standesamt anfordern', 'Alle', (now() + interval '7 days'), false),
  ('Trauerfeier Termin abstimmen', 'Alle', (now() + interval '14 days'), false),
  ('Familie anrufen – Rückfrage', 'Alle', (now() + interval '3 days'), false)
) AS t(title, assignee, due_date, completed)
WHERE c.family_pin IN ('DEMO01', 'DEMO02')
  AND NOT EXISTS (SELECT 1 FROM public.tasks WHERE case_id = c.id AND title = t.title);

-- 3. Insert demo appointments for demo cases
INSERT INTO public.appointments (case_id, title, appointment_date)
SELECT c.id, a.title, a.appointment_date
FROM public.cases c
CROSS JOIN (VALUES
  ('Erstgespräch mit Angehörigen', (now() + interval '2 days')),
  ('Trauerfeier – Haupttermin', (now() + interval '10 days'))
) AS a(title, appointment_date)
WHERE c.family_pin IN ('DEMO01', 'DEMO02')
  AND NOT EXISTS (SELECT 1 FROM public.appointments WHERE case_id = c.id AND title = a.title);

-- 4. Insert demo correspondences (only if table is empty)
INSERT INTO public.correspondences (case_id, task_id, appointment_id, type, direction, subject, content)
SELECT c.id, NULL, NULL, 'email', 'incoming', 'Rückfrage zur Trauerfeier', 'Guten Tag, wir haben noch Fragen zum Ablauf der Trauerfeier. Können Sie uns zurückrufen?'
FROM public.cases c
WHERE c.family_pin = 'DEMO01'
  AND NOT EXISTS (SELECT 1 FROM public.correspondences)
LIMIT 1;

INSERT INTO public.correspondences (case_id, task_id, appointment_id, type, direction, subject, content)
SELECT c.id, (SELECT id FROM public.tasks WHERE case_id = c.id ORDER BY created_at LIMIT 1), NULL, 'phone', 'outgoing', 'Anruf Familie Muster', 'Rückruf erfolgt – Termin für nächste Woche vereinbart.'
FROM public.cases c
WHERE c.family_pin = 'DEMO01'
  AND (SELECT count(*) FROM public.correspondences) < 6
  AND NOT EXISTS (SELECT 1 FROM public.correspondences WHERE subject = 'Anruf Familie Muster')
LIMIT 1;

INSERT INTO public.correspondences (case_id, task_id, appointment_id, type, direction, subject, content)
SELECT c.id, NULL, (SELECT id FROM public.appointments WHERE case_id = c.id ORDER BY appointment_date LIMIT 1), 'letter', 'outgoing', 'Einladung Trauerfeier', 'Formelle Einladung zur Trauerfeier wurde versendet.'
FROM public.cases c
WHERE c.family_pin = 'DEMO01'
  AND (SELECT count(*) FROM public.correspondences) < 6
  AND NOT EXISTS (SELECT 1 FROM public.correspondences WHERE subject = 'Einladung Trauerfeier')
LIMIT 1;

INSERT INTO public.correspondences (case_id, task_id, appointment_id, type, direction, subject, content)
SELECT c.id, NULL, NULL, 'email', 'incoming', 'Dankeschön der Familie Schmidt', 'Vielen Dank für die einfühlsame Begleitung. Die Familie Schmidt.'
FROM public.cases c
WHERE c.family_pin = 'DEMO02'
  AND (SELECT count(*) FROM public.correspondences) < 6
  AND NOT EXISTS (SELECT 1 FROM public.correspondences WHERE subject = 'Dankeschön der Familie Schmidt')
LIMIT 1;

INSERT INTO public.correspondences (case_id, task_id, appointment_id, type, direction, subject, content)
SELECT c.id, NULL, NULL, 'other', 'outgoing', 'Blumenbestellung', 'Blumen für Trauerfeier bei Florist Müller bestellt.'
FROM public.cases c
WHERE c.family_pin = 'DEMO02'
  AND (SELECT count(*) FROM public.correspondences) < 6
  AND NOT EXISTS (SELECT 1 FROM public.correspondences WHERE subject = 'Blumenbestellung')
LIMIT 1;
