-- Add flexible parameters (JSONB) to inventory_items for marketplace-style product attributes
alter table public.inventory_items
  add column if not exists parameters jsonb default '{}'::jsonb;

comment on column public.inventory_items.parameters is 'Flexible key-value attributes (e.g. Material, Maße) for product catalog';
