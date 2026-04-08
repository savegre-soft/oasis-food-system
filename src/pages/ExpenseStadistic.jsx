import { useMemo, useState } from 'react';
import { DollarSign, Users, TrendingDown, Hash } from 'lucide-react';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useExpenseStatistics } from '../hooks/useExpenseStatistics';
import { getThisWeek, getLast, getThisMonth } from '../hooks/useDashboardData';

// ── Date helpers ──────────────────────────────────────────────────────────────

const isoWeekMonday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

// ── Color constants ───────────────────────────────────────────────────────────

const CHART_PRESETS = [
  { label: 'Esta semana', fn: getThisWeek },
  { label: 'Últimos 7 días', fn: () => getLast(7) },
  { label: 'Este mes', fn: getThisMonth },
  { label: 'Últimos 30 días', fn: () => getLast(30) },
];

const CATEGORY_COLORS = [
  '#f97316', '#6366f1', '#14b8a6', '#f59e0b',
  '#a855f7', '#3b82f6', '#10b981', '#64748b',
];

const EXP_COLOR = '#f97316';   // orange — gastos operativos
const EMP_COLOR = '#6366f1';   // violet — personal

// ── Shared sub-components ─────────────────────────────────────────────────────

const fmtCRC = (v) => `₡${Number(v).toLocaleString()}`;

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ChartCard = ({ title, sub, loading, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 relative">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    ) : (
      children
    )}
  </div>
);

// ── Date filter ───────────────────────────────────────────────────────────────

