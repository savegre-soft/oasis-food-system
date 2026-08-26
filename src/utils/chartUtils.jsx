import { getThisWeek, getLast, getThisMonth } from '../hooks/useDashboardData';

// ── Date helpers ──────────────────────────────────────────────────────────────

// Rango inmediatamente anterior, de la misma duración que dateRange — p.ej.
// si dateRange es todo agosto, devuelve todo julio (mismo número de días).
export const getPreviousPeriod = ({ from, to }) => {
  const fromD = new Date(from + 'T00:00:00');
  const toD = new Date(to + 'T00:00:00');
  const spanDays = Math.round((toD - fromD) / 86400000) + 1;

  const prevTo = new Date(fromD);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (spanDays - 1));

  return { from: prevFrom.toISOString().split('T')[0], to: prevTo.toISOString().split('T')[0] };
};

// Mismo rango de fechas, un año atrás — para comparar contra el mismo período
// del año anterior (YoY).
export const getSameRangeLastYear = ({ from, to }) => {
  const shiftYear = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };
  return { from: shiftYear(from), to: shiftYear(to) };
};

// % de cambio de `previous` a `current`. Si no hay línea base (previous === 0)
// no hay un % de crecimiento matemáticamente válido, así que se devuelve null
// (la UI lo muestra como "nuevo" en vez de un porcentaje engañoso).
export const pctChange = (current, previous) => {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

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

// ── Payment status label ──────────────────────────────────────────────────────
// Single source of truth for the Spanish label of each payment status, used
// both for display (badges, dropdowns) and for user-facing confirmation/error
// messages so they say "Pagado", not the raw 'paid' DB value.
export const PAYMENT_STATUS_LABEL = { pending: 'Pendiente', paid: 'Pagado', cancelled: 'Cancelado' };
export const PAYMENT_TYPE_LABEL = {
  monthly: 'Mensual',
  weekly: 'Semanal',
  express: 'Express',
  combo: 'Combo',
  bulk: 'Venta masiva',
  other: 'Otro',
};
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

  const typeMap = { monthly: 0, weekly: 0, express: 0, combo: 0, bulk: 0, other: 0 };
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
    { name: 'Combo', value: typeMap.combo },
    { name: 'Venta masiva', value: typeMap.bulk },
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

// ── Insights extendidos de ingresos ───────────────────────────────────────────
// Ticket promedio, concentración de clientes y cobranza. Se calculan aparte de
// buildIncomeStats porque necesitan campos que solo trae el select ampliado de
// usePaymentStatistics (period_end_date, created_at, clients.client_type) —
// buildIncomeStats se mantiene intacto porque también lo usa la pestaña de
// Estadísticas dentro de Pagos con un select más angosto.
export const CLIENT_TYPE_LABEL = { personal: 'Personal', family: 'Familiar' };

// No existe un campo "fecha de vencimiento" para todos los tipos de pago —
// solo los mensuales tienen period_end_date. Para el resto se usa un umbral
// de 7 días desde la creación del pago como proxy razonable de "atrasado".
const PENDING_GRACE_DAYS = 7;

export const buildIngresosInsights = (payments, incomeTotal, topClients) => {
  const paid = payments.filter((p) => p.status === 'paid');
  const today = new Date().toISOString().split('T')[0];
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

  // ── Ticket promedio y concentración ──
  const activeClientIds = new Set(paid.map((p) => p.client_id ?? `sin-id:${p.clients?.name}`));
  const activeClientsCount = activeClientIds.size;
  const avgTicket = paid.length > 0 ? Math.round(incomeTotal / paid.length) : 0;
  const avgPerClient = activeClientsCount > 0 ? Math.round(incomeTotal / activeClientsCount) : 0;

  const top5Total = topClients.slice(0, 5).reduce((s, c) => s + c.total, 0);
  const top5Concentration = incomeTotal > 0 ? (top5Total / incomeTotal) * 100 : 0;

  const typeMap = {};
  paid.forEach((p) => {
    const type = p.clients?.client_type;
    if (!type) return;
    if (!typeMap[type]) typeMap[type] = { total: 0, count: 0, clients: new Set() };
    typeMap[type].total += p.amount || 0;
    typeMap[type].count += 1;
    typeMap[type].clients.add(p.client_id);
  });
  const byClientType = Object.entries(typeMap).map(([type, { total, count, clients }]) => ({
    type,
    label: CLIENT_TYPE_LABEL[type] || type,
    total,
    avgTicket: count > 0 ? Math.round(total / count) : 0,
    clientCount: clients.size,
  }));

  // ── Cobranza ──
  const isOverdue = (p) => {
    if (p.status !== 'pending') return false;
    if (p.payment_type === 'monthly' && p.period_end_date) return p.period_end_date < today;
    const createdDate = p.created_at?.split('T')[0];
    return createdDate ? daysBetween(createdDate, today) > PENDING_GRACE_DAYS : false;
  };

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const overduePayments = pendingPayments.filter(isOverdue);
  const overdueAmount = overduePayments.reduce((s, p) => s + (p.amount || 0), 0);
  const overduePct = pendingPayments.length > 0 ? (overduePayments.length / pendingPayments.length) * 100 : 0;

  const collectionDays = paid
    .map((p) => {
      const start = p.payment_type === 'monthly' && p.period_end_date ? p.period_end_date : p.created_at?.split('T')[0];
      if (!start || !p.payment_date) return null;
      return Math.max(0, daysBetween(start, p.payment_date));
    })
    .filter((d) => d !== null);
  const avgCollectionDays = collectionDays.length > 0
    ? collectionDays.reduce((s, d) => s + d, 0) / collectionDays.length
    : null;

  const overdueClients = Object.values(
    overduePayments.reduce((acc, p) => {
      const key = p.client_id ?? p.clients?.name ?? 'desconocido';
      if (!acc[key]) acc[key] = { name: p.clients?.name || `Cliente ${p.client_id}`, amount: 0, count: 0 };
      acc[key].amount += p.amount || 0;
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    avgTicket, activeClientsCount, avgPerClient, top5Concentration, byClientType,
    overdueCount: overduePayments.length, overdueAmount, overduePct, avgCollectionDays,
    overdueClients, pendingCount: pendingPayments.length,
  };
};
