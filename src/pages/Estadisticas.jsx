import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Scale, Hash, BarChart2,
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import { useExpenseStatistics } from '../hooks/useExpenseStatistics';
import { usePaymentStatistics } from '../hooks/usePaymentStatistics';
import { getThisWeek, getLast, getThisMonth } from '../hooks/useDashboardData';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isoWeekMonday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

const fmtCRC = (v) => `₡${Number(v).toLocaleString()}`;

const PRESETS = [
  { label: 'Esta semana', fn: getThisWeek },
  { label: 'Últimos 7 días', fn: () => getLast(7) },
  { label: 'Este mes', fn: getThisMonth },
  { label: 'Últimos 30 días', fn: () => getLast(30) },
];

// ── Color palettes ────────────────────────────────────────────────────────────

const EXP_COLOR   = '#f97316';  // orange — gastos operativos
const EMP_COLOR   = '#6366f1';  // violet — personal
const ING_COLOR   = '#10b981';  // green  — ingresos
const BAL_COLOR   = '#3b82f6';  // blue   — balance

const CATEGORY_COLORS = [
  '#f97316', '#6366f1', '#14b8a6', '#f59e0b',
  '#a855f7', '#3b82f6', '#10b981', '#64748b',
];
const TYPE_PIE_COLORS  = ['#6366f1', '#3b82f6', '#f59e0b'];
const STATUS_PIE_COLORS = ['#f59e0b', '#ef4444'];
const CLIENT_BAR_COLORS = [
  '#10b981', '#3b82f6', '#6366f1', '#f59e0b',
  '#f97316', '#a855f7', '#14b8a6', '#64748b',
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

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
  <div className="bg-white rounded-2xl shadow-sm p-6">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    ) : children}
  </div>
);

