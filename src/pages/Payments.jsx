import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, Search, Pencil, Check, X, Eye, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useApp } from '../context/AppContext';
import DatePicker from '../components/DatePicker';
import OrderDetailModal from '../components/OrderDetailModal';
import { getThisWeek, getLast, getThisMonth } from '../hooks/useDashboardData';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const isoWeekMonday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

const TYPE_LABEL = { monthly: 'Mensual', weekly: 'Semanal', express: 'Express' };
const TYPE_COLOR = {
  monthly: 'bg-violet-100 text-violet-700',
  weekly: 'bg-blue-100 text-blue-700',
  express: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL = { pending: 'Pendiente', cancelled: 'Cancelado' };
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
};

// ── Chart colors ──────────────────────────────────────────────────────────────

const TYPE_PIE_COLORS = ['#6366f1', '#3b82f6', '#f59e0b'];
const STATUS_PIE_COLORS = ['#f59e0b', '#ef4444'];
const CLIENT_BAR_COLORS = [
  '#10b981', '#3b82f6', '#6366f1', '#f59e0b',
  '#f97316', '#a855f7', '#14b8a6', '#64748b',
];

// ── Chart presets ─────────────────────────────────────────────────────────────

const CHART_PRESETS = [
  { label: 'Esta semana', fn: getThisWeek },
  { label: 'Últimos 7 días', fn: () => getLast(7) },
  { label: 'Este mes', fn: getThisMonth },
  { label: 'Últimos 30 días', fn: () => getLast(30) },
];

// ── Main page ─────────────────────────────────────────────────────────────────

