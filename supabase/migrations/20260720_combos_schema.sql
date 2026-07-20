-- Nueva sección "Combos": pedidos puntuales por categorías (Arroz, Proteína,
-- Acompañamientos, Extras, Plato Extra), configurados semana a semana por el
-- administrador, distintos del flujo de pedidos semanales/express existente.
--
-- Estilo: columnas de texto simples sin CHECK constraints, igual que el
-- resto del esquema (`payments.payment_type` tampoco los tiene). Validación
-- de valores permitidos queda en el código del frontend.

-- ── Catálogo de ítems (reutilizable entre semanas) ───────────────────────────
CREATE TABLE IF NOT EXISTS operations.combo_items (
  id_combo_item  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category       text NOT NULL, -- arroz | proteina | acompanamiento | extra | plato_extra
  name           text NOT NULL,
  portion_size_g numeric,       -- solo aplica a categoría arroz/proteina
  recipe_id      bigint REFERENCES operations.recipes(id_recipe),
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Combo de la semana (definido por el admin) ───────────────────────────────
CREATE TABLE IF NOT EXISTS operations.combo_weeks (
  id_combo_week   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_start_date date NOT NULL,
  week_end_date   date NOT NULL,
  base_price      numeric NOT NULL,
  status          text NOT NULL DEFAULT 'open', -- open | closed
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Configuración por categoría dentro de un combo semanal ───────────────────
CREATE TABLE IF NOT EXISTS operations.combo_week_categories (
  id_combo_week_category bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  combo_week_id  bigint NOT NULL REFERENCES operations.combo_weeks(id_combo_week) ON DELETE CASCADE,
  category       text NOT NULL,
  max_selections integer NOT NULL DEFAULT 1
);

-- ── Ítems del catálogo habilitados para una categoría de esa semana ──────────
CREATE TABLE IF NOT EXISTS operations.combo_week_category_items (
  id_combo_week_category_item bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  combo_week_category_id bigint NOT NULL REFERENCES operations.combo_week_categories(id_combo_week_category) ON DELETE CASCADE,
  combo_item_id  bigint NOT NULL REFERENCES operations.combo_items(id_combo_item),
  extra_price    numeric -- solo tiene sentido si la categoría es plato_extra
);

-- ── Pedido de combo de un cliente ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operations.combo_orders (
  id_combo_order bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  combo_week_id  bigint NOT NULL REFERENCES operations.combo_weeks(id_combo_week),
  client_id      bigint NOT NULL REFERENCES operations.clients(id_client),
  delivery_date  date NOT NULL,
  price          numeric NOT NULL, -- snapshot: base_price + extras elegidos
  status         text NOT NULL DEFAULT 'PENDING', -- PENDING | PACKED | DELIVERED | CANCELLED
  payment_id     bigint REFERENCES operations.payments(id_payment),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Selecciones del cliente dentro de su pedido de combo ─────────────────────
CREATE TABLE IF NOT EXISTS operations.combo_order_selections (
  id_combo_order_selection bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  combo_order_id bigint NOT NULL REFERENCES operations.combo_orders(id_combo_order) ON DELETE CASCADE,
  combo_item_id  bigint NOT NULL REFERENCES operations.combo_items(id_combo_item),
  category       text NOT NULL -- denormalizado desde combo_items.category, evita joins extra al agregar por plato
);

-- ── RLS: mismo patrón "abierto a cualquier autenticado" que el resto de
-- tablas de negocio (ver 20260704_rls_policies.sql) ──────────────────────────
DO $$
DECLARE
  t text;
  open_tables text[] := ARRAY[
    'combo_items', 'combo_weeks', 'combo_week_categories',
    'combo_week_category_items', 'combo_orders', 'combo_order_selections'
  ];
BEGIN
  FOREACH t IN ARRAY open_tables LOOP
    EXECUTE format('ALTER TABLE operations.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON operations.%I', t || '_authenticated_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON operations.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t || '_authenticated_all', t
    );
  END LOOP;
END $$;
