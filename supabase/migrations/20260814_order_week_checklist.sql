-- Checklist semanal para pedidos regulares: no todos los clientes activos
-- piden todas las semanas, pero el staff sabe quién sí — esta tabla persiste
-- esa decisión por semana/cliente para poder llevar seguimiento de a quién
-- ya se le envió el link del portal (clients.portal_token).

CREATE TABLE IF NOT EXISTS operations.order_week_checklist (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_start_date  date NOT NULL,
  client_id        bigint NOT NULL REFERENCES operations.clients(id_client),
  should_send      boolean NOT NULL DEFAULT true,
  link_sent_at     timestamptz,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start_date, client_id)
);

ALTER TABLE operations.order_week_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_week_checklist_authenticated_all ON operations.order_week_checklist;
CREATE POLICY order_week_checklist_authenticated_all ON operations.order_week_checklist
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
