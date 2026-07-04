-- Allow registering income that isn't tied to a client/order (e.g. one-off
-- sales, misc revenue). The app inserts these as payment_type = 'other'
-- with client_id = NULL and the description in `notes`.
-- Safe to re-run: DROP NOT NULL is a no-op if the column is already nullable.

ALTER TABLE operations.payments
  ALTER COLUMN client_id DROP NOT NULL;

-- If payment_type has a CHECK constraint restricting it to
-- monthly/weekly/express, drop it so 'other' (used for manual income) is
-- accepted too. No-op if no such constraint exists (payment_type is plain
-- TEXT in most environments, matching the rest of this schema's style).
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'operations.payments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%payment_type%'
  LOOP
    EXECUTE format('ALTER TABLE operations.payments DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;
