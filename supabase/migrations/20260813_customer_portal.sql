-- Portal de clientes (Etapa 3, docs/v2/03_REQUERIMIENTOS_PORTAL_CLIENTE.md,
-- diseño en docs/v2/08_DISEÑO_RLS.md). Acceso sin login: el rol `anon` solo
-- puede EXECUTE estas 4 funciones SECURITY DEFINER, nunca SELECT/INSERT
-- directo sobre las tablas de negocio.
--
-- Alcance v1 del portal (deliberado, ver RF-PC-03/§4 del doc): reusa el
-- snapshot de macros a nivel de pedido y el catálogo de recetas/plantillas
-- tal cual el flujo interno, pero NO reproduce los overrides avanzados que
-- hoy solo usa el staff (macro por día, override de ingredientes por
-- receta, recetas "extra" con tipo de comida distinto). Esas son
-- herramientas de power-user internas, no están en el alcance documentado
-- del portal — el staff las sigue teniendo disponibles si hace falta
-- ajustar un pedido creado desde el portal.

ALTER TABLE operations.clients
  ADD COLUMN IF NOT EXISTS portal_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS portal_token_regenerated_at timestamptz;

ALTER TABLE operations.orders
  ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'staff'; -- 'staff' | 'portal'

-- ── portal_get_client: plan del cliente, solo lectura (RF-PC-02) ────────────
CREATE OR REPLACE FUNCTION operations.portal_get_client(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = operations, pg_temp
STABLE
AS $$
  SELECT jsonb_build_object(
    'name', c.name,
    'client_type', c.client_type,
    'plan_type', c.plan_type,
    'lunch_macro', CASE WHEN c.client_type = 'family' THEN NULL ELSE
      (SELECT jsonb_build_object('protein_value', mp.protein_value, 'carb_value', mp.carb_value)
       FROM operations.macro_profiles mp WHERE mp.id_macro_profile = c.lunch_macro_profile_id)
    END,
    'dinner_macro', CASE WHEN c.client_type = 'family' THEN NULL ELSE
      (SELECT jsonb_build_object('protein_value', mp.protein_value, 'carb_value', mp.carb_value)
       FROM operations.macro_profiles mp WHERE mp.id_macro_profile = c.dinner_macro_profile_id)
    END,
    'route', (
      SELECT jsonb_build_object(
        'name', r.name,
        'delivery_days', (
          SELECT coalesce(jsonb_agg(rdd.day_of_week ORDER BY rdd.day_of_week), '[]'::jsonb)
          FROM operations.route_delivery_days rdd WHERE rdd.route_id = r.id_route
        )
      )
      FROM operations.routes r WHERE r.id_route = c.route_id
    )
  )
  FROM operations.clients c
  WHERE c.portal_token = p_token AND c.is_active = true;
$$;

-- ── portal_get_current_order: pedido de la semana vigente + corte por día (RF-PC-05) ──
CREATE OR REPLACE FUNCTION operations.portal_get_current_order(p_token uuid)
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
  v_order_id bigint;
  v_result jsonb;
BEGIN
  SELECT id_client INTO v_client_id FROM operations.clients
    WHERE portal_token = p_token AND is_active = true;
  IF v_client_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id_order INTO v_order_id FROM operations.orders
    WHERE client_id = v_client_id AND week_start_date = v_monday
    ORDER BY id_order DESC LIMIT 1;

  IF v_order_id IS NULL THEN
    RETURN jsonb_build_object(
      'exists', false,
      'week_start_date', v_monday,
      'week_end_date', v_monday + 6,
      'days', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'exists', true,
    'classification', o.classification,
    'week_start_date', o.week_start_date,
    'week_end_date', o.week_end_date,
    'days', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'day_of_week', od.day_of_week,
        'delivery_date', od.delivery_date,
        'status', od.status,
        'is_editable', (od.status = 'PENDING' AND (od.delivery_date - 1 + time '23:59') > v_now),
        'details', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
            'recipe_id', d.recipe_id,
            'recipe_name', r.name,
            'quantity', d.quantity
          )), '[]'::jsonb)
          FROM operations.order_day_details d
          JOIN operations.recipes r ON r.id_recipe = d.recipe_id
          WHERE d.order_day_id = od.id_order_day
        )
      ) ORDER BY od.delivery_date), '[]'::jsonb)
      FROM operations.order_days od WHERE od.order_id = o.id_order
    )
  ) INTO v_result
  FROM operations.orders o WHERE o.id_order = v_order_id;

  RETURN v_result;
END;
$$;

-- ── portal_get_menu_options: catálogo para armar el pedido (RF-PC-03) ───────
CREATE OR REPLACE FUNCTION operations.portal_get_menu_options(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = operations, pg_temp
STABLE
AS $$
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
      SELECT coalesce(jsonb_agg(jsonb_build_object(
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
      ) ORDER BY t.name), '[]'::jsonb)
      FROM operations.order_templates t WHERE t.is_active = true AND t.meal_type IN ('Lunch', 'Dinner')
    )
  )
  WHERE EXISTS (SELECT 1 FROM operations.clients WHERE portal_token = p_token AND is_active = true);
$$;

