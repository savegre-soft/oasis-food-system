-- Pasarela pública de solicitud para promociones (combo, venta masiva o
-- manual). Reemplaza el CTA de WhatsApp genérico de /promociones por un
-- formulario real: el cliente elige ítems (si la promo es un combo) o
-- cantidad (venta masiva), llena 4 datos de contacto, y el staff confirma la
-- solicitud por WhatsApp desde el panel interno antes de convertirla en un
-- pedido/venta real. Reemplaza el diseño previo de "Bloque 3" (portal de
-- combos con OTP por correo, nunca implementado por falta de proveedor de
-- mensajería) — acá la verificación es manual por WhatsApp, sin dependencias
-- externas nuevas.

CREATE TABLE IF NOT EXISTS operations.promotion_requests (
  id_promotion_request         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  promotion_id                 bigint NOT NULL REFERENCES operations.promotions(id_promotion),
  client_name                  text NOT NULL,
  email                        text NOT NULL,
  phone                        text NOT NULL,
  delivery_address             text NOT NULL,
  quantity                     numeric,            -- solo venta masiva
  selections                   jsonb,              -- solo combo: [{category, combo_item_id, is_extra, unit_price}]
  price                        numeric,            -- total calculado (null para promo manual, sin precio numérico fijo)
  status                       text NOT NULL DEFAULT 'pending', -- pending | contacted | confirmed | rejected
  whatsapp_sent_at             timestamptz,
  converted_combo_order_id     bigint REFERENCES operations.combo_orders(id_combo_order),
  converted_bulk_sale_entry_id bigint REFERENCES operations.bulk_sale_entries(id_bulk_sale_entry),
  created_at                   timestamptz NOT NULL DEFAULT now()
);

-- Las tablas de `operations` creadas en migraciones previas ya tienen GRANT
-- amplio hacia `anon`/`authenticated` (otorgado una vez fuera de las
-- migraciones, probablemente vía ALTER DEFAULT PRIVILEGES del dashboard) —
-- una tabla nueva no lo hereda automáticamente, así que hace falta otorgarlo
-- a mano acá. El límite real de qué puede hacer cada rol lo pone el RLS de
-- abajo, no este GRANT.
GRANT SELECT, INSERT ON operations.promotion_requests TO anon;
GRANT ALL ON operations.promotion_requests TO authenticated;

-- ── RLS: insert-only anónimo (solo contra una promoción activa), gestión
-- completa desde el panel interno ──────────────────────────────────────────
ALTER TABLE operations.promotion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_requests_anon_insert ON operations.promotion_requests;
CREATE POLICY promotion_requests_anon_insert ON operations.promotion_requests
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM operations.promotions p
      WHERE p.id_promotion = promotion_id AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS promotion_requests_authenticated_all ON operations.promotion_requests;
CREATE POLICY promotion_requests_authenticated_all ON operations.promotion_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── RLS: lectura anónima nueva para que la pasarela pública pueda armar el
-- selector de ítems de un combo (mismo patrón ya usado para combo_weeks /
-- bulk_dishes en 20260812_promotions_source_link.sql) ──────────────────────
DROP POLICY IF EXISTS combo_items_anon_select ON operations.combo_items;
CREATE POLICY combo_items_anon_select ON operations.combo_items
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS combo_week_categories_anon_select ON operations.combo_week_categories;
CREATE POLICY combo_week_categories_anon_select ON operations.combo_week_categories
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS combo_week_category_items_anon_select ON operations.combo_week_category_items;
CREATE POLICY combo_week_category_items_anon_select ON operations.combo_week_category_items
  FOR SELECT TO anon USING (true);
