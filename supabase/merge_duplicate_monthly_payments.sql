-- One-off cleanup for the 5 duplicate-monthly-payment groups found via
-- find_duplicate_monthly_payments.sql. For each group we keep the oldest
-- payment (by created_at), re-point its sibling orders to that payment via
-- payment_orders, then delete the now-redundant duplicate payment rows.
-- The monthly amount is a flat fee (not per-order), and every duplicate in
-- each group already has the same amount, so no amount adjustment is
-- needed on the survivor.
--
-- Run 20260705_payment_status_paid.sql first (relabels 'cancelled' -> 'paid')
-- so Karen/Daniela/Erick's rows read correctly afterward — order doesn't
-- change what this script does, but keeps the two changes conceptually in
-- sequence.
--
-- Review the id_payment numbers below against your own
-- find_duplicate_monthly_payments.sql output before running — they're
-- hardcoded to the specific rows diagnosed on 2026-07 for these 5 clients,
-- not a general-purpose dedup routine.

BEGIN;

-- Nazira Ordoñez (client_id 17) — keep 56 (created 2026-06-06), drop 73
UPDATE operations.payment_orders SET payment_id = 56 WHERE payment_id = 73;
DELETE FROM operations.payments WHERE id_payment = 73;

-- Karen Rojas Martinelli (client_id 20) — keep 13 (created 2026-05-22), drop 30, 70
UPDATE operations.payment_orders SET payment_id = 13 WHERE payment_id IN (30, 70);
DELETE FROM operations.payments WHERE id_payment IN (30, 70);

-- Daniela Gonzales Arguello (client_id 26) — keep 20 (created 2026-05-22), drop 24
UPDATE operations.payment_orders SET payment_id = 20 WHERE payment_id = 24;
DELETE FROM operations.payments WHERE id_payment = 24;

-- Erick Vasquez Mendoza (client_id 27) — keep 19 (created 2026-05-22), drop 34
UPDATE operations.payment_orders SET payment_id = 19 WHERE payment_id = 34;
DELETE FROM operations.payments WHERE id_payment = 34;

-- Joseph Rojas Solis (client_id 28) — keep 17 (created 2026-05-22), drop 37, 48
UPDATE operations.payment_orders SET payment_id = 17 WHERE payment_id IN (37, 48);
DELETE FROM operations.payments WHERE id_payment IN (37, 48);

COMMIT;

-- Verify: re-run the duplicate finder scoped to these 5 clients — should
-- return zero rows now.
-- SELECT * FROM ( ... same query as find_duplicate_monthly_payments.sql ... ) sub
-- WHERE same_group_count > 1 AND client_id IN (17, 20, 26, 27, 28);
