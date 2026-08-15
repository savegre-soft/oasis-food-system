-- El cliente ahora puede personalizar la composición de ingredientes de
-- cada receta en el portal (antes solo lo hacía el staff). portal_submit_order
-- acepta un campo opcional `ingredients_override` por detalle
-- ({protein:[...], carb:[...], extra:[...]} | null) y lo persiste en
-- operations.order_day_recipe_overrides, mismo patrón que ya usa AddOrder.jsx
-- internamente (name + category por ingrediente).
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
  v_detail_id bigint;
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

  IF v_classification = 'Dinner' THEN
    SELECT protein_value, carb_value INTO v_protein, v_carb
      FROM operations.macro_profiles WHERE id_macro_profile = v_client.dinner_macro_profile_id;
    v_macro_profile_snapshot_id := v_client.dinner_macro_profile_id;
  ELSE
    SELECT protein_value, carb_value INTO v_protein, v_carb
      FROM operations.macro_profiles WHERE id_macro_profile = v_client.lunch_macro_profile_id;
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
      INSERT INTO operations.order_day_details (order_day_id, recipe_id, quantity, protein_value_applied, carb_value_applied)
      VALUES (
        v_order_day_id,
        (v_detail->>'recipe_id')::bigint,
        coalesce((v_detail->>'quantity')::int, 1),
        v_protein,
        v_carb
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
