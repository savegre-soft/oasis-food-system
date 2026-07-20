-- Vistas de agregación para los dashboards financieros (Estadísticas, Payments,
-- ExpenseStadistic). Hoy esos paneles traen TODAS las filas crudas de
-- payments/expenses/empCost al cliente y agregan por día/categoría/estado en
-- JavaScript (ver chartUtils.jsx, useExpenseStatistics.js, usePaymentStatistics.js).
-- Eso funciona bien con el volumen actual de datos, pero no escala indefinidamente.
--
-- Estas vistas resumen lo mismo en Postgres. Son ADITIVAS: no cambian tablas
-- existentes ni el comportamiento actual del frontend (que sigue funcionando
-- igual hasta que se decida consumir estas vistas desde los hooks/paneles).
-- Aplíquela con `supabase db push` o desde el SQL editor del dashboard.
--
-- Siguiente paso recomendado (fuera del alcance de esta migración): reemplazar
-- los fetch+aggregate de useExpenseStatistics.js / usePaymentStatistics.js /
-- chartUtils.buildIncomeStats por consultas a estas vistas, probando contra un
-- entorno real antes de desplegar, ya que cambia el volumen de datos que viaja
-- al cliente en cada carga de dashboard.

-- ── Ingresos por día / tipo / estado ──────────────────────────────────────────
CREATE OR REPLACE VIEW operations.v_payments_daily_summary AS
SELECT
  payment_date,
  payment_type,
  status,
  COUNT(*)        AS payment_count,
  SUM(amount)     AS total_amount
FROM operations.payments
GROUP BY payment_date, payment_type, status;

COMMENT ON VIEW operations.v_payments_daily_summary IS
  'Resumen de pagos por día/tipo/estado. Solo status=paid representa ingreso real (ver chartUtils.buildIncomeStats).';

-- ── Gastos operativos por día / categoría ─────────────────────────────────────
CREATE OR REPLACE VIEW operations.v_expenses_daily_summary AS
SELECT
  e.expense_date                        AS expense_date,
  COALESCE(c.name, 'Sin categoría')      AS category_name,
  COUNT(*)                              AS expense_count,
  SUM(e.amount)                         AS total_amount
FROM operations.expenses e
LEFT JOIN operations.expense_categories c ON c.id_expense_category = e.category_id
GROUP BY e.expense_date, COALESCE(c.name, 'Sin categoría');

COMMENT ON VIEW operations.v_expenses_daily_summary IS
  'Resumen de gastos operativos (tabla expenses) por día y categoría.';

-- ── Planilla por día ───────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW operations.v_emp_cost_daily_summary AS
SELECT
  ec."WorkDate"                                          AS work_date,
  ec.payment_type,
  COUNT(*)                                                AS record_count,
  SUM(ec."Amount")                                        AS total_gross,
  SUM(ec."Amount") - COALESCE(SUM(ded.total_deductions), 0) AS total_net
FROM operations."empCost" ec
LEFT JOIN (
  SELECT emp_cost_id, SUM(amount) AS total_deductions
  FROM operations.emp_cost_deductions
  GROUP BY emp_cost_id
) ded ON ded.emp_cost_id = ec.id
GROUP BY ec."WorkDate", ec.payment_type, ded.total_deductions;

COMMENT ON VIEW operations.v_emp_cost_daily_summary IS
  'Resumen de costos de planilla (empCost) por día, con deducciones aplicadas.';

-- ── Gasto combinado (operativo + planilla) por día, para el panel Comparativa ─
CREATE OR REPLACE VIEW operations.v_total_expenses_daily AS
SELECT expense_date AS day, SUM(total_amount) AS total_amount, 'operativo' AS source
FROM operations.v_expenses_daily_summary
GROUP BY expense_date
UNION ALL
SELECT work_date AS day, SUM(total_net) AS total_amount, 'planilla' AS source
FROM operations.v_emp_cost_daily_summary
GROUP BY work_date;

COMMENT ON VIEW operations.v_total_expenses_daily IS
  'Gasto operativo + planilla combinados por día, para comparar contra ingresos (panel Comparativa de Estadísticas).';
