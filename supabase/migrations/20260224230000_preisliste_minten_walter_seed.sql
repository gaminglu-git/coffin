-- Seed: Preisliste minten&walter 01/2025
-- Replaces default categories/leistungen with actual price list structure

-- 1. Clear existing data (case_leistungen has FK to leistungen)
delete from public.case_leistungen;
delete from public.leistungen;
delete from public.leistung_categories;

-- 2. Insert leistung_categories (Preisliste structure)
insert into public.leistung_categories (name, description, sort_order) values
  ('Beratung und Begleitung', 'Beratung, Begleitung, Organisation', 0),
  ('Abholung und Versorgung', 'Abholung, Versorgung, Klimaraum', 1),
  ('Sarg und Urne', 'Särge, Urnen, Ausstattung', 2),
  ('Organisation der Bestattung', 'Überführung, Einäscherung, Sargträger', 3),
  ('Abschiednahme und Feier', 'Abschiednahme, Abschiedsfeier, Worte', 4),
  ('Karten und Druck', 'Trauerkarten, Dankeskarten, Kaffeekarten', 5);

-- 3. Insert main leistungen (parents) and get IDs for children
do $$
declare
  cat_beratung uuid;
  cat_abholung uuid;
  cat_sarg uuid;
  cat_org uuid;
  cat_feier uuid;
  cat_karten uuid;
  leist_abholung uuid;
  leist_sarg uuid;
  leist_org uuid;
  leist_feier uuid;
  leist_karten uuid;
  loc_id uuid;
  cat_sarge uuid;
  cat_urnen uuid;
