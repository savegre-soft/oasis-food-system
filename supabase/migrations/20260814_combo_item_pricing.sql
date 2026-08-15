-- Precio por ítem de combo (con historial) reemplaza el monto que hoy el
-- staff escribe a mano cuando un cliente se pasa del cupo agrupado
-- (ComboExtraChargeModal). Cada order_day/selection queda con un unit_price
-- congelado al momento del pedido. Se elimina también el requisito de fecha
-- de entrega en combo_orders, en todo el sistema (staff y futuro portal
-- público) — los combos se organizan solo por combo_week.

ALTER TABLE operations.combo_items ADD COLUMN IF NOT EXISTS price numeric;

-- Backfill: para ítems plato_extra, tomar el extra_price más reciente ya usado
UPDATE operations.combo_items ci SET price = sub.extra_price
FROM (
  SELECT DISTINCT ON (combo_item_id) combo_item_id, extra_price
  FROM operations.combo_week_category_items
  WHERE extra_price IS NOT NULL
  ORDER BY combo_item_id, id_combo_week_category_item DESC
) sub
WHERE ci.id_combo_item = sub.combo_item_id
  AND ci.price IS NULL;

CREATE TABLE IF NOT EXISTS operations.combo_item_price_history (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  combo_item_id bigint NOT NULL REFERENCES operations.combo_items(id_combo_item) ON DELETE CASCADE,
  old_price     numeric,
  new_price     numeric NOT NULL,
  changed_at    timestamptz NOT NULL DEFAULT now(),
  changed_by    uuid
);

ALTER TABLE operations.combo_item_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS combo_item_price_history_read ON operations.combo_item_price_history;
CREATE POLICY combo_item_price_history_read ON operations.combo_item_price_history
  FOR SELECT TO authenticated USING (true);
-- Sin INSERT/UPDATE/DELETE para authenticated: solo el trigger (SECURITY
-- DEFINER) escribe aquí, así queda como bitácora a prueba de manipulación
-- desde el cliente.

CREATE OR REPLACE FUNCTION operations.log_combo_item_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO operations.combo_item_price_history (combo_item_id, old_price, new_price, changed_by)
    VALUES (NEW.id_combo_item, CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.price END, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS combo_items_price_history ON operations.combo_items;
CREATE TRIGGER combo_items_price_history
  AFTER INSERT OR UPDATE OF price ON operations.combo_items
  FOR EACH ROW EXECUTE FUNCTION operations.log_combo_item_price_change();

-- Snapshot del precio aplicado en cada selección (queda correcto en pedidos
-- históricos aunque combo_items.price cambie después).
ALTER TABLE operations.combo_order_selections ADD COLUMN IF NOT EXISTS unit_price numeric;

-- Fecha de entrega deja de ser obligatoria en todo el sistema de combos.
-- La columna se mantiene por ahora (red de seguridad para reportes
-- históricos); limpieza (drop) en una migración futura una vez confirmado
-- que nada la sigue leyendo.
ALTER TABLE operations.combo_orders ALTER COLUMN delivery_date DROP NOT NULL;
