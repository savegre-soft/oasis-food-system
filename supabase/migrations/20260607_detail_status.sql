-- Per-detail status tracking so 'ambos' orders can be packed independently.
-- Each order_day_detail gets its own status; a trigger keeps order_days.status
-- in sync so existing queries filtering by order_day.status still work.

ALTER TABLE operations.order_day_details
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING';

-- Seed existing rows from their parent order_day
UPDATE operations.order_day_details d
SET    status = od.status
FROM   operations.order_days od
WHERE  d.order_day_id = od.id_order_day;

-- ── Trigger: sync order_day.status whenever a detail changes ─────────────────

CREATE OR REPLACE FUNCTION operations.sync_order_day_status_from_details()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_oid        BIGINT;
  v_total      INTEGER;
  v_delivered  INTEGER;
  v_pending    INTEGER;
  v_new_status TEXT;
BEGIN
  v_oid := COALESCE(NEW.order_day_id, OLD.order_day_id);

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'DELIVERED'),
    COUNT(*) FILTER (WHERE status = 'PENDING')
  INTO v_total, v_delivered, v_pending
  FROM operations.order_day_details
  WHERE order_day_id = v_oid;

  IF v_total = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- DELIVERED only when every detail is delivered
  -- PACKED when none are pending (some may already be delivered)
  -- PENDING otherwise
  IF v_delivered = v_total THEN
    v_new_status := 'DELIVERED';
  ELSIF v_pending > 0 THEN
    v_new_status := 'PENDING';
  ELSE
    v_new_status := 'PACKED';
  END IF;

  UPDATE operations.order_days
  SET    status = v_new_status
  WHERE  id_order_day = v_oid
    AND  status IS DISTINCT FROM v_new_status;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_day_status ON operations.order_day_details;
CREATE TRIGGER trg_sync_order_day_status
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON   operations.order_day_details
  FOR EACH ROW
  EXECUTE FUNCTION operations.sync_order_day_status_from_details();
