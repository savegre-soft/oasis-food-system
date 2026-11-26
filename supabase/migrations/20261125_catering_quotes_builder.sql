-- Fase 2 de "Cotizaciones de eventos": propuestas aceptadas + armador de
-- cotización formal (documento para el cliente), sobre lo ya construido en
-- 20261108_event_quotes.sql.
--
-- Agrega:
--   1. Estado 'accepted' (distinto de 'converted', que sigue significando
--      "ya es cliente del sistema") + campo de observaciones del staff.
--   2. Catálogo de platos exclusivo de catering (operations.catering_dishes)
--      — separado de operations.recipes porque ese catálogo es para
--      producción diaria (recetas con ingredientes por categoría), mientras
--      que aquí solo se necesita nombre + tiempo + categoría + precio p.p.
--      para armar el MENÚ de una cotización.
--   3. Catálogo de categorías de cotización y precios (costo fijo, saloneros,
--      vajilla, copas, alquiler...), administrable por el staff.
--   4. Líneas de menú y líneas de costos extra por cotización.

-- ── event_quotes: estado 'accepted' + observaciones ────────────────────────
ALTER TABLE operations.event_quotes
  ADD COLUMN IF NOT EXISTS observations text;

-- ── Catálogo de platos de catering ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operations.catering_dishes (
  id_catering_dish  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  meal_time         text NOT NULL, -- Desayuno, Almuerzo, Café, Cena, Snacks/Meriendas, Brunch
  category          text NOT NULL DEFAULT 'Regular', -- Regular, Ejecutivo, ...
  name              text NOT NULL,
  price_per_person  numeric NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE operations.catering_dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catering_dishes_staff_all ON operations.catering_dishes;
CREATE POLICY catering_dishes_staff_all ON operations.catering_dishes
  FOR ALL TO authenticated
  USING (operations.user_has_role(ARRAY['Administrador', 'Clientes']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador', 'Clientes']));

-- ── Catálogo de categorías de cotización y precios ─────────────────────────
CREATE TABLE IF NOT EXISTS operations.catering_pricing_categories (
  id_pricing_category  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                 text NOT NULL,
  unit_label           text NOT NULL DEFAULT 'c/u', -- c/u, fijo, p.p., por utensilio, variable...
  default_unit_price   numeric, -- NULL = precio variable, se define al cotizar
  is_active            boolean NOT NULL DEFAULT true,
  sort_order           integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE operations.catering_pricing_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catering_pricing_categories_staff_all ON operations.catering_pricing_categories;
CREATE POLICY catering_pricing_categories_staff_all ON operations.catering_pricing_categories
  FOR ALL TO authenticated
  USING (operations.user_has_role(ARRAY['Administrador', 'Clientes']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador', 'Clientes']));

INSERT INTO operations.catering_pricing_categories (name, unit_label, default_unit_price, sort_order)
VALUES
  ('Costo fijo de servicio', 'fijo', 70000, 1),
  ('Saloneros', 'c/u', 20, 2),
  ('Vajilla', 'por utensilio', 200, 3),
  ('Copas', 'c/u', 300, 4),
  ('Alquiler de algo extra', 'variable', NULL, 5)
ON CONFLICT DO NOTHING;

-- ── Líneas de menú por cotización ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operations.event_quote_menu_items (
  id_menu_item      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_quote_id    bigint NOT NULL REFERENCES operations.event_quotes(id_event_quote) ON DELETE CASCADE,
  catering_dish_id  bigint REFERENCES operations.catering_dishes(id_catering_dish) ON DELETE SET NULL,
  meal_time         text NOT NULL,
  category          text NOT NULL DEFAULT 'Regular',
  dish_name         text NOT NULL,
  price_per_person  numeric NOT NULL DEFAULT 0,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_quote_menu_items_quote_idx
  ON operations.event_quote_menu_items (event_quote_id);

ALTER TABLE operations.event_quote_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_quote_menu_items_staff_all ON operations.event_quote_menu_items;
CREATE POLICY event_quote_menu_items_staff_all ON operations.event_quote_menu_items
  FOR ALL TO authenticated
  USING (operations.user_has_role(ARRAY['Administrador', 'Clientes']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador', 'Clientes']));

-- ── Líneas de costos extra ("No incluye") por cotización ───────────────────
CREATE TABLE IF NOT EXISTS operations.event_quote_extra_items (
  id_extra_item        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_quote_id       bigint NOT NULL REFERENCES operations.event_quotes(id_event_quote) ON DELETE CASCADE,
  pricing_category_id  bigint REFERENCES operations.catering_pricing_categories(id_pricing_category) ON DELETE SET NULL,
  label                text NOT NULL,
  quantity             numeric NOT NULL DEFAULT 1,
  unit_price           numeric NOT NULL DEFAULT 0,
  sort_order           integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_quote_extra_items_quote_idx
  ON operations.event_quote_extra_items (event_quote_id);

ALTER TABLE operations.event_quote_extra_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_quote_extra_items_staff_all ON operations.event_quote_extra_items;
CREATE POLICY event_quote_extra_items_staff_all ON operations.event_quote_extra_items
  FOR ALL TO authenticated
  USING (operations.user_has_role(ARRAY['Administrador', 'Clientes']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador', 'Clientes']));
