-- Seed demo contacts (correspondences = Adressbuch)
-- Run after correspondences/communications split

-- Fall-Kontakte (Angehörige)
INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, address)
SELECT c.id, 'person', 'Maria Muster', 'maria@example.com', '0228 123456', 'Musterstraße 1, 53111 Bonn'
FROM public.cases c
WHERE c.family_pin = 'DEMO01'
  AND NOT EXISTS (SELECT 1 FROM public.correspondences WHERE case_id = c.id AND display_name = 'Maria Muster')
LIMIT 1;

INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, address)
SELECT c.id, 'person', 'Peter Schmidt', 'peter@example.com', '0228 654321', 'Schmidtweg 5, 53113 Bonn'
FROM public.cases c
WHERE c.family_pin = 'DEMO02'
  AND NOT EXISTS (SELECT 1 FROM public.correspondences WHERE case_id = c.id AND display_name = 'Peter Schmidt')
LIMIT 1;

-- Firmenweite Kontakte (Partner)
INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, company_name, address)
SELECT NULL, 'company', 'Florist Müller', 'info@florist-mueller.de', '0228 111222', 'Blumen Müller GmbH', 'Blumenstraße 12, 53115 Bonn'
WHERE NOT EXISTS (SELECT 1 FROM public.correspondences WHERE display_name = 'Florist Müller' AND case_id IS NULL)
LIMIT 1;

INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, company_name)
SELECT NULL, 'company', 'Bestattungshaus Rhein-Sieg', 'kontakt@bestattung-rhein-sieg.de', '0228 999888', 'Bestattungshaus Rhein-Sieg GmbH'
WHERE NOT EXISTS (SELECT 1 FROM public.correspondences WHERE display_name = 'Bestattungshaus Rhein-Sieg' AND case_id IS NULL)
LIMIT 1;

INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, company_name)
SELECT NULL, 'company', 'Standesamt Bonn', 'standesamt@bonn.de', '0228 777666', 'Stadt Bonn'
WHERE NOT EXISTS (SELECT 1 FROM public.correspondences WHERE display_name = 'Standesamt Bonn' AND case_id IS NULL)
LIMIT 1;

INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, company_name)
SELECT NULL, 'person', 'Pfarrer Thomas Weber', 'thomas.weber@kirche-bonn.de', '0228 555444', 'Ev. Kirchengemeinde Bonn'
WHERE NOT EXISTS (SELECT 1 FROM public.correspondences WHERE display_name = 'Pfarrer Thomas Weber' AND case_id IS NULL)
LIMIT 1;

INSERT INTO public.correspondences (case_id, kind, display_name, email, phone, company_name)
SELECT NULL, 'company', 'Friedhofsverwaltung Bonn', 'friedhof@bonn.de', '0228 333222', 'Stadt Bonn'
WHERE NOT EXISTS (SELECT 1 FROM public.correspondences WHERE display_name = 'Friedhofsverwaltung Bonn' AND case_id IS NULL)
LIMIT 1;
