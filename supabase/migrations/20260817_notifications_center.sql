-- Centro de notificaciones (campanita en NavBar). Tres disparadores:
--   1) pago pendiente 4+ días desde created_at (operations.payments)
--   2) apertura del periodo semanal de pedidos (jueves 00:00 CR) — informativo,
--      no bloquea ni valida nada del flujo de AddOrder.jsx/OrderAdjustments.jsx
--   3) cierre del periodo semanal (sábado 12:00 CR) — señal para ver/imprimir
--      el resumen de producción de esa semana (ProductionPrintReport.jsx)
--
-- Filtrado por rol resuelto en RLS reutilizando operations.user_has_role(text[])
-- (ya existe en 20260704_rls_policies.sql) — el frontend nunca necesita saber
-- el rol del usuario actual, solo consulta esta tabla y Postgres filtra.
--
-- emailed_at queda reservado sin usar todavía: cuando se agregue envío por
-- correo (fase futura, falta elegir proveedor), un job aparte hará
-- UPDATE ... SET emailed_at = now() después de enviar — es aditivo, no
-- requiere tocar este esquema.
--
-- Safe to re-run: tablas con IF NOT EXISTS, políticas con DROP+CREATE,
-- funciones con CREATE OR REPLACE, cron.schedule con job_name existente
-- actualiza el schedule en vez de duplicar.

CREATE TABLE IF NOT EXISTS operations.notifications (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type         text NOT NULL CHECK (type IN ('payment_pending', 'period_open', 'period_close')),
  title        text NOT NULL,
  message      text NOT NULL,
  target_roles text[] NOT NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key   text NOT NULL,
  emailed_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dedupe_key)
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON operations.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_target_roles_idx
  ON operations.notifications USING gin (target_roles);

ALTER TABLE operations.notifications ENABLE ROW LEVEL SECURITY;

-- Solo lectura de las notificaciones cuyo target_roles cruza con los roles
-- del usuario actual. Sin política de INSERT/UPDATE/DELETE para `authenticated`
-- a propósito: las filas solo las crean las 3 funciones SECURITY DEFINER de abajo.
DROP POLICY IF EXISTS notifications_select_by_role ON operations.notifications;
CREATE POLICY notifications_select_by_role ON operations.notifications
  FOR SELECT TO authenticated
  USING (operations.user_has_role(target_roles));

-- ── Leído por usuario ─────────────────────────────────────────────────────────
-- Varios miembros del mismo rol deben tener leído/no-leído independiente:
-- "no leída" = ausencia de fila en esta tabla para (notification_id, auth.uid()).

CREATE TABLE IF NOT EXISTS operations.notification_reads (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notification_id bigint NOT NULL REFERENCES operations.notifications(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

ALTER TABLE operations.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_reads_own_select ON operations.notification_reads;
CREATE POLICY notification_reads_own_select ON operations.notification_reads
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_reads_own_insert ON operations.notification_reads;
CREATE POLICY notification_reads_own_insert ON operations.notification_reads
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM operations.notifications n
      WHERE n.id = notification_id AND operations.user_has_role(n.target_roles)
    )
  );

-- ── 1) Pago pendiente 4+ días ─────────────────────────────────────────────────
-- Notifica una sola vez por pago (dedupe_key = payment_pending:<id_payment>):
-- si el pago se marca 'paid' y luego alguien lo reabre a 'pending', esta v1
-- NO vuelve a notificar (mismo id_payment => mismo dedupe_key). Trade-off
-- deliberado por simplicidad.
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
