import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, Search, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';

import { useApp } from '../context/AppContext';
import DatePicker from '../components/DatePicker';
import OrderDetailModal from '../components/OrderDetailModal';
import PaymentTable from '../components/payment/PaymentTable';
import PaymentStats from '../components/payment/PaymentStats';
import { isoWeekMonday } from '../utils/chartUtils';
import { getThisMonth } from '../hooks/useDashboardData';

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

// ── Sub-component ─────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

const Payments = () => {
  const { supabase } = useApp();

  const [payments, setPayments]           = useState([]);
  const [tab, setTab]                     = useState('week');
  const [search, setSearch]               = useState('');
  const [dateRange, setDateRange]         = useState({ startDate: null, endDate: null });
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [chartRange, setChartRange]       = useState(getThisMonth);
  const [viewingOrder, setViewingOrder]   = useState(null);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('payments')
      .select(`
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
      `)
      .order('payment_date', { ascending: false });

    if (error) { console.error(error); return; }
    setPayments(data ?? []);
  };

  useEffect(() => { fetchPayments(); }, [supabase]);

  // ── Derived data — table ────────────────────────────────────────────────────

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

  const totalWeek    = weekPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalAll     = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const pendingAmount = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  // ── Derived data — charts ───────────────────────────────────────────────────

  const chartPayments = useMemo(() => {
    const from = new Date(chartRange.from + 'T00:00:00');
    const to   = new Date(chartRange.to   + 'T23:59:59');
    return payments.filter((p) => {
      const d = new Date(p.payment_date + 'T00:00:00');
      return d >= from && d <= to;
    });
  }, [payments, chartRange]);

  const chartData = useMemo(() => {
    const dayMap = {};
    for (
      let d = new Date(chartRange.from + 'T00:00:00');
      d <= new Date(chartRange.to + 'T00:00:00');
      d.setDate(d.getDate() + 1)
    ) {
      dayMap[d.toISOString().split('T')[0]] = 0;
    }

    const typeMap   = { monthly: 0, weekly: 0, express: 0 };
    const statusMap = { pending: 0, cancelled: 0 };
    const clientMap = {};
    const weekMap   = {};

    chartPayments.forEach((p) => {
      const amt = p.amount || 0;
      if (p.payment_date in dayMap) dayMap[p.payment_date] += amt;
      if (p.payment_type in typeMap) typeMap[p.payment_type] += amt;
      if (p.status in statusMap) statusMap[p.status] += amt;
      const clientName = p.clients?.name || `Cliente ${p.client_id}`;
      clientMap[clientName] = (clientMap[clientName] || 0) + amt;
      const weekKey = isoWeekMonday(p.payment_date);
      weekMap[weekKey] = (weekMap[weekKey] || 0) + amt;
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

    const totalChart     = chartPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingChart   = chartPayments.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
    const cancelledChart = chartPayments.filter((p) => p.status === 'cancelled').reduce((s, p) => s + (p.amount || 0), 0);

    return { incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData, totalChart, pendingChart, cancelledChart };
  }, [chartPayments, chartRange]);

  // ── Status update ───────────────────────────────────────────────────────────

  const handleStatusSave = async (id, newStatus) => {
    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .update({ status: newStatus })
      .eq('id_payment', id);

    if (error) { sileo.error('No se pudo actualizar el estado'); return; }
    sileo.success('Estado actualizado');
    setEditingStatus(null);
    await fetchPayments();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div className="min-h-screen bg-slate-50 p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>
        {viewingOrder && <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ y: -25, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Ingresos</h1>
        <p className="text-slate-500 mt-1">Pagos asociados a órdenes de clientes</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard icon={<TrendingUp size={22} />}  label="Esta semana"    value={`₡${totalWeek.toLocaleString()}`}   colorClass="bg-green-50 text-green-600" />
        <SummaryCard icon={<DollarSign size={22} />}  label="Total histórico" value={`₡${totalAll.toLocaleString()}`}    colorClass="bg-slate-100 text-slate-600" />
        <SummaryCard icon={<Clock size={22} />}       label="Pendientes"      value={`${pendingCount} pago${pendingCount !== 1 ? 's' : ''} · ₡${pendingAmount.toLocaleString()}`} colorClass="bg-yellow-50 text-yellow-600" />
      </div>

      {/* Tab + Status filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
          {[['week', 'Esta Semana'], ['history', 'Historial'], ['stats', 'Estadísticas']].map(([val, lbl]) => (
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
            {[['all', 'Todos'], ['pending', 'Pendientes'], ['cancelled', 'Cancelados']].map(([val, lbl]) => (
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

      {/* Table */}
      {tab !== 'stats' && (
        <PaymentTable
          payments={displayList}
          editingStatus={editingStatus}
          onStatusEdit={setEditingStatus}
          onStatusSave={handleStatusSave}
          onStatusCancel={() => setEditingStatus(null)}
          onViewOrder={setViewingOrder}
          emptyMessage={tab === 'week' ? 'No hay pagos registrados esta semana.' : 'No se encontraron pagos.'}
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

export default Payments;
