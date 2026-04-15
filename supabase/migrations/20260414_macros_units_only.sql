-- Migration: macros now use unit counts instead of gram-based values
-- Drops all *_unit columns from macro_profiles, orders, and order_day_details.
-- protein_value / carb_value now represent integer unit counts (e.g. 2 proteins, 3 carbs).

-- ── macro_profiles ─────────────────────────────────────────────────────────────
ALTER TABLE operations.macro_profiles
  DROP COLUMN IF EXISTS protein_unit,
  DROP COLUMN IF EXISTS carb_unit;

-- ── orders ────────────────────────────────────────────────────────────────────
ALTER TABLE operations.orders
  DROP COLUMN IF EXISTS protein_unit_snapshot,
  DROP COLUMN IF EXISTS carb_unit_snapshot;

-- ── order_day_details ─────────────────────────────────────────────────────────
ALTER TABLE operations.order_day_details
  DROP COLUMN IF EXISTS protein_unit_applied,
  DROP COLUMN IF EXISTS carb_unit_applied;

-- ── Convert value columns to integer (units are whole numbers, not decimals) ──
ALTER TABLE operations.macro_profiles
  ALTER COLUMN protein_value TYPE integer USING round(protein_value)::integer,
  ALTER COLUMN carb_value    TYPE integer USING round(carb_value)::integer;

ALTER TABLE operations.orders
  ALTER COLUMN protein_snapshot TYPE integer USING round(protein_snapshot)::integer,
  ALTER COLUMN carb_snapshot    TYPE integer USING round(carb_snapshot)::integer;

ALTER TABLE operations.order_day_details
  ALTER COLUMN protein_value_applied TYPE integer USING round(protein_value_applied)::integer,
  ALTER COLUMN carb_value_applied    TYPE integer USING round(carb_value_applied)::integer;
