-- Plantilla de etiqueta de producción, reemplazable desde el sistema sin
-- pedir un cambio de código: el staff puede subir un nuevo diseño de fondo
-- (mismo layout de campos, watermark distinto) desde Settings → Etiquetas.
-- Solo una fila puede estar activa a la vez (índice único parcial).

CREATE TABLE IF NOT EXISTS operations.label_templates (
  id_label_template  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  storage_path        text NOT NULL,
  image_url            text NOT NULL,
  is_active            boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid DEFAULT auth.uid()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_label_template
  ON operations.label_templates (is_active) WHERE is_active;

ALTER TABLE operations.label_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS label_templates_authenticated_all ON operations.label_templates;
CREATE POLICY label_templates_authenticated_all ON operations.label_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Storage: imágenes de plantilla, público de solo lectura ─────────────────
-- Mismo criterio que promotion-images/combo-images: público para que la URL
-- sea legible sin políticas RLS adicionales; solo `authenticated` sube/reemplaza.
-- La política de SELECT es necesaria además de INSERT/UPDATE: el upload con
-- `upsert:true` del cliente hace una verificación de existencia del objeto
-- que pasa por RLS de `storage.objects` (visto con Recipes, que sí la tiene)
-- — sin ella, el INSERT fallaba con "new row violates row-level security policy".
INSERT INTO storage.buckets (id, name, public)
VALUES ('label-templates', 'label-templates', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS label_templates_storage_authenticated_read ON storage.objects;
CREATE POLICY label_templates_storage_authenticated_read ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'label-templates');
DROP POLICY IF EXISTS label_templates_storage_authenticated_write ON storage.objects;
CREATE POLICY label_templates_storage_authenticated_write ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'label-templates');
DROP POLICY IF EXISTS label_templates_storage_authenticated_update ON storage.objects;
CREATE POLICY label_templates_storage_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'label-templates');
