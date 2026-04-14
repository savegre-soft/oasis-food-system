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
export const STATUS_PIE_COLORS = ['#f59e0b', '#ef4444'];
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
