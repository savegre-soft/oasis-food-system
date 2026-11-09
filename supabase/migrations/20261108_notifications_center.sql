-- Centro de notificaciones (campanita en NavBar), portado desde la rama
-- Fase_2 (20260817_notifications_center.sql) recortado a lo que necesita
-- esta rama: no se traen los 3 disparadores de pagos/periodo semanal de
-- Fase_2 (pertenecen a ese trabajo, no a este feature). El único tipo que
-- esta rama produce es 'quote_request' (ver 20261108_event_quotes.sql).
--
-- emailed_at queda reservado sin usar todavía: cuando se agregue el envío de
-- correo al staff (Fase 2 de este feature de cotizaciones, falta elegir
-- proveedor), un job aparte hará UPDATE ... SET emailed_at = now() después de
-- enviar — es aditivo, no requiere tocar este esquema.
--
-- Safe to re-run: tabla con IF NOT EXISTS, políticas con DROP+CREATE.

CREATE TABLE IF NOT EXISTS operations.notifications (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type         text NOT NULL,
  title        text NOT NULL,
  message      text NOT NULL,
  target_roles text[] NOT NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key   text NOT NULL,
  emailed_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dedupe_key)
);

-- CHECK aparte (no inline) para poder reemplazarlo con ADD/DROP CONSTRAINT:
-- si esta tabla ya existía con otro conjunto de tipos (p.ej. la versión de
-- Fase_2 con payment_pending/period_open/period_close), este bloque la deja
-- aceptando también 'quote_request' en vez de fallar en silencio.
ALTER TABLE operations.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE operations.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('quote_request', 'payment_pending', 'period_open', 'period_close'));

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON operations.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_target_roles_idx
  ON operations.notifications USING gin (target_roles);

ALTER TABLE operations.notifications ENABLE ROW LEVEL SECURITY;

-- Solo lectura de las notificaciones cuyo target_roles cruza con los roles
-- del usuario actual. Sin política de INSERT/UPDATE/DELETE para `authenticated`
-- a propósito: las filas solo las crea el trigger de operations.event_quotes.
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

-- Permite "marcar como no leída": el usuario borra su propia fila (ausencia
-- de fila = no leída, mismo criterio que SELECT/INSERT arriba). Portado de
-- 20260818_notification_reads_delete_policy.sql de Fase_2.
DROP POLICY IF EXISTS notification_reads_own_delete ON operations.notification_reads;
CREATE POLICY notification_reads_own_delete ON operations.notification_reads
  FOR DELETE TO authenticated USING (user_id = auth.uid());
