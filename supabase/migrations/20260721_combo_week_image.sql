-- Imagen generada por IA para el combo de la semana ─────────────────────────
ALTER TABLE operations.combo_weeks
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_generated_at timestamptz;

-- Bucket público donde la Edge Function sube la imagen generada.
-- Es público para que la URL sea legible sin políticas RLS adicionales;
-- solo la Edge Function (con la service role key) puede escribir en él.
INSERT INTO storage.buckets (id, name, public)
VALUES ('combo-images', 'combo-images', true)
ON CONFLICT (id) DO NOTHING;
