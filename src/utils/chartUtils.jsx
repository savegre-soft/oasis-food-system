import { getThisWeek, getLast, getThisMonth } from '../hooks/useDashboardData';

// ── Date helpers ──────────────────────────────────────────────────────────────

export const isoWeekMonday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

// ── Formatters ────────────────────────────────────────────────────────────────

export const fmtCRC = (v) => `₡${Number(v).toLocaleString()}`;

// ── Donut label renderer (Recharts) ───────────────────────────────────────────

export const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Color palettes ────────────────────────────────────────────────────────────

export const EXP_COLOR = '#f97316';   // orange — gastos operativos
export const EMP_COLOR = '#6366f1';   // violet — personal
export const ING_COLOR = '#10b981';   // green  — ingresos
export const BAL_COLOR = '#3b82f6';   // blue   — balance

export const CATEGORY_COLORS = [
  '#f97316', '#6366f1', '#14b8a6', '#f59e0b',
  '#a855f7', '#3b82f6', '#10b981', '#64748b',
];

export const TYPE_PIE_COLORS  = ['#6366f1', '#3b82f6', '#f59e0b'];
export const STATUS_PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444']; // Pendiente, Pagado, Cancelado
export const CLIENT_BAR_COLORS = [
  '#10b981', '#3b82f6', '#6366f1', '#f59e0b',
  '#f97316', '#a855f7', '#14b8a6', '#64748b',
];

// ── Chart date presets ────────────────────────────────────────────────────────

export const CHART_PRESETS = [
  { label: 'Esta semana',    fn: getThisWeek },
  { label: 'Últimos 7 días', fn: () => getLast(7) },
  { label: 'Este mes',       fn: getThisMonth },
  { label: 'Últimos 30 días',fn: () => getLast(30) },
];

// ── Income stats builder ──────────────────────────────────────────────────────
// Single source of truth for the income aggregations shown in the "Ingresos"
// tab (Estadísticas) and the "Estadísticas" tab of Pagos. Only payments with
// status 'paid' represent money actually received, so only those count in
// the real-income buckets (day/type/client/week/total). 'pending' (not yet
// collected) and 'cancelled' (voided) are tracked separately for visibility
// but excluded from the totals/charts.
export const buildIncomeStats = (payments, dateRange) => {
  const dayMap = {};
  for (
    let d = new Date(dateRange.from + 'T00:00:00');
    d <= new Date(dateRange.to + 'T00:00:00');
    d.setDate(d.getDate() + 1)
  ) {
    dayMap[d.toISOString().split('T')[0]] = 0;
  }

  const typeMap = { monthly: 0, weekly: 0, express: 0, other: 0 };
  const statusMap = { pending: 0, paid: 0, cancelled: 0 };
  const clientMap = {};
  const weekMap = {};

  payments.forEach((p) => {
    const amt = p.amount || 0;
    if (p.status in statusMap) statusMap[p.status] += amt;
    if (p.status !== 'paid') return; // only collected money counts in the buckets below

    if (p.payment_date in dayMap) dayMap[p.payment_date] += amt;
    if (p.payment_type in typeMap) typeMap[p.payment_type] += amt;
    const name = p.clients?.name || (p.client_id ? `Cliente ${p.client_id}` : 'Ingreso manual');
    clientMap[name] = (clientMap[name] || 0) + amt;
    const wk = isoWeekMonday(p.payment_date);
    weekMap[wk] = (weekMap[wk] || 0) + amt;
  });

  let running = 0;
  const incomeByDay = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => {
      running += total;
      return { date: date.slice(5).replace('-', '/'), total, acumulado: running };
    });

  const incomeByType = [
    { name: 'Mensual', value: typeMap.monthly },
    { name: 'Semanal', value: typeMap.weekly },
    { name: 'Express', value: typeMap.express },
    { name: 'Otro', value: typeMap.other },
  ].filter((x) => x.value > 0);

  const incomeByStatus = [
    { name: 'Pendiente', value: statusMap.pending },
    { name: 'Pagado', value: statusMap.paid },
    { name: 'Cancelado', value: statusMap.cancelled },
  ].filter((x) => x.value > 0);

  const topClients = Object.entries(clientMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ semana: date.slice(5).replace('-', '/'), total }));

  const pendingChart = statusMap.pending;
  const paidChart = statusMap.paid;
  const cancelledChart = statusMap.cancelled;
  const totalChart = paidChart; // real income received in the period
  const paymentCount = payments.filter((p) => p.status === 'paid').length;

  return {
    incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData,
    totalChart, pendingChart, paidChart, cancelledChart, paymentCount,
  };
};
