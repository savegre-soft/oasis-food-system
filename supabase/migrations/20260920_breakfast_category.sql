-- Categoría "Desayuno" (Breakfast) — nuevo tiempo de comida junto a Lunch/Dinner.
--
-- Cambios:
--  1. clients.breakfast_macro_profile_id (nullable, FK a macro_profiles): perfil de
--     macros de desayuno del cliente. Es opcional: los clientes existentes no lo
--     tienen y el asistente de pedidos cae a macros estándar si falta.
--  2. portal_template_overrides.meal_type acepta 'Breakfast'.
--  3. order_day_details.meal_type acepta 'Breakfast' (solo si esa columna/constraint
--     existe en este ambiente; se ajusta de forma condicional).
--  4. Los pedidos pueden combinar 1, 2 o los 3 tiempos de comida: orders.classification
--     usa 'both' (Almuerzo + Cena, legado) o tiempos unidos por '+' en orden canónico
--     Breakfast, Lunch, Dinner (ej. 'Breakfast+Lunch+Dinner').
--  5. portal_get_client / portal_get_menu_options / portal_submit_order entienden
--     'Breakfast' (macros, plantilla semanal resuelta y snapshot del pedido).
--
-- orders.classification y order_templates.meal_type / recipes.meal_type son varchar
-- sin CHECK, por lo que no requieren cambios de esquema.
-- Idempotente: se puede correr más de una vez.

ALTER TABLE operations.clients
  ADD COLUMN IF NOT EXISTS breakfast_macro_profile_id bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_breakfast_macro_profile_id_fkey'
  ) THEN
    ALTER TABLE operations.clients
      ADD CONSTRAINT clients_breakfast_macro_profile_id_fkey
      FOREIGN KEY (breakfast_macro_profile_id)
      REFERENCES operations.macro_profiles(id_macro_profile);
  END IF;
END $$;

ALTER TABLE operations.portal_template_overrides
  DROP CONSTRAINT IF EXISTS portal_template_overrides_meal_type_check;
ALTER TABLE operations.portal_template_overrides
  ADD CONSTRAINT portal_template_overrides_meal_type_check
  CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_day_details_meal_type_check'
  ) THEN
    ALTER TABLE operations.order_day_details DROP CONSTRAINT order_day_details_meal_type_check;
    ALTER TABLE operations.order_day_details
      ADD CONSTRAINT order_day_details_meal_type_check
      CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner') OR meal_type IS NULL);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION operations.portal_get_client(p_token uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'operations', 'pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'name', c.name,
    'client_type', c.client_type,
    'plan_type', c.plan_type,
    'lunch_macro', CASE WHEN c.client_type = 'family' THEN NULL ELSE
      (SELECT jsonb_build_object('protein_value', mp.protein_value, 'carb_value', mp.carb_value)
       FROM operations.macro_profiles mp WHERE mp.id_macro_profile = c.lunch_macro_profile_id)
    END,
    'breakfast_macro', CASE WHEN c.client_type = 'family' THEN NULL ELSE
      (SELECT jsonb_build_object('protein_value', mp.protein_value, 'carb_value', mp.carb_value)
       FROM operations.macro_profiles mp WHERE mp.id_macro_profile = c.breakfast_macro_profile_id)
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
$function$;

CREATE OR REPLACE FUNCTION operations.portal_get_menu_options(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'operations', 'pg_temp'
AS $function$
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
  v_breakfast_template_id bigint;
  v_lunch_template_id bigint;
  v_dinner_template_id bigint;
  v_result jsonb;
BEGIN
  SELECT id_client INTO v_client_id FROM operations.clients WHERE portal_token = p_token AND is_active = true;
  IF v_client_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT template_id INTO v_breakfast_template_id FROM operations.portal_template_overrides
    WHERE week_start_date = v_monday AND meal_type = 'Breakfast';
  IF v_breakfast_template_id IS NULL THEN
    SELECT id_template INTO v_breakfast_template_id FROM operations.order_templates
      WHERE week_of_month = v_week_of_month AND meal_type = 'Breakfast' AND is_active = true
      ORDER BY id_template DESC LIMIT 1;
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
      FROM operations.order_templates t WHERE t.is_active = true AND t.meal_type IN ('Breakfast', 'Lunch', 'Dinner')
    ),
    'resolved_templates', jsonb_build_object(
      'Breakfast', CASE WHEN v_breakfast_template_id IS NULL THEN NULL ELSE operations.portal_template_json(v_breakfast_template_id) END,
      'Lunch', CASE WHEN v_lunch_template_id IS NULL THEN NULL ELSE operations.portal_template_json(v_lunch_template_id) END,
      'Dinner', CASE WHEN v_dinner_template_id IS NULL THEN NULL ELSE operations.portal_template_json(v_dinner_template_id) END
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION operations.portal_submit_order(p_token uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'operations', 'pg_temp'
AS $function$
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
  v_snapshot_meal text;
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

  -- classification puede ser un tiempo ('Breakfast'|'Lunch'|'Dinner'), 'both'
  -- (Almuerzo + Cena, legado) o una combinación con '+' (ej. 'Breakfast+Lunch').
  -- El snapshot de macros del pedido corresponde al primer tiempo de comida.
  v_snapshot_meal := CASE
    WHEN v_classification = 'both' THEN 'Lunch'
    ELSE split_part(v_classification, '+', 1)
  END;

  IF v_snapshot_meal = 'Dinner' THEN
    SELECT protein_value, carb_value INTO v_protein, v_carb
      FROM operations.macro_profiles WHERE id_macro_profile = v_client.dinner_macro_profile_id;
    v_macro_profile_snapshot_id := v_client.dinner_macro_profile_id;
  ELSIF v_snapshot_meal = 'Breakfast' THEN
    SELECT protein_value, carb_value INTO v_protein, v_carb
      FROM operations.macro_profiles WHERE id_macro_profile = v_client.breakfast_macro_profile_id;
    v_macro_profile_snapshot_id := v_client.breakfast_macro_profile_id;
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
$function$;
