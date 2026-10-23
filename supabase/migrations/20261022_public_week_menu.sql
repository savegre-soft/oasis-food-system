-- ============================================================================
-- Menú semanal público: lectura anónima (sitio público /menu)
-- ============================================================================
-- El "menú de la semana" se arma desde las plantillas semanales:
--   order_templates  ->  order_template_days  ->  order_template_details  ->  recipes
-- La plantilla efectiva de cada semana/tiempo de comida se resuelve con:
--   portal_template_overrides (override puntual por semana)  ó  la plantilla
--   automática por week_of_month.
--
-- Hoy esas tablas tienen RLS y SOLO el rol `authenticated` (staff) puede leerlas;
-- el sitio público usa la `anon key`, por lo que no puede verlas. `recipes` ya es
-- pública (ver recipes_anon_select en 20260704_rls_policies.sql).
--
-- Esta migración da lectura anónima a las tablas del menú semanal. No exponen
-- datos sensibles (día de la semana, recipe_id, cantidad, nombre de plantilla);
-- es exactamente lo que queremos mostrar en público. Las escrituras siguen
-- restringidas a `authenticated` por las políticas existentes.
-- Idempotente: se puede correr varias veces sin efectos adversos.
-- ============================================================================

-- Acceso del rol anónimo al esquema y a las tablas (por si aún no estuviera).
GRANT USAGE ON SCHEMA operations TO anon;
GRANT SELECT ON operations.order_templates TO anon;
GRANT SELECT ON operations.order_template_days TO anon;
GRANT SELECT ON operations.order_template_details TO anon;
GRANT SELECT ON operations.portal_template_overrides TO anon;

-- --- order_templates: solo plantillas activas -------------------------------
ALTER TABLE operations.order_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_templates_anon_select ON operations.order_templates;
CREATE POLICY order_templates_anon_select ON operations.order_templates
  FOR SELECT TO anon USING (is_active = true);

-- --- order_template_days: días de cada plantilla ----------------------------
ALTER TABLE operations.order_template_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_template_days_anon_select ON operations.order_template_days;
CREATE POLICY order_template_days_anon_select ON operations.order_template_days
  FOR SELECT TO anon USING (true);

-- --- order_template_details: recetas y cantidades por día -------------------
ALTER TABLE operations.order_template_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_template_details_anon_select ON operations.order_template_details;
CREATE POLICY order_template_details_anon_select ON operations.order_template_details
  FOR SELECT TO anon USING (true);

-- --- portal_template_overrides: override de plantilla por semana ------------
ALTER TABLE operations.portal_template_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS portal_template_overrides_anon_select ON operations.portal_template_overrides;
CREATE POLICY portal_template_overrides_anon_select ON operations.portal_template_overrides
  FOR SELECT TO anon USING (true);
