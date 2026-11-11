-- Un combo o una venta masiva publicados en /promociones NO son una
-- "promoción" — son su propio concepto, solo visibles en esa sección del
-- sitio público. Hasta ahora se modelaban como una fila más en
-- `operations.promotions` (source_type='combo'/'bulk_dish'), lo cual les
-- daba un `id_promotion` que no tiene sentido de negocio. Este cambio les da
-- su propio flag de publicación en su propia tabla, y `promotions` vuelve a
-- representar solo promociones manuales.

ALTER TABLE operations.combo_weeks
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

ALTER TABLE operations.bulk_dishes
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Backfill: lo que ya estaba publicado como promoción de combo/venta pasa a
-- marcarse publicado en su propia tabla.
UPDATE operations.combo_weeks cw
SET is_published = true
FROM operations.promotions p
WHERE p.source_type = 'combo' AND p.combo_week_id = cw.id_combo_week AND p.is_active = true;

UPDATE operations.bulk_dishes bd
SET is_published = true
FROM operations.promotions p
WHERE p.source_type = 'bulk_dish' AND p.bulk_dish_id = bd.id_bulk_dish AND p.is_active = true;

-- promotion_requests: antes solo podía apuntar a una fila de `promotions`.
-- Ahora una solicitud apunta a exactamente una de las 3 "ofertas" posibles
-- (promoción manual, combo o venta), vía `offer_type` + la FK que
-- corresponda — las otras dos quedan NULL (ver CHECK abajo).
ALTER TABLE operations.promotion_requests
  ALTER COLUMN promotion_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS offer_type text,
  ADD COLUMN IF NOT EXISTS combo_week_id bigint REFERENCES operations.combo_weeks(id_combo_week) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bulk_dish_id bigint REFERENCES operations.bulk_dishes(id_bulk_dish) ON DELETE SET NULL;

-- Backfill de offer_type/combo_week_id/bulk_dish_id desde la promoción que
-- la solicitud ya tenía vinculada.
UPDATE operations.promotion_requests pr
SET offer_type = COALESCE(p.source_type, 'manual'),
    combo_week_id = p.combo_week_id,
    bulk_dish_id = p.bulk_dish_id
FROM operations.promotions p
WHERE pr.promotion_id = p.id_promotion;

UPDATE operations.promotion_requests SET offer_type = 'manual' WHERE offer_type IS NULL;

-- Las solicitudes de combo/venta ya no apuntan a `promotions` — su FK queda
-- en combo_week_id/bulk_dish_id en vez de promotion_id.
UPDATE operations.promotion_requests SET promotion_id = NULL WHERE offer_type <> 'manual';

ALTER TABLE operations.promotion_requests
  ALTER COLUMN offer_type SET NOT NULL,
  ADD CONSTRAINT promotion_requests_offer_type_check
    CHECK (offer_type IN ('manual', 'combo', 'bulk_dish')),
  ADD CONSTRAINT promotion_requests_offer_ref_check CHECK (
    (offer_type = 'manual'   AND promotion_id   IS NOT NULL AND combo_week_id IS NULL     AND bulk_dish_id IS NULL) OR
    (offer_type = 'combo'    AND combo_week_id  IS NOT NULL AND promotion_id  IS NULL      AND bulk_dish_id IS NULL) OR
    (offer_type = 'bulk_dish' AND bulk_dish_id  IS NOT NULL AND promotion_id  IS NULL      AND combo_week_id IS NULL)
  );

-- Las filas de combo/venta ya no pertenecen a `promotions` — se borran (su
-- estado ya quedó migrado a combo_weeks.is_published/bulk_dishes.is_published
-- arriba) y se quitan las columnas de vínculo: `promotions` vuelve a ser
-- exclusivamente manual.
DELETE FROM operations.promotions WHERE source_type IN ('combo', 'bulk_dish');

ALTER TABLE operations.promotions
  DROP COLUMN IF EXISTS source_type,
  DROP COLUMN IF EXISTS combo_week_id,
  DROP COLUMN IF EXISTS bulk_dish_id;

-- RLS: el INSERT anónimo de una solicitud ahora valida contra la oferta
-- correcta según `offer_type` (antes siempre contra `promotions`).
DROP POLICY IF EXISTS promotion_requests_anon_insert ON operations.promotion_requests;
CREATE POLICY promotion_requests_anon_insert ON operations.promotion_requests
  FOR INSERT TO anon WITH CHECK (
    (offer_type = 'manual' AND EXISTS (
      SELECT 1 FROM operations.promotions p
      WHERE p.id_promotion = promotion_id AND p.is_active = true
    ))
    OR (offer_type = 'combo' AND EXISTS (
      SELECT 1 FROM operations.combo_weeks cw
      WHERE cw.id_combo_week = combo_week_id AND cw.is_published = true
    ))
    OR (offer_type = 'bulk_dish' AND EXISTS (
      SELECT 1 FROM operations.bulk_dishes bd
      WHERE bd.id_bulk_dish = bulk_dish_id AND bd.is_published = true
    ))
  );