const StatCard = ({ icon, label, value, sub, accent = 'text-slate-800', bg = 'bg-slate-100', iconColor }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${bg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ── Date filter ───────────────────────────────────────────────────────────────

const DateFilter = ({ dateRange, setDateRange, accent }) => {
  const isPreset = (fn) => {
    const p = fn();
    return p.from === dateRange.from && p.to === dateRange.to;
  };
  const activeClass = accent === 'orange'
    ? 'bg-orange-500 text-white border-orange-500'
    : 'bg-emerald-600 text-white border-emerald-600';
  const ringClass = accent === 'orange' ? 'focus:ring-orange-300' : 'focus:ring-emerald-300';

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-slate-500 shrink-0">Período</span>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ label, fn }) => (
          <button
            key={label}
            type="button"
            onClick={() => setDateRange(fn())}
            className={`text-xs px-3 py-1.5 rounded-xl border transition ${isPreset(fn) ? activeClass : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-slate-200 hidden sm:block">|</span>
      <div className="flex items-center gap-2">
        <input type="date" value={dateRange.from} max={dateRange.to}
          onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          className={`text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 ${ringClass}`}
        />
        <span className="text-xs text-slate-400">→</span>
        <input type="date" value={dateRange.to} min={dateRange.from}
          onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          className={`text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 ${ringClass}`}
        />
      </div>
    </div>
  );
};

// ── Panel: Gastos ─────────────────────────────────────────────────────────────

const GastosPanel = ({ expenses, empCosts, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const { combinedByDay, categoryData, weeklyData, totalExpenses, totalEmp } = useMemo(() => {
    const dayMap = {};
    const empDayMap = {};
    for (let d = new Date(dateRange.from + 'T00:00:00'); d <= new Date(dateRange.to + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
      empDayMap[key] = 0;
    }

    const categoryMap = {};
    const weekMap = {};

    expenses.forEach((e) => {
      const amt = e.amount || 0;
      if (e.expense_date in dayMap) dayMap[e.expense_date] += amt;
      const catName = e.expense_categories?.name || 'Otros';
      categoryMap[catName] = (categoryMap[catName] || 0) + amt;
      const wk = isoWeekMonday(e.expense_date);
      if (!weekMap[wk]) weekMap[wk] = { gastos: 0, personal: 0 };
      weekMap[wk].gastos += amt;
    });

    empCosts.forEach((e) => {
      const amt = e.Amount || 0;
      if (e.WorkDate in empDayMap) empDayMap[e.WorkDate] += amt;
      const wk = isoWeekMonday(e.WorkDate);
      if (!weekMap[wk]) weekMap[wk] = { gastos: 0, personal: 0 };
      weekMap[wk].personal += amt;
    });

    let runExp = 0, runEmp = 0;
    const combinedByDay = Object.keys(dayMap).sort().map((date) => {
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

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const weeklyData = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { gastos, personal }]) => ({
        semana: date.slice(5).replace('-', '/'), gastos, personal, total: gastos + personal,
      }));

    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalEmp = empCosts.reduce((s, e) => s + (e.Amount || 0), 0);

    return { combinedByDay, categoryData, weeklyData, totalExpenses, totalEmp };
  }, [expenses, empCosts, dateRange]);

  const totalCombined = totalExpenses + totalEmp;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={14} />} label="Gastos operativos" value={loading ? '—' : fmtCRC(totalExpenses)} sub={loading ? '' : `${expenses.length} registros`} accent="text-orange-500" bg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard icon={<Users size={14} />} label="Costo de personal" value={loading ? '—' : fmtCRC(totalEmp)} sub={loading ? '' : `${empCosts.length} registros`} accent="text-indigo-500" bg="bg-indigo-50" iconColor="text-indigo-500" />
        <StatCard icon={<TrendingDown size={14} />} label="Total combinado" value={loading ? '—' : fmtCRC(totalCombined)} sub={periodLabel} accent="text-slate-800" bg="bg-slate-100" iconColor="text-slate-600" />
        <StatCard icon={<Hash size={14} />} label="Registros totales" value={loading ? '—' : (expenses.length + empCosts.length).toLocaleString()} sub={loading ? '' : `${expenses.length} gastos · ${empCosts.length} personal`} accent="text-slate-700" bg="bg-slate-100" iconColor="text-slate-500" />
      </div>

      <ChartCard title="Gastos por día" sub={periodLabel} loading={loading}>
        {combinedByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin gastos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={combinedByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(combinedByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'gastos' ? 'Operativos' : 'Personal']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'gastos' ? 'Operativos' : 'Personal')} />
              <Bar dataKey="gastos" stackId="a" fill={EXP_COLOR} maxBarSize={32} />
              <Bar dataKey="personal" stackId="a" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Flujo acumulado de gastos" sub={periodLabel} loading={loading}>
        {combinedByDay.every((d) => d.acumTotal === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin gastos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={combinedByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sGradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXP_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EXP_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sGradEmp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMP_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EMP_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(combinedByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'acumGastos' ? 'Acum. Operativos' : 'Acum. Personal']} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'acumGastos' ? 'Operativos (acum.)' : 'Personal (acum.)')} />
              <Area type="monotone" dataKey="acumGastos" stroke={EXP_COLOR} strokeWidth={2} fill="url(#sGradExp)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="acumPersonal" stroke={EMP_COLOR} strokeWidth={2} fill="url(#sGradEmp)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Distribución por categoría" sub={periodLabel} loading={loading}>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={65} outerRadius={100} dataKey="value" labelLine={false} label={renderDonutLabel}>
                  {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gastos por categoría" sub={periodLabel} loading={loading}>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={categoryData} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Total']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {weeklyData.length > 1 && (
        <ChartCard title="Comparativa semanal" sub="Operativos vs Personal por semana" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'gastos' ? 'Operativos' : 'Personal']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'gastos' ? 'Operativos' : 'Personal')} />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="personal" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

// ── Panel: Ingresos ───────────────────────────────────────────────────────────

const IngresosPanel = ({ payments, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const { incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData, totalChart, pendingChart, cancelledChart } = useMemo(() => {
    const dayMap = {};
    for (let d = new Date(dateRange.from + 'T00:00:00'); d <= new Date(dateRange.to + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
      dayMap[d.toISOString().split('T')[0]] = 0;
    }

    const typeMap = { monthly: 0, weekly: 0, express: 0 };
    const statusMap = { pending: 0, cancelled: 0 };
    const clientMap = {};
    const weekMap = {};

    payments.forEach((p) => {
      const amt = p.amount || 0;
      if (p.payment_date in dayMap) dayMap[p.payment_date] += amt;
      if (p.payment_type in typeMap) typeMap[p.payment_type] += amt;
      if (p.status in statusMap) statusMap[p.status] += amt;
      const name = p.clients?.name || `Cliente ${p.client_id}`;
      clientMap[name] = (clientMap[name] || 0) + amt;
      const wk = isoWeekMonday(p.payment_date);
      weekMap[wk] = (weekMap[wk] || 0) + amt;
    });

    let running = 0;
    const incomeByDay = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => {
      running += total;
      return { date: date.slice(5).replace('-', '/'), total, acumulado: running };
    });

    const incomeByType = [
      { name: 'Mensual', value: typeMap.monthly },
      { name: 'Semanal', value: typeMap.weekly },
      { name: 'Express', value: typeMap.express },
    ].filter((x) => x.value > 0);

    const incomeByStatus = [
      { name: 'Pendiente', value: statusMap.pending },
      { name: 'Cancelado', value: statusMap.cancelled },
    ].filter((x) => x.value > 0);

    const topClients = Object.entries(clientMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const weeklyData = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ semana: date.slice(5).replace('-', '/'), total }));

    const totalChart = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingChart = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
    const cancelledChart = payments.filter((p) => p.status === 'cancelled').reduce((s, p) => s + (p.amount || 0), 0);

    return { incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData, totalChart, pendingChart, cancelledChart };
  }, [payments, dateRange]);

  const confirmedChart = totalChart - pendingChart - cancelledChart;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={14} />} label="Total en el período" value={loading ? '—' : fmtCRC(totalChart)} sub={loading ? '' : `${payments.length} pago${payments.length !== 1 ? 's' : ''}`} accent="text-slate-800" bg="bg-slate-100" iconColor="text-slate-600" />
        <StatCard icon={<TrendingUp size={14} />} label="Confirmados" value={loading ? '—' : fmtCRC(confirmedChart)} sub={totalChart > 0 ? `${((confirmedChart / totalChart) * 100).toFixed(0)}% del total` : '—'} accent="text-emerald-600" bg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={<Hash size={14} />} label="Pendientes" value={loading ? '—' : fmtCRC(pendingChart)} sub={totalChart > 0 ? `${((pendingChart / totalChart) * 100).toFixed(0)}% del total` : '—'} accent="text-amber-500" bg="bg-amber-50" iconColor="text-amber-500" />
        <StatCard icon={<TrendingDown size={14} />} label="Cancelados" value={loading ? '—' : fmtCRC(cancelledChart)} sub={totalChart > 0 ? `${((cancelledChart / totalChart) * 100).toFixed(0)}% del total` : '—'} accent="text-red-500" bg="bg-red-50" iconColor="text-red-500" />
      </div>

      <ChartCard title="Ingresos por día" sub={periodLabel} loading={loading}>
        {incomeByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" fill={ING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Flujo acumulado de ingresos" sub={periodLabel} loading={loading}>
        {incomeByDay.every((d) => d.acumulado === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sGradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ING_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={ING_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Acumulado']} />
              <Area type="monotone" dataKey="acumulado" stroke={ING_COLOR} strokeWidth={2.5} fill="url(#sGradIncome)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Ingresos por tipo de pago" sub={periodLabel} loading={loading}>
          {incomeByType.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={incomeByType} cx="50%" cy="45%" innerRadius={65} outerRadius={95} dataKey="value" labelLine={false} label={renderDonutLabel}>
                  {incomeByType.map((_, i) => <Cell key={i} fill={TYPE_PIE_COLORS[i % TYPE_PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estado de pagos" sub={periodLabel} loading={loading}>
          {incomeByStatus.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={incomeByStatus} cx="50%" cy="45%" innerRadius={65} outerRadius={95} dataKey="value" labelLine={false} label={renderDonutLabel}>
                  {incomeByStatus.map((_, i) => <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Top clientes por ingreso" sub={periodLabel} loading={loading}>
        {topClients.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, topClients.length * 42)}>
            <BarChart layout="vertical" data={topClients} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {topClients.map((_, i) => <Cell key={i} fill={CLIENT_BAR_COLORS[i % CLIENT_BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {weeklyData.length > 1 && (
        <ChartCard title="Comparativa semanal" sub="Ingresos totales por semana" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

// ── Panel: Comparativa ────────────────────────────────────────────────────────

const ComparativaPanel = ({ expenses, empCosts, payments, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const { vsByDay, weeklyVs, totalIngresos, totalGastos, balance } = useMemo(() => {
    const dayMap = {};
    for (let d = new Date(dateRange.from + 'T00:00:00'); d <= new Date(dateRange.to + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { ingresos: 0, gastos: 0 };
    }

    const weekMap = {};

    payments.forEach((p) => {
      const amt = p.amount || 0;
      if (p.payment_date in dayMap) dayMap[p.payment_date].ingresos += amt;
      const wk = isoWeekMonday(p.payment_date);
      if (!weekMap[wk]) weekMap[wk] = { ingresos: 0, gastos: 0 };
      weekMap[wk].ingresos += amt;
    });

    expenses.forEach((e) => {
      const amt = e.amount || 0;
      if (e.expense_date in dayMap) dayMap[e.expense_date].gastos += amt;
      const wk = isoWeekMonday(e.expense_date);
      if (!weekMap[wk]) weekMap[wk] = { ingresos: 0, gastos: 0 };
      weekMap[wk].gastos += amt;
    });

    empCosts.forEach((e) => {
      const amt = e.Amount || 0;
      if (e.WorkDate in dayMap) dayMap[e.WorkDate].gastos += amt;
      const wk = isoWeekMonday(e.WorkDate);
      if (!weekMap[wk]) weekMap[wk] = { ingresos: 0, gastos: 0 };
      weekMap[wk].gastos += amt;
    });

    let runIngresos = 0, runGastos = 0;
    const vsByDay = Object.keys(dayMap).sort().map((date) => {
      const { ingresos, gastos } = dayMap[date];
      runIngresos += ingresos;
      runGastos += gastos;
      return {
        date: date.slice(5).replace('-', '/'),
        ingresos,
        gastos,
        balance: ingresos - gastos,
        acumIngresos: runIngresos,
        acumGastos: runGastos,
        acumBalance: runIngresos - runGastos,
      };
    });

    const weeklyVs = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { ingresos, gastos }]) => ({
        semana: date.slice(5).replace('-', '/'),
        ingresos,
        gastos,
        balance: ingresos - gastos,
      }));

    const totalIngresos = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalGastos =
      expenses.reduce((s, e) => s + (e.amount || 0), 0) +
      empCosts.reduce((s, e) => s + (e.Amount || 0), 0);

    return { vsByDay, weeklyVs, totalIngresos, totalGastos, balance: totalIngresos - totalGastos };
  }, [expenses, empCosts, payments, dateRange]);

  const ratio = totalGastos > 0 ? ((totalGastos / totalIngresos) * 100).toFixed(0) : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={14} />} label="Total Ingresos" value={loading ? '—' : fmtCRC(totalIngresos)} sub={periodLabel} accent="text-emerald-600" bg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={<TrendingDown size={14} />} label="Total Gastos" value={loading ? '—' : fmtCRC(totalGastos)} sub="Operativos + Personal" accent="text-orange-500" bg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard
          icon={<Scale size={14} />}
          label="Balance neto"
          value={loading ? '—' : fmtCRC(balance)}
          sub={balance >= 0 ? 'Superávit' : 'Déficit'}
          accent={balance >= 0 ? 'text-blue-600' : 'text-red-500'}
          bg={balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}
          iconColor={balance >= 0 ? 'text-blue-600' : 'text-red-500'}
        />
        <StatCard icon={<BarChart2 size={14} />} label="Ratio gastos/ingresos" value={loading ? '—' : (ratio !== null && totalIngresos > 0 ? `${ratio}%` : '—')} sub="Gastos como % de ingresos" accent="text-slate-700" bg="bg-slate-100" iconColor="text-slate-500" />
      </div>

      {/* Ingresos vs Gastos por día */}
      <ChartCard title="Ingresos vs Gastos por día" sub={periodLabel} loading={loading}>
        {vsByDay.every((d) => d.ingresos === 0 && d.gastos === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(vsByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'ingresos' ? 'Ingresos' : 'Gastos']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'ingresos' ? 'Ingresos' : 'Gastos')} />
              <Bar dataKey="ingresos" fill={ING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Flujo acumulado comparado */}
      <ChartCard title="Flujo acumulado: Ingresos vs Gastos" sub={periodLabel} loading={loading}>
        {vsByDay.every((d) => d.acumIngresos === 0 && d.acumGastos === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={vsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cGradInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ING_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={ING_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cGradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXP_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={EXP_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(vsByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'acumIngresos' ? 'Ingresos (acum.)' : 'Gastos (acum.)']} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'acumIngresos' ? 'Ingresos (acum.)' : 'Gastos (acum.)')} />
              <Area type="monotone" dataKey="acumIngresos" stroke={ING_COLOR} strokeWidth={2.5} fill="url(#cGradInc)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="acumGastos" stroke={EXP_COLOR} strokeWidth={2.5} fill="url(#cGradExp)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Balance neto por día */}
      <ChartCard title="Balance neto por día" sub="Ingresos – Gastos" loading={loading}>
        {vsByDay.every((d) => d.balance === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(vsByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Balance']} />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {vsByDay.map((d, i) => (
                  <Cell key={i} fill={d.balance >= 0 ? BAL_COLOR : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Comparativa semanal */}
      {weeklyVs.length > 1 && (
        <ChartCard title="Comparativa semanal: Ingresos vs Gastos" sub="Por semana en el período" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyVs} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'ingresos' ? 'Ingresos' : n === 'gastos' ? 'Gastos' : 'Balance']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'ingresos' ? 'Ingresos' : v === 'gastos' ? 'Gastos' : 'Balance')} />
              <Bar dataKey="ingresos" fill={ING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'gastos',       label: 'Gastos',             accent: 'orange' },
  { key: 'ingresos',     label: 'Ingresos',            accent: 'emerald' },
  { key: 'comparativa',  label: 'Gastos vs Ingresos',  accent: 'blue' },
];

const Estadisticas = () => {
  const [tab, setTab] = useState('gastos');
  const [dateRange, setDateRange] = useState(getThisMonth);

  const { expenses, empCosts, loading: loadingExp, error: errExp } = useExpenseStatistics(dateRange);
  const { payments, loading: loadingPay, error: errPay } = usePaymentStatistics(dateRange);

  const loading = loadingExp || loadingPay;
  const error = errExp || errPay;

  const currentAccent = TABS.find((t) => t.key === tab)?.accent ?? 'emerald';

  if (error) return <p className="p-8 text-red-500 text-sm">Error: {error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Estadísticas Financieras</h1>

      {/* Date filter */}
      <DateFilter dateRange={dateRange} setDateRange={setDateRange} accent={currentAccent} />

      {/* Tab selector */}
      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium transition ${tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'gastos' && (
        <GastosPanel expenses={expenses} empCosts={empCosts} dateRange={dateRange} loading={loading} />
      )}
      {tab === 'ingresos' && (
        <IngresosPanel payments={payments} dateRange={dateRange} loading={loading} />
      )}
      {tab === 'comparativa' && (
        <ComparativaPanel expenses={expenses} empCosts={empCosts} payments={payments} dateRange={dateRange} loading={loading} />
      )}
    </div>
  );
};

export default Estadisticas;
