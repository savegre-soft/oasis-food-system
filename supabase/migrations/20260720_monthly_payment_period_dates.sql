-- Los pagos 'monthly' pasan a registrar el PERÍODO que cubren (period_start_date /
-- period_end_date, calculado automáticamente: inicio = fecha de creación, fin =
-- inicio + 30 días) en vez de depender de payment_date para eso.
--
-- payment_date ahora representa exclusivamente la fecha en que el pago se cobró
-- de verdad: se llena sola si el pago se crea como 'paid', queda en blanco si se
-- crea 'pending', y se completa cuando el pago pasa a 'paid' desde la sección de
-- Ingresos. Por eso payment_date deja de ser NOT NULL.
--
-- Alcance: solo pagos payment_type='monthly'. weekly/express/other no cambian.

ALTER TABLE operations.payments
  ADD COLUMN IF NOT EXISTS period_start_date DATE,
  ADD COLUMN IF NOT EXISTS period_end_date DATE;

COMMENT ON COLUMN operations.payments.period_start_date IS
  'Solo payment_type=monthly. Inicio del período que cubre el pago (hasta 4 órdenes).';
COMMENT ON COLUMN operations.payments.period_end_date IS
  'Solo payment_type=monthly. Fin del período que cubre el pago (inicio + 30 días).';

-- Backfill retroactivo de pagos monthly existentes, a partir de su payment_date actual.
UPDATE operations.payments
SET period_start_date = payment_date,
    period_end_date = payment_date + INTERVAL '30 days'
WHERE payment_type = 'monthly'
  AND period_start_date IS NULL
  AND payment_date IS NOT NULL;

-- payment_date ahora puede quedar en blanco para pagos monthly pending recién creados.
ALTER TABLE operations.payments ALTER COLUMN payment_date DROP NOT NULL;
