-- Fase 1 de "Cotizaciones de eventos" (sección nueva en /contacto):
-- formulario público estructurado, visible dentro del sistema en una
-- pantalla nueva ("Cotizaciones", src/pages/EventQuotes.jsx). El envío de
-- correo al staff es Fase 2 de este mismo feature — por eso el trigger de
-- abajo ya deja la notificación en operations.notifications con
-- emailed_at NULL, lista para que un job futuro la envíe y marque la fecha.
--
-- No se modela como operations.leads (20260812_public_site_leads_promotions.sql)
-- porque los campos de una cotización de evento son estructurados y propios
-- (fecha/hora, lugar, dirección, tiempos de alimentación, presupuesto, tipo
-- de evento, vajilla) — guardarlos como texto libre en leads.message impediría
-- filtrar/reportar más adelante.

CREATE TABLE IF NOT EXISTS operations.event_quotes (
  id_event_quote    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              text NOT NULL,
  phone             text NOT NULL,
  event_datetime    timestamptz,
  event_place       text,
  event_address     text,
  guest_count       integer,
  meal_times        text[] NOT NULL DEFAULT '{}'::text[], -- Desayuno, Almuerzo, Café, Cena, Snacks/Meriendas, Brunch
  has_budget        boolean,
  budget_amount     numeric,
  event_type        text, -- Baby shower, Té de cocina, Boda, Fiesta, Evento corporativo, Otro
  event_type_other  text,
  needs_dishware    boolean,
  status            text NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'discarded' | 'converted'
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_quotes_created_at_idx
  ON operations.event_quotes (created_at DESC);

-- ── RLS: insert-only anónimo, gestión completa solo staff ──────────────────
-- Mismo criterio que operations.leads (20260812_leads_restrict_staff_access.sql).
ALTER TABLE operations.event_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_quotes_anon_insert ON operations.event_quotes;
CREATE POLICY event_quotes_anon_insert ON operations.event_quotes
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS event_quotes_staff_all ON operations.event_quotes;
CREATE POLICY event_quotes_staff_all ON operations.event_quotes
  FOR ALL TO authenticated
  USING (operations.user_has_role(ARRAY['Administrador', 'Clientes']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador', 'Clientes']));

-- ── Notificación al staff (campanita) por cada cotización nueva ────────────
-- SECURITY DEFINER porque quien inserta es `anon` (sin permiso de escritura
-- sobre operations.notifications) — mismo patrón que las funciones de
-- notify_* de Fase_2, adaptado a trigger en vez de cron.
CREATE OR REPLACE FUNCTION operations.notify_new_event_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operations, pg_temp
AS $$
BEGIN
  INSERT INTO operations.notifications (type, title, message, target_roles, metadata, dedupe_key)
  VALUES (
    'quote_request',
    'Nueva cotización de evento',
    NEW.name || ' solicitó una cotización' ||
      CASE WHEN NEW.event_type IS NOT NULL THEN ' para ' || NEW.event_type ELSE '' END ||
      CASE WHEN NEW.guest_count IS NOT NULL THEN ' (' || NEW.guest_count || ' personas)' ELSE '' END || '.',
    ARRAY['Administrador', 'Clientes'],
    jsonb_build_object('event_quote_id', NEW.id_event_quote),
    'quote_request:' || NEW.id_event_quote
  )
  ON CONFLICT (dedupe_key) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION operations.notify_new_event_quote() FROM PUBLIC;

DROP TRIGGER IF EXISTS event_quotes_notify_staff ON operations.event_quotes;
CREATE TRIGGER event_quotes_notify_staff
  AFTER INSERT ON operations.event_quotes
  FOR EACH ROW EXECUTE FUNCTION operations.notify_new_event_quote();
