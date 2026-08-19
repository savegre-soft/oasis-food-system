-- Permite "marcar como no leída": el usuario borra su propia fila de
-- notification_reads (ausencia de fila = no leída, mismo criterio ya usado
-- por SELECT/INSERT). Sin esta política, DELETE quedaba implícitamente
-- denegado por RLS (ninguna política de FOR DELETE existía todavía).
DROP POLICY IF EXISTS notification_reads_own_delete ON operations.notification_reads;
CREATE POLICY notification_reads_own_delete ON operations.notification_reads
  FOR DELETE TO authenticated USING (user_id = auth.uid());
