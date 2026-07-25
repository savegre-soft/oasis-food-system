-- Nueva sección "Ventas Masivas": venta de un solo plato cocinado en lote
-- grande (ej. 50 porciones de arroz con pollo), distinta de Combos (que es
-- una selección por categorías) y de Órdenes (que es recurrente por cliente).
--
-- Modelo: un catálogo simple de platos con precio sugerido, un lote (cuánto
-- se cocinó, cuándo), y filas de venta dentro del lote (cantidad + monto,
-- cliente opcional). El sobrante se calcula: quantity_cooked - suma vendida.
-- Cada fila de venta también crea una fila en `payments` (payment_type =
-- 'bulk') para integrarse gratis con la reportería de Ingresos existente.

CREATE TABLE IF NOT EXISTS operations.bulk_dishes (
  id_bulk_dish     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name             text NOT NULL,
  suggested_price  numeric,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operations.bulk_sale_batches (
  id_bulk_sale_batch bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bulk_dish_id       bigint NOT NULL REFERENCES operations.bulk_dishes(id_bulk_dish),
  batch_date         date NOT NULL,
  quantity_cooked    numeric NOT NULL,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operations.bulk_sale_entries (
  id_bulk_sale_entry bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id           bigint NOT NULL REFERENCES operations.bulk_sale_batches(id_bulk_sale_batch) ON DELETE CASCADE,
  client_id          bigint REFERENCES operations.clients(id_client), -- opcional: venta anónima/general
  quantity           numeric NOT NULL,
  amount             numeric NOT NULL,
  payment_id         bigint REFERENCES operations.payments(id_payment),
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ── RLS: mismo patrón "abierto a cualquier autenticado" que combos ──────────
DO $$
DECLARE
  t text;
  open_tables text[] := ARRAY[
    'bulk_dishes', 'bulk_sale_batches', 'bulk_sale_entries'
  ];
BEGIN
  FOREACH t IN ARRAY open_tables LOOP
    EXECUTE format('ALTER TABLE operations.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON operations.%I', t || '_authenticated_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON operations.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t || '_authenticated_all', t
    );
  END LOOP;
END $$;
