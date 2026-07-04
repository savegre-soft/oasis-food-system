-- Read-only diagnostic: finds monthly payments that look like accidental
-- duplicates — same client, same payment_date and same amount, registered
-- more than once (each usually linked to just 1 order instead of sharing
-- one payment across up to 4 orders).
--
-- This does NOT modify anything. Review the output, decide which
-- id_payment to keep per client/date/amount group, and let me know if you
-- want the follow-up UPDATE/DELETE to merge them.

SELECT *
FROM (
  SELECT
    p.id_payment,
    p.client_id,
    c.name AS client_name,
    p.amount,
    p.payment_date,
    p.status,
    p.created_at,
    COALESCE(poc.linked_orders, 0) AS linked_orders,
    COUNT(*) OVER (PARTITION BY p.client_id, p.payment_date, p.amount) AS same_group_count
  FROM operations.payments p
  JOIN operations.clients c ON c.id_client = p.client_id
  LEFT JOIN (
    SELECT payment_id, COUNT(*) AS linked_orders
    FROM operations.payment_orders
    GROUP BY payment_id
  ) poc ON poc.payment_id = p.id_payment
  WHERE p.payment_type = 'monthly'
) sub
WHERE same_group_count > 1
ORDER BY client_id, payment_date, id_payment;
