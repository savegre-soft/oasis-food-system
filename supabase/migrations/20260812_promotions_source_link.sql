-- Promociones pueden basarse en un Combo semanal o un plato de Venta Masiva
-- ya registrados, en vez de cargar título/precio 100% manuales. `price_label`
-- queda como respaldo/snapshot — cuando source_type es 'combo'/'bulk_dish',
-- el frontend muestra el precio en vivo desde la tabla vinculada (join), así
-- que si cambia el precio original la promoción lo refleja automáticamente.
ALTER TABLE operations.promotions
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual', -- 'manual' | 'combo' | 'bulk_dish'
  ADD COLUMN IF NOT EXISTS combo_week_id bigint REFERENCES operations.combo_weeks(id_combo_week) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bulk_dish_id bigint REFERENCES operations.bulk_dishes(id_bulk_dish) ON DELETE SET NULL;

-- Lectura anónima: /promociones (sitio público) necesita poder leer el
-- precio en vivo del combo/plato vinculado. Nada sensible (precio y fechas
-- de un menú semanal, nombre y precio sugerido de un plato).
DROP POLICY IF EXISTS combo_weeks_anon_select ON operations.combo_weeks;
CREATE POLICY combo_weeks_anon_select ON operations.combo_weeks
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS bulk_dishes_anon_select ON operations.bulk_dishes;
CREATE POLICY bulk_dishes_anon_select ON operations.bulk_dishes
  FOR SELECT TO anon USING (true);
