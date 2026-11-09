-- Rollback de las 3 migraciones del centro de notificaciones + cotizaciones
-- de eventos aplicadas en producción el 2026-11-08:
--   1. 20261108_notifications_center.sql
--   2. 20261108_event_quotes.sql
--   3. 20261108_notifications_payment_period_triggers.sql
--
-- Antes de aplicarlas se confirmó por consulta directa que NINGUNO de estos
-- objetos existía ya en producción (tablas, funciones y constraint
-- notifications_type_check), así que este rollback no destruye nada previo:
-- solo deshace exactamente lo que esas 3 migraciones agregaron.
--
-- CÓMO USAR: correr este archivo completo contra producción (Management API
-- o psql) si hace falta deshacer el feature. Es seguro de re-correr
-- (todo con IF EXISTS). No toca operations.payments ni ninguna tabla
-- preexistente — solo lee de ellas, nunca las modifica.
--
-- Orden: primero lo que depende de lo demás (cron, triggers, funciones),
-- al final las tablas base.

-- ── pg_cron: los 3 jobs de notify_* (Fase pagos/periodo) ───────────────────────
SELECT cron.unschedule('notify-pending-payments-daily');
SELECT cron.unschedule('notify-period-open-thursday');
SELECT cron.unschedule('notify-period-close-saturday');

-- ── Funciones de notify_* (pagos/periodo) ──────────────────────────────────────
DROP FUNCTION IF EXISTS operations.notify_pending_payments();
DROP FUNCTION IF EXISTS operations.notify_period_open();
DROP FUNCTION IF EXISTS operations.notify_period_close();

-- ── Trigger + función de cotizaciones de eventos ────────────────────────────────
DROP TRIGGER IF EXISTS event_quotes_notify_staff ON operations.event_quotes;
DROP FUNCTION IF EXISTS operations.notify_new_event_quote();

-- ── Tabla de cotizaciones de eventos ─────────────────────────────────────────────
DROP TABLE IF EXISTS operations.event_quotes;

-- ── Centro de notificaciones (tablas base) ──────────────────────────────────────
-- notification_reads primero por el FK hacia notifications.
DROP TABLE IF EXISTS operations.notification_reads;
DROP TABLE IF EXISTS operations.notifications;

-- Nota: no se hace DROP EXTENSION pg_cron — si ya estaba instalada por otra
-- razón, o si se vuelve a necesitar luego, es más seguro dejarla. Si se
-- confirma que esta fue la única usuaria, se puede quitar aparte con:
--   DROP EXTENSION IF EXISTS pg_cron;
