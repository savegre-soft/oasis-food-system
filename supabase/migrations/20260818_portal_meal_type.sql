-- Mismo bug que AddOrder.jsx/EditOrder.jsx (ver 20260818_order_day_details_meal_type.sql):
-- portal_submit_order resolvía v_protein/v_carb UNA sola vez para TODA la
-- orden (según v_classification) — un pedido 'both' del portal siempre caía
-- a las macros de almuerzo, incluso para el plato de cena, y no guardaba
-- ningún dato de tiempo de comida por detail. Se reescribe para resolver
-- ambos perfiles del cliente por adelantado y elegir el par correcto por
-- detail según su propio `meal_type` (recibido del frontend, con fallback a
-- la clasificación de la orden para compatibilidad con payloads viejos).

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
  v_lunch_protein int;
  v_lunch_carb int;
  v_dinner_protein int;
  v_dinner_carb int;
  v_macro_profile_snapshot_id bigint;
  v_day jsonb;
  v_day_of_week text;
  v_delivery_date date;
  v_order_day_id bigint;
  v_detail jsonb;
  v_detail_id bigint;
  v_detail_meal_type text;
  v_detail_protein int;
  v_detail_carb int;
  v_override jsonb;
  v_category text;
  v_ing_name text;
  v_skipped_days text[] := '{}';
  v_applied_days text[] := '{}';
BEGIN
  SELECT * INTO v_client FROM operations.clients WHERE portal_token = p_token AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  v_classification := CASE WHEN v_client.client_type = 'family' THEN 'Family' ELSE p_payload->>'classification' END;

  SELECT protein_value, carb_value INTO v_lunch_protein, v_lunch_carb
    FROM operations.macro_profiles WHERE id_macro_profile = v_client.lunch_macro_profile_id;
  SELECT protein_value, carb_value INTO v_dinner_protein, v_dinner_carb
    FROM operations.macro_profiles WHERE id_macro_profile = v_client.dinner_macro_profile_id;

  IF v_classification = 'Dinner' THEN
    v_protein := v_dinner_protein;
    v_carb := v_dinner_carb;
    v_macro_profile_snapshot_id := v_client.dinner_macro_profile_id;
  ELSE
    v_protein := v_lunch_protein;
    v_carb := v_lunch_carb;
    v_macro_profile_snapshot_id := v_client.lunch_macro_profile_id;
  END IF;

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

    IF (v_delivery_date - 1 + time '23:59') <= v_now THEN
      v_skipped_days := array_append(v_skipped_days, v_day_of_week);
      CONTINUE;
    END IF;

    SELECT id_order_day INTO v_order_day_id FROM operations.order_days
      WHERE order_id = v_order_id AND day_of_week = v_day_of_week;

    IF v_order_day_id IS NOT NULL THEN
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
      -- meal_type por detail: viene del frontend cuando la orden es 'both'
      -- (el cliente elige almuerzo/cena por receta, mismo toggle que usa el
      -- staff); si no viene (payload viejo, o pedido de un solo tiempo),
      -- cae a la clasificación general de la orden.
      v_detail_meal_type := NULLIF(v_detail->>'meal_type', '');
      IF v_detail_meal_type IS NULL THEN
        v_detail_meal_type := CASE WHEN v_classification = 'both' THEN 'Lunch' ELSE v_classification END;
      END IF;

      IF v_detail_meal_type = 'Dinner' THEN
        v_detail_protein := v_dinner_protein;
        v_detail_carb := v_dinner_carb;
      ELSE
        v_detail_protein := v_lunch_protein;
        v_detail_carb := v_lunch_carb;
      END IF;

      INSERT INTO operations.order_day_details (order_day_id, recipe_id, quantity, protein_value_applied, carb_value_applied, meal_type)
      VALUES (
        v_order_day_id,
        (v_detail->>'recipe_id')::bigint,
        coalesce((v_detail->>'quantity')::int, 1),
        v_detail_protein,
        v_detail_carb,
        CASE WHEN v_detail_meal_type IN ('Lunch', 'Dinner') THEN v_detail_meal_type ELSE NULL END
      )
      RETURNING id_order_day_detail INTO v_detail_id;

      v_override := v_detail->'ingredients_override';
      IF v_override IS NOT NULL AND v_override::text != 'null' THEN
        FOREACH v_category IN ARRAY ARRAY['protein', 'carb', 'extra']
        LOOP
          FOR v_ing_name IN SELECT jsonb_array_elements_text(coalesce(v_override->v_category, '[]'::jsonb))
          LOOP
            INSERT INTO operations.order_day_recipe_overrides (order_day_detail_id, name, category)
            VALUES (v_detail_id, v_ing_name, v_category);
          END LOOP;
        END LOOP;
      END IF;
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

-- portal_get_current_order: agrega meal_type por detail al leer un pedido
-- existente, para que el portal pueda precargar correctamente cuál receta
-- es de almuerzo y cuál de cena al reabrir/editar un pedido 'both' ya guardado.
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
            'quantity', d.quantity,
            'meal_type', d.meal_type
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