begin
  select id into cat_beratung from public.leistung_categories where sort_order = 0 limit 1;
  select id into cat_abholung from public.leistung_categories where sort_order = 1 limit 1;
  select id into cat_sarg from public.leistung_categories where sort_order = 2 limit 1;
  select id into cat_org from public.leistung_categories where sort_order = 3 limit 1;
  select id into cat_feier from public.leistung_categories where sort_order = 4 limit 1;
  select id into cat_karten from public.leistung_categories where sort_order = 5 limit 1;

  -- 3a. Beratung und Begleitung (1150€, Sternenkind 575€)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order, parameters)
  values (
    'Beratung und Begleitung',
    'Unsere Beratung und Begleitung zu jeder Zeit, alle Vor- und Nachgespräche, telefonische Bereitschaft, Absprachen und Organisation. Alle amtlichen Vorgänge und Beantragen der Sterbeurkunden sowie Benachrichtigung an Rente und Krankenversicherung.',
    115000,
    'fixed',
    true,
    cat_beratung,
    0,
    '{"sternenkindPriceCents": 57500}'::jsonb
  );

  -- 3b. Abholung und Versorgung (700€, Sternenkind 350€)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order, parameters)
  values (
    'Abholung und Versorgung',
    'Die Abholung des verstorbenen Menschen am Sterbeort. Die Versorgung, das Einkleiden und Einbetten. Der Aufenthalt im gekühlten Klimaraum bis 5 Tage.',
    70000,
    'fixed',
    true,
    cat_abholung,
    0,
    '{"sternenkindPriceCents": 35000}'::jsonb
  )
  returning id into leist_abholung;

  -- 3c. Weitere Leistungen Abholung (children)
  insert into public.leistungen (title, description, price_cents, price_type, unit_label, parent_id, is_public, category_id, sort_order) values
    ('Aufbahrung zuhause inkl. Überführung', 'Aufbahrung zuhause inkl. Überführung vom Sterbeort', 40000, 'fixed', null, leist_abholung, true, cat_abholung, 1),
    ('Jede weitere Überführung', 'Weitere Überführung', 30000, 'fixed', null, leist_abholung, true, cat_abholung, 2),
    ('Gemeinsames Einkleiden und Einbetten', 'Gemeinsames Einkleiden und Einbetten mit Ihnen', 10000, 'fixed', null, leist_abholung, true, cat_abholung, 3),
    ('Klimaraum pro zusätzlichem Tag', 'Aufenthalt im Klimaraum pro zusätzlichem Tag', 3500, 'per_unit', 'Tag', leist_abholung, true, cat_abholung, 4);

  -- 3d. Unser Sarg (625€)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order)
  values (
    'Unser Sarg',
    'Ein hochwertiger Vollholzsarg aus unbehandeltem Kiefernholz mit einem Ausschlag aus Bio-Baumwolle, Bio-Matratze und Bio-Kissen.',
    62500,
    'fixed',
    true,
    cat_sarg,
    0
  )
  returning id into leist_sarg;

  -- 3e. Weitere Leistungen Sarg (children)
  insert into public.leistungen (title, description, price_cents, price_type, unit_label, parent_id, is_public, category_id, sort_order) values
    ('Griffe und Beschläge für Erdbestattung', 'Griffe und Beschläge für eine Erdbestattung', 7500, 'min_price', null, leist_sarg, true, cat_sarg, 1),
    ('Schmuckurne für Feuerbestattung', 'Schmuckurne für eine Feuerbestattung', 7500, 'min_price', null, leist_sarg, true, cat_sarg, 2),
    ('Große Auswahl an weiteren Särgen', 'Eine große Auswahl an weiteren Särgen', 0, 'on_request', null, leist_sarg, true, cat_sarg, 3),
    ('Baumwolltuch oder Decke', 'Baumwolltuch oder Decke', 0, 'on_request', null, leist_sarg, true, cat_sarg, 4),
    ('Sarg- und Grabkreuze', 'Sarg- und Grabkreuze', 0, 'on_request', null, leist_sarg, true, cat_sarg, 5);

  -- 3f. Organisation der Bestattung (400€, Sternenkind 200€)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order, parameters)
  values (
    'Organisation der Bestattung',
    'Bei der Erdbestattung ist darin die Überführung des Sarges zum Friedhof enthalten. Bei einer Feuerbestattung ist die Überführung zum Amtsarzt und zum Krematorium sowie die Überführung der Urne zum Friedhof enthalten.',
    40000,
    'fixed',
    true,
    cat_org,
    0,
    '{"sternenkindPriceCents": 20000}'::jsonb
  )
  returning id into leist_org;

  -- 3g. Weitere Leistungen Organisation (children)
  insert into public.leistungen (title, description, price_cents, price_type, parent_id, is_public, category_id, sort_order) values
    ('Sargträger bei Erdbestattung', 'Sargträger bei einer Erdbestattung', 45000, 'fixed', leist_org, true, cat_org, 1),
    ('Einäscherung im Krematorium', 'Einäscherung im Krematorium (Standard)', 42500, 'fixed', leist_org, true, cat_org, 2),
    ('Einäscherung CO2-neutral', 'Einäscherung im Krematorium CO2-neutral', 52500, 'fixed', leist_org, true, cat_org, 3);

  -- 3h. Begleitete Einäscherung (400€)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order)
  values (
    'Begleitete Einäscherung',
    'Sie können bei der Einäscherung im Krematorium dabei sein. Kosten entstehen für Sie nur, wenn Sie möchten, dass wir Sie dabei begleiten.',
    40000,
    'fixed',
    true,
    cat_org,
    1
  );

  -- 3i. Abschiednahme (300€)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order)
  values (
    'Abschiednahme',
    'Bei der Abschiednahme können Sie sich mit der Familie und Freunden von Ihrem verstorbenen Menschen am offenen Sarg verabschieden.',
    30000,
    'fixed',
    true,
    cat_feier,
    0
  );

  -- 3j. Abschiedsfeier (750€ / 375€) - two separate options
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order)
  values (
    'Abschiedsfeier (große Feier)',
    'Planung, Organisation und Gestaltung einer passenden, persönlichen Abschiedsfeier, Koordination aller externen Stellen und Dienstleister, individuelle Dekoration inkl. Auf- und Abbau, Begleitung der Feier durch zwei Mitarbeitende.',
    75000,
    'fixed',
    true,
    cat_feier,
    1
  )
  returning id into leist_feier;

  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order)
  values (
    'Abschiedsfeier (im kleinen Rahmen)',
    'Planung, Organisation und Gestaltung einer Abschiedsfeier im kleinen Rahmen am Grab inkl. Auf- und Abbau der Dekoration, Koordination aller externen Stellen und Dienstleister, Begleitung der Feier durch einen Mitarbeitenden.',
    37500,
    'fixed',
    true,
    cat_feier,
    2
  );

  -- 3k. Weitere Leistungen Abschiedsfeier (children of leist_feier)
  insert into public.leistungen (title, description, price_cents, price_type, parent_id, is_public, category_id, sort_order) values
    ('Vergrößern und Rahmen eines Fotos', null, 7500, 'fixed', leist_feier, true, cat_feier, 3),
    ('Abspielen der Musik während der Feier', null, 7500, 'fixed', leist_feier, true, cat_feier, 4),
    ('Kerzenritual „Lichter der Erinnerung“', null, 7500, 'fixed', leist_feier, true, cat_feier, 5),
    ('Aufstellen von Stühlen', 'z.B. bei einer Feier im Freien', 7500, 'fixed', leist_feier, true, cat_feier, 6),
    ('Aufstellen eines Zeltes', null, 7500, 'fixed', leist_feier, true, cat_feier, 7),
    ('Bereitstellen von Gläsern', null, 7500, 'fixed', leist_feier, true, cat_feier, 8);

  -- 3l. Worte zum Abschied (250€ / ca. 450€) - two options
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order) values
    ('Moderation der Abschiedsfeier', 'Moderation der Abschiedsfeier auf Wunsch inkl. Vortragen einer von Ihnen oder Freunden selbst verfassten Rede', 25000, 'fixed', true, cat_feier, 9),
    ('Persönliche Abschiedsrede', 'Eine persönliche Abschiedsrede inkl. Moderation der Feier durch eine Trauerrednerin oder einen Trauerredner', 45000, 'fixed', true, cat_feier, 10);

  -- 3m. Karten (75€ Gestaltung + per-Stück)
  insert into public.leistungen (title, description, price_cents, price_type, is_public, category_id, sort_order)
  values (
    'Gestaltung der Trauerkarten oder Dankeskarten',
    'Gestaltung der Trauerkarten oder Dankeskarten',
    7500,
    'fixed',
    true,
    cat_karten,
    0
  )
  returning id into leist_karten;

  -- 3n. Weitere Leistungen Karten (children)
  insert into public.leistungen (title, description, price_cents, price_type, unit_label, parent_id, is_public, category_id, sort_order) values
    ('Trauerkarten pro Stück', 'Trauerkarten inkl. Umschläge und Druck pro Stück', 350, 'per_unit', 'Stück', leist_karten, true, cat_karten, 1),
    ('Dankeskarten pro Stück', 'Dankeskarten inkl. Umschläge und Druck pro Stück', 250, 'per_unit', 'Stück', leist_karten, true, cat_karten, 2),
    ('Kaffeekarten je 10 Stück', 'Kaffeekarten inkl. Druck je 10 Stück', 750, 'per_unit', '10 Stück', leist_karten, true, cat_karten, 3),
    ('Versand der Trauerkarten pro Stück', 'Versand der Trauerkarten exkl. Porto pro Stück', 250, 'per_unit', 'Stück', leist_karten, true, cat_karten, 4);

  -- 4. Inventory items (Lager) - add products if categories exist
  select id into cat_sarge from public.inventory_categories where name = 'Särge' limit 1;
  select id into cat_urnen from public.inventory_categories where name = 'Urnen' limit 1;
  select id into loc_id from public.inventory_locations limit 1;

  if cat_sarge is not null and loc_id is not null then
    insert into public.inventory_items (title, description, status, category_id, location_id, price_cents)
    select 'Vollholzsarg Kiefernholz', 'Hochwertiger Vollholzsarg aus unbehandeltem Kiefernholz, Bio-Baumwolle, Bio-Matratze, Bio-Kissen', 'in_stock', cat_sarge, loc_id, 62500
    where not exists (select 1 from public.inventory_items where title = 'Vollholzsarg Kiefernholz' and category_id = cat_sarge);
    insert into public.inventory_items (title, description, status, category_id, location_id, price_cents)
    select 'Griffe und Beschläge', 'Griffe und Beschläge für Erdbestattung', 'in_stock', cat_sarge, loc_id, 7500
    where not exists (select 1 from public.inventory_items where title = 'Griffe und Beschläge' and category_id = cat_sarge);
    insert into public.inventory_items (title, description, status, category_id, location_id, price_cents)
    select 'Baumwolltuch / Decke', 'Baumwolltuch oder Decke', 'in_stock', cat_sarge, loc_id, null
    where not exists (select 1 from public.inventory_items where title = 'Baumwolltuch / Decke' and category_id = cat_sarge);
    insert into public.inventory_items (title, description, status, category_id, location_id, price_cents)
    select 'Sarg- und Grabkreuze', 'Sarg- und Grabkreuze', 'in_stock', cat_sarge, loc_id, null
    where not exists (select 1 from public.inventory_items where title = 'Sarg- und Grabkreuze' and category_id = cat_sarge);
  end if;

  if cat_urnen is not null and loc_id is not null then
    insert into public.inventory_items (title, description, status, category_id, location_id, price_cents)
    select 'Schmuckurne', 'Schmuckurne für Feuerbestattung', 'in_stock', cat_urnen, loc_id, 7500
    where not exists (select 1 from public.inventory_items where title = 'Schmuckurne' and category_id = cat_urnen);
  end if;
end $$;
