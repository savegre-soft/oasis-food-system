-- Permite "cerrar" manualmente un pago mensual desde Ingresos aunque no tenga
-- las 4 órdenes completas (ej. el cliente no va a usar los cupos restantes
-- este período). Un pago cerrado deja de ofrecerse para reutilizar en el
-- asistente de pedidos, sin importar cuántas órdenes tenga vinculadas.
--
-- No reemplaza period_end_date (que sigue representando cuándo vence el
-- período naturalmente) — closed_at registra que se cerró antes, a mano, y
-- cuándo.

ALTER TABLE operations.payments
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

COMMENT ON COLUMN operations.payments.closed_at IS
  'Solo payment_type=monthly. Si no es NULL, el pago se cerró manualmente desde Ingresos antes de completar las 4 órdenes y ya no se ofrece para reutilizar.';
