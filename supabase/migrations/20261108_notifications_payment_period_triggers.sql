-- Completa el centro de notificaciones (20261108_notifications_center.sql)
-- con los 3 disparadores de Fase_2 que se habían dejado fuera a propósito
-- (pertenecían a ese trabajo, no al de cotizaciones de eventos). El tipo
-- 'quote_request' ya cubre su propio trigger en 20261108_event_quotes.sql;
-- esta migración solo agrega las funciones y el cron de los otros 3 tipos,
-- que ya estaban permitidos por el CHECK de notifications_type_check.
--
--   1) pago pendiente 4+ días desde created_at (operations.payments)
--   2) apertura del periodo semanal de pedidos (jueves 00:00 CR) — informativo,
--      no bloquea ni valida nada del flujo de AddOrder.jsx/OrderAdjustments.jsx
--   3) cierre del periodo semanal (sábado 12:00 CR) — señal para ver/imprimir
--      el resumen de producción de esa semana (ProductionPrintReport.jsx)
--
-- Filtrado por rol resuelto en RLS reutilizando operations.user_has_role(text[])
-- (ya existe en 20260704_rls_policies.sql) — el frontend nunca necesita saber
-- el rol del usuario actual, solo consulta la tabla y Postgres filtra.
--
-- Safe to re-run: funciones con CREATE OR REPLACE, cron.schedule con
-- job_name existente actualiza el schedule en vez de duplicar.

-- ── 1) Pago pendiente 4+ días ─────────────────────────────────────────────────
-- Notifica una sola vez por pago (dedupe_key = payment_pending:<id_payment>):
-- si el pago se marca 'paid' y luego alguien lo reabre a 'pending', esta v1
-- NO vuelve a notificar (mismo id_payment => mismo dedupe_key). Trade-off
-- deliberado por simplicidad, igual que en Fase_2.
CREATE OR REPLACE FUNCTION operations.notify_pending_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
AS $$
BEGIN
  INSERT INTO operations.notifications (type, title, message, target_roles, metadata, dedupe_key)
  SELECT
    'payment_pending',
    'Pago pendiente de cobro',
    'El pago de ' || c.name || ' por ' || p.currency || ' ' || p.amount ||
      ' sigue pendiente desde el ' ||
      to_char(p.created_at AT TIME ZONE 'America/Costa_Rica', 'DD/MM/YYYY') || '.',
    ARRAY['Administrador', 'Finanzas'],
    jsonb_build_object(
      'payment_id', p.id_payment, 'client_id', p.client_id,
      'amount', p.amount, 'currency', p.currency
    ),
    'payment_pending:' || p.id_payment
  FROM operations.payments p
  JOIN operations.clients c ON c.id_client = p.client_id
  WHERE p.status = 'pending'
    AND p.created_at <= now() - interval '4 days'
  ON CONFLICT (dedupe_key) DO NOTHING;
END;
$$;

-- ── 2) Apertura del periodo semanal ───────────────────────────────────────────
-- Corre jueves 00:00 CR. "La semana" = el próximo lunes.
CREATE OR REPLACE FUNCTION operations.notify_period_open()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
AS $$
DECLARE
  v_now     timestamp := (now() AT TIME ZONE 'America/Costa_Rica');
  v_monday  date := (v_now::date) + ((1 - extract(dow from v_now)::int + 7) % 7);
BEGIN
  INSERT INTO operations.notifications (type, title, message, target_roles, metadata, dedupe_key)
  VALUES (
    'period_open',
    'Se abrió la semana de pedidos',
    'Ya se puede gestionar el pedido de la semana del ' ||
      to_char(v_monday, 'DD/MM') || ' al ' || to_char(v_monday + 6, 'DD/MM') || '.',
    ARRAY['Administrador', 'Finanzas', 'Clientes'],
    jsonb_build_object('week_start_date', v_monday, 'week_end_date', v_monday + 6),
    'period_open:' || v_monday
  )
  ON CONFLICT (dedupe_key) DO NOTHING;
END;
$$;

-- ── 3) Cierre del periodo semanal ─────────────────────────────────────────────
-- Corre sábado 12:00 CR. Misma semana que abrió el jueves anterior.
-- Puramente informativo: no bloquea ni valida nada de AddOrder.jsx/OrderAdjustments.jsx,
-- el staff sigue pudiendo agregar/editar pedidos de esta semana después del cierre.
CREATE OR REPLACE FUNCTION operations.notify_period_close()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
AS $$
DECLARE
  v_now     timestamp := (now() AT TIME ZONE 'America/Costa_Rica');
  v_monday  date := (v_now::date) + ((1 - extract(dow from v_now)::int + 7) % 7);
BEGIN
  INSERT INTO operations.notifications (type, title, message, target_roles, metadata, dedupe_key)
  VALUES (
    'period_close',
    'Se cerró la semana de pedidos',
    'Ya se puede ver e imprimir el resumen de producción de la semana del ' ||
      to_char(v_monday, 'DD/MM') || ' al ' || to_char(v_monday + 6, 'DD/MM') || '.',
    ARRAY['Administrador', 'Finanzas', 'Clientes'],
    jsonb_build_object('week_start_date', v_monday, 'week_end_date', v_monday + 6),
    'period_close:' || v_monday
  )
  ON CONFLICT (dedupe_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION operations.notify_pending_payments() FROM PUBLIC;
REVOKE ALL ON FUNCTION operations.notify_period_open() FROM PUBLIC;
REVOKE ALL ON FUNCTION operations.notify_period_close() FROM PUBLIC;
-- Sin GRANT a authenticated/anon a propósito: solo las llama pg_cron (rol postgres).

-- ── pg_cron ────────────────────────────────────────────────────────────────────
-- Costa Rica es UTC-6 fijo, sin horario de verano, así que la conversión a UTC
-- para el cron expression es constante todo el año.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA cron TO postgres;

-- 00:10 CR todos los días = 06:10 UTC
SELECT cron.schedule(
  'notify-pending-payments-daily', '10 6 * * *',
  $$SELECT operations.notify_pending_payments();$$
);

-- Jueves 00:00 CR = 06:00 UTC (día 4 = jueves en cron, domingo=0)
SELECT cron.schedule(
  'notify-period-open-thursday', '0 6 * * 4',
  $$SELECT operations.notify_period_open();$$
);

-- Sábado 12:00 CR = 18:00 UTC (día 6 = sábado)
SELECT cron.schedule(
  'notify-period-close-saturday', '0 18 * * 6',
  $$SELECT operations.notify_period_close();$$
);
