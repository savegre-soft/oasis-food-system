-- Introduces a real 3-state payment status model: pending / paid / cancelled.
--
-- Historically this app only had 'pending' and 'cancelled', and staff used
-- 'cancelled' as a stand-in for "already paid" (there was no dedicated
-- "paid" status). This migration:
--   1. Drops the existing payments_status_check constraint (it only
--      allowed pending/cancelled, which is why the relabel UPDATE below
--      failed the first time this was attempted).
--   2. Relabels every existing 'cancelled' row to 'paid', since that's what
--      it actually meant in practice.
--   3. Re-adds the CHECK constraint with the new 3-value set, so 'cancelled'
--      is free to mean an actual cancellation from now on and invalid
--      values still can't sneak in.
--
-- After this runs, the app code (already updated alongside this migration)
-- writes 'pending' | 'paid' | 'cancelled'.
--
-- Safe to re-run: dropping a nonexistent constraint and an UPDATE that
-- matches zero rows are both no-ops.

-- Drop the existing status CHECK constraint, whatever it's named, so the
-- relabel below isn't rejected by the old pending/cancelled-only rule.
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'operations.payments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE operations.payments DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

UPDATE operations.payments
SET status = 'paid'
WHERE status = 'cancelled';

ALTER TABLE operations.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'cancelled'));
