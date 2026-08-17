-- Sitio público v2, Fase 3 (docs/v2/02_REQUERIMIENTOS_SITIO_PUBLICO.md).
--
-- `leads`: tabla común para el formulario de contacto general y el
-- formulario único de "interesados" (CTA "Ordenar" del sitio público),
-- distinguidos por `source`. Solo INSERT anónimo (RNF-PUB-01) — sin SELECT
-- ni UPDATE público, el equipo la gestiona desde la bandeja interna
-- "Prospectos" con sesión (`authenticated`).
--
-- `promotions`: reemplaza el array hardcodeado de /promociones. Lectura
-- anónima solo de las activas (para la página pública), CRUD completo desde
-- el panel interno.

CREATE TABLE IF NOT EXISTS operations.leads (
  id_lead              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                 text NOT NULL,
  phone                text,
  email                text,
  message              text,
  source               text NOT NULL DEFAULT 'interesado', -- 'contacto' | 'interesado'
  status               text NOT NULL DEFAULT 'new',        -- 'new' | 'contacted' | 'discarded' | 'converted'
  converted_client_id  bigint REFERENCES operations.clients(id_client),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operations.promotions (
  id_promotion   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title          text NOT NULL,
  description    text,
  price_label    text,
  badge          text,
  image_url      text,
  is_active      boolean NOT NULL DEFAULT true,
  display_order  integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── RLS: leads — insert-only anónimo, gestión completa solo staff ───────────
ALTER TABLE operations.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_anon_insert ON operations.leads;
CREATE POLICY leads_anon_insert ON operations.leads
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS leads_authenticated_all ON operations.leads;
CREATE POLICY leads_authenticated_all ON operations.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── RLS: promotions — lectura anónima de activas, CRUD solo staff ───────────
ALTER TABLE operations.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promotions_anon_select ON operations.promotions;
CREATE POLICY promotions_anon_select ON operations.promotions
  FOR SELECT TO anon USING (is_active = true);
DROP POLICY IF EXISTS promotions_authenticated_all ON operations.promotions;
CREATE POLICY promotions_authenticated_all ON operations.promotions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Storage: imágenes de promoción, público de solo lectura ─────────────────
-- Público para que la URL sea legible sin políticas RLS adicionales de
-- lectura (mismo criterio que combo-images); solo `authenticated` puede
-- subir/reemplazar objetos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('promotion-images', 'promotion-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS promotion_images_authenticated_write ON storage.objects;
CREATE POLICY promotion_images_authenticated_write ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'promotion-images');
DROP POLICY IF EXISTS promotion_images_authenticated_update ON storage.objects;
CREATE POLICY promotion_images_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'promotion-images');
