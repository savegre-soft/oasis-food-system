-- Historial de precios para el catálogo de "Ventas Masivas": el precio
-- sugerido de un plato puede variar con el tiempo, así que cada vez que
-- cambia se guarda una fila aquí (bulk_dish_id, precio, fecha del cambio).

CREATE TABLE IF NOT EXISTS operations.bulk_dish_price_history (
  id_bulk_dish_price_history bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bulk_dish_id                bigint NOT NULL REFERENCES operations.bulk_dishes(id_bulk_dish) ON DELETE CASCADE,
  price                        numeric NOT NULL,
  changed_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bulk_dish_price_history_dish_idx
  ON operations.bulk_dish_price_history (bulk_dish_id, changed_at DESC);

ALTER TABLE operations.bulk_dish_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bulk_dish_price_history_authenticated_all ON operations.bulk_dish_price_history;
CREATE POLICY bulk_dish_price_history_authenticated_all ON operations.bulk_dish_price_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