-- ── portal_submit_order: crea/edita el pedido de la semana vigente (RF-PC-04/05/07) ──
CREATE OR REPLACE FUNCTION operations.portal_submit_order(p_token uuid, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
AS $$
DECLARE
  v_client operations.clients%ROWTYPE;
  v_now timestamp := (now() AT TIME ZONE 'America/Costa_Rica');
  v_dow int := extract(dow from v_now);
  v_is_early boolean := v_dow IN (1, 2);
  v_diff int := CASE WHEN v_dow = 0 THEN -6 ELSE 1 - v_dow END;
  v_monday date := (v_now::date) + v_diff + (CASE WHEN v_is_early THEN 0 ELSE 7 END);
  v_sunday date := v_monday + 6;
  v_tuesday_delivery date := CASE WHEN v_is_early THEN v_monday + 1 ELSE NULL END;
  v_classification text;
  v_order_id bigint;
  v_protein int;
  v_carb int;
  v_macro_profile_snapshot_id bigint;
  v_day jsonb;
  v_day_of_week text;
  v_delivery_date date;
  v_order_day_id bigint;
  v_detail jsonb;
  v_skipped_days text[] := '{}';
  v_applied_days text[] := '{}';
BEGIN
  SELECT * INTO v_client FROM operations.clients WHERE portal_token = p_token AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  v_classification := CASE WHEN v_client.client_type = 'family' THEN 'Family' ELSE p_payload->>'classification' END;

  -- Snapshot de macros: mismo criterio que AddOrder.jsx — todo lo que no sea
  -- 'Dinner' (incluido 'Family', que no edita macros pero sí las graba) usa
  -- el macro de almuerzo del cliente.
  IF v_classification = 'Dinner' THEN
    SELECT protein_value, carb_value INTO v_protein, v_carb
      FROM operations.macro_profiles WHERE id_macro_profile = v_client.dinner_macro_profile_id;
    v_macro_profile_snapshot_id := v_client.dinner_macro_profile_id;
  ELSE
    SELECT protein_value, carb_value INTO v_protein, v_carb
      FROM operations.macro_profiles WHERE id_macro_profile = v_client.lunch_macro_profile_id;
    v_macro_profile_snapshot_id := v_client.lunch_macro_profile_id;
  END IF;

  -- Reusa el pedido de esta semana si ya existe (edición), si no crea uno nuevo.
  SELECT id_order INTO v_order_id FROM operations.orders
    WHERE client_id = v_client.id_client AND week_start_date = v_monday
    ORDER BY id_order DESC LIMIT 1;

  IF v_order_id IS NULL THEN
    INSERT INTO operations.orders (
      client_id, week_start_date, week_end_date, route_id, classification, status,
      macro_profile_snapshot_id, protein_snapshot, carb_snapshot, created_via
    ) VALUES (
      v_client.id_client, v_monday, v_sunday, v_client.route_id, v_classification, 'PENDING',
      v_macro_profile_snapshot_id, v_protein, v_carb, 'portal'
    ) RETURNING id_order INTO v_order_id;
  ELSE
    UPDATE operations.orders SET
      classification = v_classification,
      route_id = v_client.route_id,
      macro_profile_snapshot_id = v_macro_profile_snapshot_id,
      protein_snapshot = v_protein,
      carb_snapshot = v_carb
    WHERE id_order = v_order_id;
  END IF;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_payload->'days')
  LOOP
    v_day_of_week := v_day->>'day_of_week';
    v_delivery_date := (v_day->>'delivery_date')::date;
    IF v_tuesday_delivery IS NOT NULL THEN
      v_delivery_date := v_tuesday_delivery;
    END IF;

    -- Corte server-side (RF-PC-05) — no confía en el `is_editable` que ya
    -- vio el frontend, lo recalcula acá antes de tocar cualquier dato.
    IF (v_delivery_date - 1 + time '23:59') <= v_now THEN
      v_skipped_days := array_append(v_skipped_days, v_day_of_week);
      CONTINUE;
    END IF;

    SELECT id_order_day INTO v_order_day_id FROM operations.order_days
      WHERE order_id = v_order_id AND day_of_week = v_day_of_week;

    IF v_order_day_id IS NOT NULL THEN
      -- Mismo patrón delete+reinsert que EditOrder.jsx.
      DELETE FROM operations.order_day_recipe_overrides
        WHERE order_day_detail_id IN (
          SELECT id_order_day_detail FROM operations.order_day_details WHERE order_day_id = v_order_day_id
        );
      DELETE FROM operations.order_day_details WHERE order_day_id = v_order_day_id;
      UPDATE operations.order_days SET delivery_date = v_delivery_date, status = 'PENDING'
        WHERE id_order_day = v_order_day_id;
    ELSE
      INSERT INTO operations.order_days (order_id, day_of_week, delivery_date, status)
        VALUES (v_order_id, v_day_of_week, v_delivery_date, 'PENDING')
        RETURNING id_order_day INTO v_order_day_id;
    END IF;

    FOR v_detail IN SELECT * FROM jsonb_array_elements(v_day->'details')
    LOOP
      INSERT INTO operations.order_day_details (order_day_id, recipe_id, quantity, protein_value_applied, carb_value_applied)
      VALUES (
        v_order_day_id,
        (v_detail->>'recipe_id')::bigint,
        coalesce((v_detail->>'quantity')::int, 1),
        v_protein,
        v_carb
      );
    END LOOP;

    v_applied_days := array_append(v_applied_days, v_day_of_week);
  END LOOP;

  RETURN jsonb_build_object(
    'id_order', v_order_id,
    'applied_days', to_jsonb(v_applied_days),
    'skipped_days', to_jsonb(v_skipped_days)
  );
END;
$$;

REVOKE ALL ON FUNCTION operations.portal_get_client(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION operations.portal_get_current_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION operations.portal_get_menu_options(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION operations.portal_submit_order(uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION operations.portal_get_client(uuid) TO anon;
GRANT EXECUTE ON FUNCTION operations.portal_get_current_order(uuid) TO anon;
GRANT EXECUTE ON FUNCTION operations.portal_get_menu_options(uuid) TO anon;
GRANT EXECUTE ON FUNCTION operations.portal_submit_order(uuid, jsonb) TO anon;
