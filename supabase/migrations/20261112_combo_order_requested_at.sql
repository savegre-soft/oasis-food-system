-- Un pedido de combo hasta ahora solo quedaba ligado a la semana del combo
-- (combo_week_id -> un rango de fechas), sin registrar la fecha real en que
-- el cliente hizo la solicitud. Eso importa para estadísticas: cuando el
-- pago de ese pedido se marca "Pagado" más adelante, el ingreso debe
-- contabilizarse en la fecha en que se solicitó, no en la fecha en que se
-- marcó pagado (ver también el fix de payments.payment_date en Payments.jsx).
ALTER TABLE operations.combo_orders
  ADD COLUMN IF NOT EXISTS requested_at date NOT NULL DEFAULT CURRENT_DATE;

-- Backfill: para pedidos ya existentes, lo más cercano a la fecha real de
-- solicitud es la fecha de creación del registro.
UPDATE operations.combo_orders SET requested_at = created_at::date;
