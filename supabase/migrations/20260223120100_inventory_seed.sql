-- Seed default categories and locations for Bestattungsunternehmen
insert into public.inventory_categories (name, description, color) values
  ('Särge', 'Verschiedene Sargmodelle', '#4a5568'),
  ('Urnen', 'Urnen und Aschenbehältnisse', '#6b7280'),
  ('Dekoration', 'Blumen, Kerzen, Schmuck', '#8b5cf6'),
  ('Technik', 'Beleuchtung, Ton, etc.', '#3b82f6');

insert into public.inventory_locations (name, description) values
  ('Lagerraum 1', 'Hauptlager'),
  ('Lagerraum 2', 'Reservelager'),
  ('Showroom', 'Ausstellungsbereich');