const Payments = () => {
  const { supabase } = useApp();

  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('week');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [chartRange, setChartRange] = useState(getThisMonth);

  // Order detail modal
  const [viewingOrder, setViewingOrder] = useState(null);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('payments')
      .select(
        `
        id_payment, client_id, payment_type, amount, currency,
        payment_date, status, notes, created_at,
        clients(name),
        payment_orders(
          id_payment_order, order_id,
          orders(
            id_order, week_start_date, week_end_date, classification, status,
            clients(id_client, name, client_type),
            routes(id_route, name, route_delivery_days(day_of_week)),
            order_days(
              id_order_day, day_of_week, delivery_date, status,
              order_day_details(id_order_day_detail, recipe_id, quantity, recipes(id_recipe, name))
            )
          )
        )
      `
      )
      .order('payment_date', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setPayments(data ?? []);
  };

  useEffect(() => {
    (async () => {
      await fetchPayments();
    })();
  }, [supabase]);

  // ── Derived data — table ──────────────────────────────────────────────────
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const weekPayments = payments.filter((p) => {
    const d = new Date(p.payment_date + 'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });

  const historyPayments = payments
    .filter((p) => (p.clients?.name ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const d = new Date(p.payment_date + 'T00:00:00');
      return d >= new Date(dateRange.startDate) && d <= new Date(dateRange.endDate);
    });

  const displayList = (tab === 'week' ? weekPayments : historyPayments).filter(
    (p) => statusFilter === 'all' || p.status === statusFilter
  );

  const totalWeek = weekPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalAll = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + (p.amount || 0), 0);

  // ── Derived data — charts ─────────────────────────────────────────────────
  const chartPayments = useMemo(() => {
    const from = new Date(chartRange.from + 'T00:00:00');
    const to = new Date(chartRange.to + 'T23:59:59');
    return payments.filter((p) => {
      const d = new Date(p.payment_date + 'T00:00:00');
      return d >= from && d <= to;
    });
  }, [payments, chartRange]);

  const chartData = useMemo(() => {
    // Pre-fill all dates in range with 0
    const dayMap = {};
    for (
      let d = new Date(chartRange.from + 'T00:00:00');
      d <= new Date(chartRange.to + 'T00:00:00');
      d.setDate(d.getDate() + 1)
    ) {
      dayMap[d.toISOString().split('T')[0]] = 0;
    }

    const typeMap = { monthly: 0, weekly: 0, express: 0 };
    const statusMap = { pending: 0, cancelled: 0 };
    const clientMap = {};
    const weekMap = {};

    chartPayments.forEach((p) => {
      const amt = p.amount || 0;

      // By day
      if (p.payment_date in dayMap) dayMap[p.payment_date] += amt;

      // By type
      if (p.payment_type in typeMap) typeMap[p.payment_type] += amt;

      // By status
      if (p.status in statusMap) statusMap[p.status] += amt;

      // By client
      const clientName = p.clients?.name || `Cliente ${p.client_id}`;
      clientMap[clientName] = (clientMap[clientName] || 0) + amt;

      // By week
      const weekKey = isoWeekMonday(p.payment_date);
      weekMap[weekKey] = (weekMap[weekKey] || 0) + amt;
    });

    // Build ordered day series with cumulative total
    let running = 0;
    const incomeByDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => {
        running += total;
        return {
          date: date.slice(5).replace('-', '/'),
          total,
          acumulado: running,
        };
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
      .map(([date, total]) => ({
        semana: date.slice(5).replace('-', '/'),
        total,
      }));

    const totalChart = chartPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingChart = chartPayments
      .filter((p) => p.status === 'pending')
      .reduce((s, p) => s + (p.amount || 0), 0);
    const cancelledChart = chartPayments
      .filter((p) => p.status === 'cancelled')
      .reduce((s, p) => s + (p.amount || 0), 0);

    return { incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData, totalChart, pendingChart, cancelledChart };
  }, [chartPayments, chartRange]);

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusSave = async (id, newStatus) => {
    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .update({ status: newStatus })
      .eq('id_payment', id);

    if (error) {
      sileo.error('No se pudo actualizar el estado');
      return;
    }
    sileo.success('Estado actualizado');
    setEditingStatus(null);
    await fetchPayments();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="min-h-screen bg-slate-100 my-5 rounded p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Order Detail Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm p-6 mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800">Ingresos</h1>
        <p className="text-slate-500 mt-1">Pagos asociados a órdenes de clientes</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          icon={<TrendingUp size={22} />}
          label="Esta semana"
          value={`₡${totalWeek.toLocaleString()}`}
          colorClass="bg-green-50 text-green-600"
        />
        <SummaryCard
          icon={<DollarSign size={22} />}
          label="Total histórico"
          value={`₡${totalAll.toLocaleString()}`}
          colorClass="bg-slate-100 text-slate-600"
        />
        <SummaryCard
          icon={<Clock size={22} />}
          label="Pendientes"
          value={`${pendingCount} pago${pendingCount !== 1 ? 's' : ''} · ₡${pendingAmount.toLocaleString()}`}
          colorClass="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* Tab + Status filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
          {[
            ['week', 'Esta Semana'],
            ['history', 'Historial'],
            ['stats', 'Estadísticas'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-5 py-2.5 text-sm font-medium transition flex items-center gap-1.5 ${tab === val ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {val === 'stats' && <BarChart2 size={14} />}
              {lbl}
            </button>
          ))}
        </div>

        {tab !== 'stats' && (
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            {[
              ['all', 'Todos'],
              ['pending', 'Pendientes'],
              ['cancelled', 'Cancelados'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-4 py-2 text-xs font-medium transition ${statusFilter === val ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* History filters */}
      <AnimatePresence>
        {tab === 'history' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 space-y-4 overflow-hidden"
          >
            <DatePicker onChange={setDateRange} />
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table (week / history tabs) */}
      {tab !== 'stats' && (
        <PaymentTable
          payments={displayList}
          editingStatus={editingStatus}
          onStatusEdit={setEditingStatus}
          onStatusSave={handleStatusSave}
          onStatusCancel={() => setEditingStatus(null)}
          onViewOrder={setViewingOrder}
          emptyMessage={
            tab === 'week' ? 'No hay pagos registrados esta semana.' : 'No se encontraron pagos.'
          }
        />
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <PaymentStats
          chartRange={chartRange}
          setChartRange={setChartRange}
          chartData={chartData}
          chartPayments={chartPayments}
        />
      )}
    </motion.div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, colorClass }) => (
  <motion.div
    initial={{ y: 15, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  </motion.div>
);

// ── ChartCard ─────────────────────────────────────────────────────────────────

const ChartCard = ({ title, sub, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

// ── StatsDateFilter ───────────────────────────────────────────────────────────

const StatsDateFilter = ({ chartRange, setChartRange }) => {
  const isPreset = (fn) => {
    const p = fn();
    return p.from === chartRange.from && p.to === chartRange.to;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-3 mb-6">
      <span className="text-xs font-medium text-slate-500 shrink-0">Período</span>
      <div className="flex flex-wrap gap-2">
        {CHART_PRESETS.map(({ label, fn }) => (
          <button
            key={label}
            type="button"
            onClick={() => setChartRange(fn())}
            className={`text-xs px-3 py-1.5 rounded-xl border transition ${
              isPreset(fn)
                ? 'bg-emerald-600 text-white border-emerald-600'
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
          value={chartRange.from}
          max={chartRange.to}
          onChange={(e) => setChartRange((r) => ({ ...r, from: e.target.value }))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date"
          value={chartRange.to}
          min={chartRange.from}
          onChange={(e) => setChartRange((r) => ({ ...r, to: e.target.value }))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>
    </div>
  );
};

// ── PaymentStats ──────────────────────────────────────────────────────────────

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

const PaymentStats = ({ chartRange, setChartRange, chartData, chartPayments }) => {
  const { incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData, totalChart, pendingChart, cancelledChart } = chartData;
  const periodLabel = `${chartRange.from} → ${chartRange.to}`;
  const confirmedChart = totalChart - pendingChart - cancelledChart;

  return (
    <div className="space-y-5">
      <StatsDateFilter chartRange={chartRange} setChartRange={setChartRange} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Total en el período</p>
          <p className="text-2xl font-bold text-slate-800">{fmtCRC(totalChart)}</p>
          <p className="text-xs text-gray-400 mt-1">{chartPayments.length} pago{chartPayments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Confirmados</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtCRC(confirmedChart)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalChart > 0 ? `${((confirmedChart / totalChart) * 100).toFixed(0)}% del total` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-500">{fmtCRC(pendingChart)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalChart > 0 ? `${((pendingChart / totalChart) * 100).toFixed(0)}% del total` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Cancelados</p>
          <p className="text-2xl font-bold text-red-500">{fmtCRC(cancelledChart)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalChart > 0 ? `${((cancelledChart / totalChart) * 100).toFixed(0)}% del total` : '—'}
          </p>
        </div>
      </div>

      {/* Ingresos por día */}
      <ChartCard title="Ingresos por día" sub={periodLabel}>
        {incomeByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [fmtCRC(v), 'Ingresos']}
              />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Flujo acumulado */}
      <ChartCard title="Flujo acumulado de ingresos" sub={periodLabel}>
        {incomeByDay.every((d) => d.acumulado === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [fmtCRC(v), 'Acumulado']}
              />
              <Area
                type="monotone"
                dataKey="acumulado"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradIncome)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Por tipo + Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Ingresos por tipo de pago" sub={periodLabel}>
          {incomeByType.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={incomeByType}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                  label={renderDonutLabel}
                >
                  {incomeByType.map((_, i) => (
                    <Cell key={i} fill={TYPE_PIE_COLORS[i % TYPE_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [fmtCRC(v), n]}
                />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estado de pagos" sub={periodLabel}>
          {incomeByStatus.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={incomeByStatus}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                  label={renderDonutLabel}
                >
                  {incomeByStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [fmtCRC(v), n]}
                />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top clientes */}
      <ChartCard title="Top clientes por ingreso" sub={periodLabel}>
        {topClients.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, topClients.length * 42)}>
            <BarChart
              layout="vertical"
              data={topClients}
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [fmtCRC(v), 'Ingresos']}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {topClients.map((_, i) => (
                  <Cell key={i} fill={CLIENT_BAR_COLORS[i % CLIENT_BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Comparativa semanal */}
      {weeklyData.length > 1 && (
        <ChartCard title="Comparativa semanal" sub="Ingresos totales por semana en el período">
          <ResponsiveContainer width="100%" height={220}>
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
                formatter={(v) => [fmtCRC(v), 'Ingresos']}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

// ── PaymentTable ──────────────────────────────────────────────────────────────

const PaymentTable = ({
  payments,
  editingStatus,
  onStatusEdit,
  onStatusSave,
  onStatusCancel,
  onViewOrder,
  emptyMessage,
}) => {
  const [expandedPayment, setExpandedPayment] = useState(null);

  if (payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm p-12 text-center text-slate-400"
      >
        {emptyMessage}
      </motion.div>
    );
  }

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
              <th className="px-5 py-4 text-left font-semibold">Cliente</th>
              <th className="px-5 py-4 text-left font-semibold">Tipo</th>
              <th className="px-5 py-4 text-left font-semibold">Fecha</th>
              <th className="px-5 py-4 text-right font-semibold">Monto</th>
              <th className="px-5 py-4 text-center font-semibold">Órdenes</th>
              <th className="px-5 py-4 text-center font-semibold">Estado</th>
              <th className="px-5 py-4 text-center font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => {
              const isEditing = editingStatus?.id === p.id_payment;
              const isMonthly = p.payment_type === 'monthly';
              const orders = (p.payment_orders ?? []).map((po) => po.orders).filter(Boolean);
              const isExpanded = expandedPayment === p.id_payment;

              return (
                <React.Fragment key={p.id_payment}>
                  <tr
                    className={`border-t border-slate-100 transition ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">
                        {p.clients?.name ?? `Cliente ${p.client_id}`}
                      </p>
                      {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLOR[p.payment_type] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {TYPE_LABEL[p.payment_type] ?? p.payment_type}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(p.payment_date)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {p.currency ?? 'CRC'} {Number(p.amount).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isMonthly && orders.length > 0 ? (
                        <button
                          onClick={() => setExpandedPayment(isExpanded ? null : p.id_payment)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${isExpanded ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                        >
                          {orders.length}/4 ver
                        </button>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                          {orders.length}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={editingStatus.status}
                            onChange={(e) =>
                              onStatusEdit({ id: p.id_payment, status: e.target.value })
                            }
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                          <button
                            onClick={() => onStatusSave(p.id_payment, editingStatus.status)}
                            className="p-1 text-green-600 hover:text-green-700 transition"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={onStatusCancel}
                            className="p-1 text-red-400 hover:text-red-600 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isMonthly && orders.length === 1 && !isEditing && (
                          <button
                            onClick={() => onViewOrder(orders[0])}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver orden"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={() => onStatusEdit({ id: p.id_payment, status: p.status })}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Editar estado"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isMonthly && isExpanded && (
                    <tr key={`${p.id_payment}-orders`} className="bg-violet-50">
                      <td colSpan={7} className="px-5 py-3">
                        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">
                          Órdenes asociadas ({orders.length}/4)
                        </p>
                        <div className="space-y-1.5">
                          {orders.map((order) => (
                            <OrderMiniRow
                              key={order.id_order}
                              order={order}
                              onView={() => onViewOrder(order)}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan={3} className="px-5 py-3 text-xs text-slate-500 font-medium">
                {payments.length} registro{payments.length !== 1 ? 's' : ''}
              </td>
              <td className="px-5 py-3 text-right font-bold text-slate-800">
                ₡{total.toLocaleString()}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
};

// ── OrderMiniRow ──────────────────────────────────────────────────────────────

const ORDER_STATUS_LABEL = {
  PENDING: 'Pendiente',
  PACKED: 'Empacado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};
const ORDER_STATUS_COLOR = {
  PENDING: 'bg-amber-100 text-amber-700',
  PACKED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};
const CLS_LABEL = {
  Lunch: 'Almuerzo',
  Dinner: 'Cena',
  Family: 'Familiar',
  both: 'Almuerzo + Cena',
};

const fmtShort = (str) =>
  str
    ? new Date(str + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
    : '—';

const OrderMiniRow = ({ order, onView }) => (
  <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 shadow-sm">
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${ORDER_STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}
      >
        {ORDER_STATUS_LABEL[order.status] ?? order.status}
      </span>
      <span className="text-xs font-medium text-slate-700 truncate">
        {CLS_LABEL[order.classification] ?? order.classification}
      </span>
      <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
        {fmtShort(order.week_start_date)} — {fmtShort(order.week_end_date)}
      </span>
    </div>
    <button
      onClick={onView}
      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium shrink-0 transition"
    >
      <Eye size={12} /> Ver detalle
    </button>
  </div>
);

export default Payments;
