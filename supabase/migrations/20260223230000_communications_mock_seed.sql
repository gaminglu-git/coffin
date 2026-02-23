-- Seed additional mock communications and link existing ones to contacts

-- Link existing communications to contacts where possible (Maria Muster, Peter Schmidt, Florist Müller)
UPDATE public.communications m
SET correspondence_id = (
  SELECT corr.id FROM public.correspondences corr
  WHERE corr.case_id = m.case_id
    AND corr.display_name = 'Maria Muster'
  LIMIT 1
)
WHERE m.subject = 'Rückfrage zur Trauerfeier'
  AND m.correspondence_id IS NULL
  AND EXISTS (SELECT 1 FROM public.cases c WHERE c.id = m.case_id AND c.family_pin = 'DEMO01');

UPDATE public.communications m
SET correspondence_id = (
  SELECT corr.id FROM public.correspondences corr
  WHERE corr.case_id = m.case_id
    AND corr.display_name = 'Maria Muster'
  LIMIT 1
)
WHERE m.subject = 'Anruf Familie Muster'
  AND m.correspondence_id IS NULL
  AND EXISTS (SELECT 1 FROM public.cases c WHERE c.id = m.case_id AND c.family_pin = 'DEMO01');

UPDATE public.communications m
SET correspondence_id = (
  SELECT corr.id FROM public.correspondences corr
  WHERE corr.case_id = m.case_id
    AND corr.display_name = 'Maria Muster'
  LIMIT 1
)
WHERE m.subject = 'Einladung Trauerfeier'
  AND m.correspondence_id IS NULL
  AND EXISTS (SELECT 1 FROM public.cases c WHERE c.id = m.case_id AND c.family_pin = 'DEMO01');

UPDATE public.communications m
SET correspondence_id = (
  SELECT corr.id FROM public.correspondences corr
  WHERE corr.case_id = m.case_id
    AND corr.display_name = 'Peter Schmidt'
  LIMIT 1
)
WHERE m.subject = 'Dankeschön der Familie Schmidt'
  AND m.correspondence_id IS NULL
  AND EXISTS (SELECT 1 FROM public.cases c WHERE c.id = m.case_id AND c.family_pin = 'DEMO02');

UPDATE public.communications m
SET correspondence_id = (
  SELECT corr.id FROM public.correspondences corr
  WHERE corr.case_id IS NULL
    AND corr.display_name = 'Florist Müller'
  LIMIT 1
)
WHERE m.subject = 'Blumenbestellung'
  AND m.correspondence_id IS NULL;

-- Insert additional mock communications
INSERT INTO public.communications (case_id, correspondence_id, type, direction, subject, content)
SELECT c.id, corr.id, 'phone', 'outgoing', 'Terminabsprache Standesamt', 'Rückruf beim Standesamt – Sterbeurkunde kann nächste Woche abgeholt werden.'
FROM public.cases c
CROSS JOIN LATERAL (
  SELECT id FROM public.correspondences
  WHERE display_name = 'Standesamt Bonn' AND case_id IS NULL
  LIMIT 1
) corr
WHERE c.family_pin = 'DEMO01'
  AND NOT EXISTS (SELECT 1 FROM public.communications WHERE case_id = c.id AND subject = 'Terminabsprache Standesamt')
LIMIT 1;

INSERT INTO public.communications (case_id, correspondence_id, type, direction, subject, content)
SELECT c.id, corr.id, 'email', 'incoming', 'Bestätigung Trauerfeier', 'Sehr geehrtes Team, wir bestätigen den Termin für die Trauerfeier am 15.03.2025. Mit freundlichen Grüßen, Pfarrer Weber'
FROM public.cases c
CROSS JOIN LATERAL (
  SELECT id FROM public.correspondences
  WHERE display_name = 'Pfarrer Thomas Weber' AND case_id IS NULL
  LIMIT 1
) corr
WHERE c.family_pin = 'DEMO01'
  AND NOT EXISTS (SELECT 1 FROM public.communications WHERE case_id = c.id AND subject = 'Bestätigung Trauerfeier')
LIMIT 1;

INSERT INTO public.communications (case_id, correspondence_id, type, direction, subject, content)
SELECT c.id, corr.id, 'letter', 'outgoing', 'Kondolenzschreiben', 'Sehr geehrte Familie Schmidt, wir trauern mit Ihnen um den Verlust von Anna Schmidt. Mit herzlichem Beileid, Ihr Team'
FROM public.cases c
CROSS JOIN LATERAL (
  SELECT id FROM public.correspondences
  WHERE case_id = c.id AND display_name = 'Peter Schmidt'
  LIMIT 1
) corr
WHERE c.family_pin = 'DEMO02'
  AND NOT EXISTS (SELECT 1 FROM public.communications WHERE case_id = c.id AND subject = 'Kondolenzschreiben')
LIMIT 1;

INSERT INTO public.communications (case_id, correspondence_id, type, direction, subject, content)
SELECT c.id, NULL, 'phone', 'incoming', 'Anruf Angehörige – Rückfrage Urne', 'Familie Muster fragt nach Urnenmodellen. Rückruf vereinbart.'
FROM public.cases c
WHERE c.family_pin = 'DEMO01'
  AND NOT EXISTS (SELECT 1 FROM public.communications WHERE case_id = c.id AND subject = 'Anruf Angehörige – Rückfrage Urne')
LIMIT 1;

INSERT INTO public.communications (case_id, correspondence_id, type, direction, subject, content)
SELECT c.id, corr.id, 'email', 'outgoing', 'Grabplatz-Anfrage', 'Guten Tag, wir möchten einen Grabstellenplatz für die Beisetzung von Max Muster anfragen. Bitte um Rückmeldung.'
FROM public.cases c
CROSS JOIN LATERAL (
  SELECT id FROM public.correspondences
  WHERE display_name = 'Friedhofsverwaltung Bonn' AND case_id IS NULL
  LIMIT 1
) corr
WHERE c.family_pin = 'DEMO01'
  AND NOT EXISTS (SELECT 1 FROM public.communications WHERE case_id = c.id AND subject = 'Grabplatz-Anfrage')
LIMIT 1;