const DateFilter = ({ dateRange, setDateRange }) => {
  const isPreset = (fn) => {
    const p = fn();
    return p.from === dateRange.from && p.to === dateRange.to;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-slate-500 shrink-0">Período</span>
      <div className="flex flex-wrap gap-2">
        {CHART_PRESETS.map(({ label, fn }) => (
          <button
            key={label}
            type="button"
            onClick={() => setDateRange(fn())}
            className={`text-xs px-3 py-1.5 rounded-xl border transition ${
              isPreset(fn)
                ? 'bg-orange-500 text-white border-orange-500'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-slate-200 hidden sm:block">|</span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.from}
          max={dateRange.to}
          onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date"
          value={dateRange.to}
          min={dateRange.from}
          onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const ExpenseStadistic = () => {
  const [dateRange, setDateRange] = useState(getThisMonth);

  const { expenses, empCosts, loading, error } = useExpenseStatistics(dateRange);

  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  // ── Derived chart data ──────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // Pre-fill all dates in range
    const dayMap = {};
    const empDayMap = {};
    for (
      let d = new Date(dateRange.from + 'T00:00:00');
      d <= new Date(dateRange.to + 'T00:00:00');
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
      empDayMap[key] = 0;
    }

    const categoryMap = {};
    const weekMap = {};

    // Process expenses
    expenses.forEach((e) => {
      const amt = e.amount || 0;
      if (e.expense_date in dayMap) dayMap[e.expense_date] += amt;

      const catName = e.expense_categories?.name || 'Otros';
      categoryMap[catName] = (categoryMap[catName] || 0) + amt;

      const wk = isoWeekMonday(e.expense_date);
      if (!weekMap[wk]) weekMap[wk] = { gastos: 0, personal: 0 };
      weekMap[wk].gastos += amt;
    });

    // Process employee costs
    empCosts.forEach((e) => {
      const amt = e.Amount || 0;
      if (e.WorkDate in empDayMap) empDayMap[e.WorkDate] += amt;

      const wk = isoWeekMonday(e.WorkDate);
      if (!weekMap[wk]) weekMap[wk] = { gastos: 0, personal: 0 };
      weekMap[wk].personal += amt;
    });

    // Build day series with running totals
    let runExp = 0;
    let runEmp = 0;
    const combinedByDay = Object.keys(dayMap)
      .sort()
      .map((date) => {
        runExp += dayMap[date];
        runEmp += empDayMap[date];
        return {
          date: date.slice(5).replace('-', '/'),
          gastos: dayMap[date],
          personal: empDayMap[date],
          total: dayMap[date] + empDayMap[date],
          acumGastos: runExp,
          acumPersonal: runEmp,
          acumTotal: runExp + runEmp,
        };
      });

    // Categories sorted descending
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Weekly comparison
    const weeklyData = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { gastos, personal }]) => ({
        semana: date.slice(5).replace('-', '/'),
        gastos,
        personal,
        total: gastos + personal,
      }));

    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalEmp = empCosts.reduce((s, e) => s + (e.Amount || 0), 0);

    return { combinedByDay, categoryData, weeklyData, totalExpenses, totalEmp };
  }, [expenses, empCosts, dateRange]);

  const { combinedByDay, categoryData, weeklyData, totalExpenses, totalEmp } = chartData;
  const totalCombined = totalExpenses + totalEmp;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (error) return <p className="p-8 text-red-500 text-sm">Error: {error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Estadística de Gastos</h1>

      {/* Date filter */}
      <DateFilter dateRange={dateRange} setDateRange={setDateRange} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={15} className="text-orange-500" />
            <p className="text-xs text-gray-500">Gastos operativos</p>
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {loading ? '—' : fmtCRC(totalExpenses)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loading ? '' : `${expenses.length} registro${expenses.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={15} className="text-indigo-500" />
            <p className="text-xs text-gray-500">Costo de personal</p>
          </div>
          <p className="text-2xl font-bold text-indigo-500">
            {loading ? '—' : fmtCRC(totalEmp)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loading ? '' : `${empCosts.length} registro${empCosts.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={15} className="text-red-500" />
            <p className="text-xs text-gray-500">Total combinado</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {loading ? '—' : fmtCRC(totalCombined)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={15} className="text-slate-400" />
            <p className="text-xs text-gray-500">Total registros</p>
          </div>
          <p className="text-2xl font-bold text-slate-700">
            {loading ? '—' : (expenses.length + empCosts.length).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loading
              ? ''
              : `${expenses.length} gastos · ${empCosts.length} personal`}
          </p>
        </div>
      </div>

      {/* Gastos + Personal por día (stacked) */}
      <ChartCard title="Gastos por día" sub={periodLabel} loading={loading}>
        {combinedByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin gastos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={combinedByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(combinedByDay.length / 10) - 1)}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v, n) => [fmtCRC(v), n === 'gastos' ? 'Operativos' : 'Personal']}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => (v === 'gastos' ? 'Operativos' : 'Personal')}
              />
              <Bar dataKey="gastos" stackId="a" fill={EXP_COLOR} maxBarSize={32} />
              <Bar dataKey="personal" stackId="a" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Flujo acumulado */}
      <ChartCard title="Flujo acumulado de gastos" sub={periodLabel} loading={loading}>
        {combinedByDay.every((d) => d.acumTotal === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin gastos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={combinedByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXP_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EXP_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEmp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMP_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EMP_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(combinedByDay.length / 10) - 1)}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v, n) => [
                  fmtCRC(v),
                  n === 'acumGastos' ? 'Acum. Operativos' : 'Acum. Personal',
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={9}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) =>
                  v === 'acumGastos' ? 'Operativos (acum.)' : 'Personal (acum.)'
                }
              />
              <Area
                type="monotone"
                dataKey="acumGastos"
                stroke={EXP_COLOR}
                strokeWidth={2}
                fill="url(#gradExp)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="acumPersonal"
                stroke={EMP_COLOR}
                strokeWidth={2}
                fill="url(#gradEmp)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Categorías: donut + horizontal bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Distribución por categoría" sub={periodLabel} loading={loading}>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={renderDonutLabel}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [fmtCRC(v), n]}
                />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gastos por categoría" sub={periodLabel} loading={loading}>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                  tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [fmtCRC(v), 'Total']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Comparativa semanal — solo si hay más de una semana */}
      {weeklyData.length > 1 && (
        <ChartCard title="Comparativa semanal" sub="Operativos vs Personal por semana" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v, n) => [
                  fmtCRC(v),
                  n === 'gastos' ? 'Operativos' : n === 'personal' ? 'Personal' : 'Total',
                ]}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) =>
                  v === 'gastos' ? 'Operativos' : v === 'personal' ? 'Personal' : 'Total'
                }
              />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="personal" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default ExpenseStadistic;
