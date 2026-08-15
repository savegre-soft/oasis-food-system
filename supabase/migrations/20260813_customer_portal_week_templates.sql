-- Plantilla automática por semana del mes en el portal de clientes, con
-- override manual del staff. Semana del mes = bucket calendario sobre el
-- lunes de la semana del pedido: día 1-7 = Semana 1, 8-14 = Semana 2,
-- 15-21 = Semana 3, 22-28 = Semana 4, 29-31 (5to lunes del mes) vuelve a
-- usar la Semana 1 — acordado con el usuario, no repite la Semana 4 ni
-- inventa una Semana 5.

ALTER TABLE operations.order_templates
  ADD COLUMN IF NOT EXISTS week_of_month smallint CHECK (week_of_month BETWEEN 1 AND 4);

CREATE TABLE IF NOT EXISTS operations.portal_template_overrides (
  id_override      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_start_date  date NOT NULL,
  meal_type        text NOT NULL CHECK (meal_type IN ('Lunch', 'Dinner')),
  template_id      bigint NOT NULL REFERENCES operations.order_templates(id_template),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start_date, meal_type)
);

ALTER TABLE operations.portal_template_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS portal_template_overrides_authenticated_all ON operations.portal_template_overrides;
CREATE POLICY portal_template_overrides_authenticated_all ON operations.portal_template_overrides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Formatea una plantilla (con sus días/recetas) a JSON — reusado tanto por
-- el listado completo de plantillas como por la plantilla resuelta para
-- la semana vigente, para no triplicar la misma subconsulta.
CREATE OR REPLACE FUNCTION operations.portal_template_json(p_template_id bigint)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = operations, pg_temp
AS $$
  SELECT jsonb_build_object(
    'id_template', t.id_template,
    'name', t.name,
    'meal_type', t.meal_type,
    'days', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'day_of_week', td.day_of_week,
        'details', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
            'recipe_id', tdd.recipe_id,
            'recipe_name', r2.name,
            'quantity', tdd.quantity
          )), '[]'::jsonb)
          FROM operations.order_template_details tdd
          JOIN operations.recipes r2 ON r2.id_recipe = tdd.recipe_id
          WHERE tdd.template_day_id = td.id_template_day
        )
      )), '[]'::jsonb)
      FROM operations.order_template_days td WHERE td.template_id = t.id_template
    )
  )
  FROM operations.order_templates t WHERE t.id_template = p_template_id;
$$;

-- portal_get_menu_options: misma firma que ya tenía (sin tocar GRANTs),
-- ahora agrega 'resolved_templates' con la plantilla de Lunch/Dinner que
-- corresponde a la semana vigente (override del staff primero, si no,
-- coincidencia por week_of_month).
CREATE OR REPLACE FUNCTION operations.portal_get_menu_options(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
STABLE
AS $$
DECLARE
  v_client_id bigint;
  v_now timestamp := (now() AT TIME ZONE 'America/Costa_Rica');
  v_dow int := extract(dow from v_now);
  v_is_early boolean := v_dow IN (1, 2);
  v_diff int := CASE WHEN v_dow = 0 THEN -6 ELSE 1 - v_dow END;
  v_monday date := (v_now::date) + v_diff + (CASE WHEN v_is_early THEN 0 ELSE 7 END);
  v_day_of_month int := extract(day from v_monday);
  v_week_of_month int := CASE
    WHEN v_day_of_month <= 7 THEN 1
    WHEN v_day_of_month <= 14 THEN 2
    WHEN v_day_of_month <= 21 THEN 3
    WHEN v_day_of_month <= 28 THEN 4
    ELSE 1
  END;
  v_lunch_template_id bigint;
  v_dinner_template_id bigint;
  v_result jsonb;
BEGIN
  SELECT id_client INTO v_client_id FROM operations.clients WHERE portal_token = p_token AND is_active = true;
  IF v_client_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT template_id INTO v_lunch_template_id FROM operations.portal_template_overrides
    WHERE week_start_date = v_monday AND meal_type = 'Lunch';
  IF v_lunch_template_id IS NULL THEN
    SELECT id_template INTO v_lunch_template_id FROM operations.order_templates
      WHERE week_of_month = v_week_of_month AND meal_type = 'Lunch' AND is_active = true
      ORDER BY id_template DESC LIMIT 1;
  END IF;

  SELECT template_id INTO v_dinner_template_id FROM operations.portal_template_overrides
    WHERE week_start_date = v_monday AND meal_type = 'Dinner';
  IF v_dinner_template_id IS NULL THEN
    SELECT id_template INTO v_dinner_template_id FROM operations.order_templates
      WHERE week_of_month = v_week_of_month AND meal_type = 'Dinner' AND is_active = true
      ORDER BY id_template DESC LIMIT 1;
  END IF;

  SELECT jsonb_build_object(
    'recipes', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id_recipe', r.id_recipe,
        'name', r.name,
        'ingredients', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('name', ri.name, 'category', ri.category)), '[]'::jsonb)
          FROM operations.recipe_ingredients ri WHERE ri.recipe_id = r.id_recipe
        )
      ) ORDER BY r.name), '[]'::jsonb)
      FROM operations.recipes r WHERE r.is_active = true
    ),
    'templates', (
      SELECT coalesce(jsonb_agg(operations.portal_template_json(t.id_template) ORDER BY t.name), '[]'::jsonb)
      FROM operations.order_templates t WHERE t.is_active = true AND t.meal_type IN ('Lunch', 'Dinner')
    ),
    'resolved_templates', jsonb_build_object(
      'Lunch', CASE WHEN v_lunch_template_id IS NULL THEN NULL ELSE operations.portal_template_json(v_lunch_template_id) END,
      'Dinner', CASE WHEN v_dinner_template_id IS NULL THEN NULL ELSE operations.portal_template_json(v_dinner_template_id) END
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
