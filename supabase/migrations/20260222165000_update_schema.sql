-- Migration: Add special_wishes to cases table
-- Description: Adds a new column to store the special wishes entered in the Vorsorge Configurator

-- Add special_wishes to cases table if it doesn't already exist in the JSONb
-- Note: Our setup currently stores 'specialWishes' inside the 'wishes' JSONB column. 
-- Example data structure: {"burialType": "Feuerbestattung", "specialWishes": "Kostenschätzung: 1.450 €"}

-- If you still need to alter anything specific for the DB, you can place it here.
-- For now, the existing schema handles the new fields via JSONB.

-- Example: If you wanted to move special_wishes to a dedicated column instead of JSONB:
-- ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS special_wishes text;

-- Example: If you need to make sure the family_pin column is definitely unique:
-- ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_family_pin_key;
-- ALTER TABLE public.cases ADD CONSTRAINT cases_family_pin_key UNIQUE (family_pin);
