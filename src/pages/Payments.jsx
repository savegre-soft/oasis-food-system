import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, Search, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';
import AuthRoles from '../components/auth/AuthRoles';

import { useApp } from '../context/AppContext';
import DatePicker from '../components/DatePicker';
import ConfirmDialog from '../components/ConfirmDialog';
import OrderDetailModal from '../components/OrderDetailModal';
import PaymentTable from '../components/payment/PaymentTable';
import PaymentStats from '../components/payment/PaymentStats';
import ManualIncomeModal from '../components/payment/ManualIncomeModal';
import { buildIncomeStats, PAYMENT_STATUS_LABEL, PAYMENT_TYPE_LABEL } from '../utils/chartUtils';
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

  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('week');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [onlyAvailableMonthly, setOnlyAvailableMonthly] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [chartRange, setChartRange] = useState(getThisMonth);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showManualIncome, setShowManualIncome] = useState(false);
  const [closingPayment, setClosingPayment] = useState(null);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('payments')
      .select(
        `
        id_payment, client_id, payment_type, amount, currency,
        payment_date, period_start_date, period_end_date, closed_at, status, notes, created_at,
        clients(name),
        payment_orders(
          id_payment_order, order_id,
          orders(
            id_order, week_start_date, week_end_date, classification, status, created_at,
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
      .order('payment_date', { ascending: false, nullsFirst: false });

    if (error) {
      console.error(error);
      return;
    }
    setPayments(data ?? []);
  };

  useEffect(() => {
    fetchPayments();
  }, [supabase]);

  useEffect(() => {
    setSelectedIds([]);
  }, [tab, statusFilter, clientFilter, typeFilter, search, dateRange]);

  // ── Derived data — filter options ───────────────────────────────────────────

  const clientOptions = useMemo(() => {
    const map = new Map();
    payments.forEach((p) => {
      const key = p.client_id ?? 'manual';
      const name = p.clients?.name ?? (p.client_id ? `Cliente ${p.client_id}` : 'Ingreso manual');
      if (!map.has(key)) map.set(key, name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [payments]);

  const typeOptions = useMemo(() => {
    const present = new Set(payments.map((p) => p.payment_type).filter(Boolean));
    return Array.from(present).sort((a, b) => (PAYMENT_TYPE_LABEL[a] ?? a).localeCompare(PAYMENT_TYPE_LABEL[b] ?? b));
  }, [payments]);

  // ── Derived data — table ────────────────────────────────────────────────────

  // Pagos pending (de cualquier tipo) pueden no tener payment_date todavía —
  // se llena sola cuando se marcan pagados. Mientras tanto, se ubican por el
  // inicio de su período (monthly) o por created_at, para que no desaparezcan
  // de las vistas filtradas por fecha.
  const effectiveDate = (p) => p.payment_date || p.period_start_date || p.created_at?.split('T')[0];

  const { start: weekStart, end: weekEnd } = getWeekRange();

  const weekPayments = payments.filter((p) => {
    const raw = effectiveDate(p);
    if (!raw) return false;
    const d = new Date(raw + 'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });

  const historyPayments = payments
    .filter((p) => {
      const term = search.toLowerCase();
      const clientName = (p.clients?.name ?? '').toLowerCase();
      const notes = (p.notes ?? '').toLowerCase();
      return clientName.includes(term) || notes.includes(term);
    })
    .filter((p) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const raw = effectiveDate(p);
      if (!raw) return false;
      const d = new Date(raw + 'T00:00:00');
      return d >= new Date(dateRange.startDate) && d <= new Date(dateRange.endDate);
    });

  const todayStr = new Date().toISOString().split('T')[0];

  // Mismo criterio de "espacio disponible" que usa AddOrder.jsx para ofrecer
  // un pago mensual como reutilizable: no cancelado, no cerrado manualmente,
  // menos de 4 órdenes vinculadas, y período todavía vigente.
  const hasAvailableSpace = (p) =>
    p.status !== 'cancelled' &&
    !p.closed_at &&
    (p.payment_orders?.length ?? 0) < 4 &&
    (!p.period_end_date || p.period_end_date >= todayStr);

  const displayList = (tab === 'week' ? weekPayments : historyPayments)
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .filter((p) => clientFilter === 'all' || String(p.client_id ?? 'manual') === clientFilter)
    .filter((p) => typeFilter === 'all' || p.payment_type === typeFilter)
    .filter((p) => typeFilter !== 'monthly' || !onlyAvailableMonthly || hasAvailableSpace(p));

  const totalWeek = weekPayments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalAll = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + (p.amount || 0), 0);

  // ── Derived data — charts ───────────────────────────────────────────────────

  const chartPayments = useMemo(() => {
    const from = new Date(chartRange.from + 'T00:00:00');
    const to = new Date(chartRange.to + 'T23:59:59');
    return payments.filter((p) => {
      const raw = effectiveDate(p);
      if (!raw) return false;
      const d = new Date(raw + 'T00:00:00');
      return d >= from && d <= to;
    });
  }, [payments, chartRange]);

  const chartData = useMemo(
    () => buildIncomeStats(chartPayments, chartRange),
    [chartPayments, chartRange]
  );

  // ── Status update ───────────────────────────────────────────────────────────

  // Al marcar un pago mensual como 'paid', si todavía no tiene payment_date
  // (se dejó pendiente al crearlo), se completa con la fecha de hoy — es el
  // momento en que se está registrando el cobro real.
  const buildStatusPayload = (payment, newStatus) => {
    const payload = { status: newStatus };
    // Aplica a cualquier tipo de pago: si todavía no tiene payment_date (se
    // dejó pendiente al crearlo), se completa con la fecha de hoy al pasar a 'paid'.
    if (newStatus === 'paid' && !payment?.payment_date) {
      payload.payment_date = new Date().toISOString().split('T')[0];
    }
    return payload;
  };

  const handleStatusSave = async (id, newStatus) => {
    const current = payments.find((p) => p.id_payment === id);
    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .update(buildStatusPayload(current, newStatus))
      .eq('id_payment', id);

    const label = PAYMENT_STATUS_LABEL[newStatus] ?? newStatus;
    if (error) {
      sileo.error(`No se pudo marcar como ${label}`);
      return;
    }
    sileo.success(`Marcado como ${label}`);
    setEditingStatus(null);
    await fetchPayments();
  };

  const handleBulkStatusSave = async (ids, newStatus) => {
    if (ids.length === 0) return;

    // payment_date solo se completa para los que aún no lo tienen, así que
    // hay que separar el update en dos grupos si no todos necesitan el mismo payload.
    const groups = new Map();
    for (const id of ids) {
      const current = payments.find((p) => p.id_payment === id);
      const key = JSON.stringify(buildStatusPayload(current, newStatus));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(id);
    }

    for (const [payloadStr, groupIds] of groups) {
      const { error } = await supabase
        .schema('operations')
        .from('payments')
        .update(JSON.parse(payloadStr))
        .in('id_payment', groupIds);
      if (error) {
        const label = PAYMENT_STATUS_LABEL[newStatus] ?? newStatus;
        sileo.error(`No se pudo marcar los pagos seleccionados como ${label}`);
        return;
      }
    }

    const label = PAYMENT_STATUS_LABEL[newStatus] ?? newStatus;
    sileo.success(`${ids.length} pago${ids.length !== 1 ? 's' : ''} marcado${ids.length !== 1 ? 's' : ''} como ${label}`);
    setSelectedIds([]);
    await fetchPayments();
  };

  const toggleSelectId = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = (ids) => {
    setSelectedIds((prev) => (ids.every((id) => prev.includes(id)) ? [] : ids));
  };

  const handleAmountSave = async (id, newAmount) => {
    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .update({ amount: newAmount })
      .eq('id_payment', id);

    if (error) {
      sileo.error('No se pudo actualizar el monto');
      return;
    }
    sileo.success('Monto actualizado');
    await fetchPayments();
  };

  // Cierra manualmente un pago mensual aunque no tenga las 4 órdenes
  // completas — deja de ofrecerse para reutilizar en el asistente de pedidos.
  const handleClosePayment = async () => {
    if (!closingPayment) return;
    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .update({ closed_at: new Date().toISOString() })
      .eq('id_payment', closingPayment.id_payment);

    if (error) {
      sileo.error('No se pudo cerrar el pago');
      return;
    }
    sileo.success('Pago cerrado');
    setClosingPayment(null);
    await fetchPayments();
  };

  // Elimina un pago de forma permanente. Si todavía tiene órdenes vinculadas,
  // primero se desvinculan (no se borran las órdenes, solo dejan de tener
  // un pago asociado) para no depender de si la FK tiene cascada configurada.
  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    if ((deletingPayment.payment_orders?.length ?? 0) > 0) {
      const { error: unlinkError } = await supabase
        .schema('operations')
        .from('payment_orders')
        .delete()
        .eq('payment_id', deletingPayment.id_payment);
      if (unlinkError) {
        sileo.error('No se pudo desvincular las órdenes de este pago');
        return;
      }
    }

    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .delete()
      .eq('id_payment', deletingPayment.id_payment);

    if (error) {
      sileo.error('No se pudo eliminar el pago');
      return;
    }
    sileo.success('Pago eliminado');
    setDeletingPayment(null);
    await fetchPayments();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthRoles rolesNames={['Finanzas', 'Administrador']}>
      <motion.div
        className="min-h-screen bg-slate-50 p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence>
          {viewingOrder && (
            <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
          )}
          {showManualIncome && (
            <ManualIncomeModal
              onClose={() => setShowManualIncome(false)}
              onSuccess={async () => {
                setShowManualIncome(false);
                await fetchPayments();
              }}
            />
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={!!closingPayment}
          title="¿Cerrar este pago mensual?"
          message={
            closingPayment
              ? `Tiene ${closingPayment.payment_orders?.length ?? 0}/4 órdenes vinculadas. Si lo cerrás, no se va a poder asociar ningún pedido más a este pago aunque le quede espacio — el cliente necesitará un pago nuevo para las siguientes órdenes. Esta acción no se puede deshacer desde la interfaz.`
              : ''
          }
          confirmLabel="Cerrar pago"
          confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition"
          onConfirm={handleClosePayment}
          onCancel={() => setClosingPayment(null)}
        />

        <ConfirmDialog
          open={!!deletingPayment}
          title="¿Eliminar este pago?"
          message={
            deletingPayment
              ? `Esta acción es permanente y no se puede deshacer.${
                  (deletingPayment.payment_orders?.length ?? 0) > 0
                    ? ` Tiene ${deletingPayment.payment_orders.length} orden${deletingPayment.payment_orders.length !== 1 ? 'es' : ''} vinculada${deletingPayment.payment_orders.length !== 1 ? 's' : ''} que va${deletingPayment.payment_orders.length !== 1 ? 'n' : ''} a quedar sin pago asociado.`
                    : ''
                }`
              : ''
          }
          confirmLabel="Eliminar"
          confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          onConfirm={handleDeletePayment}
          onCancel={() => setDeletingPayment(null)}
        />

        {/* Header */}
        <motion.div
          initial={{ y: -25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Ingresos</h1>
            <p className="text-slate-500 mt-1">Pagos asociados a órdenes de clientes</p>
          </div>
          <button
            onClick={() => setShowManualIncome(true)}
            className="shrink-0 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
          >
            + Registrar ingreso manual
          </button>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            icon={<TrendingUp size={22} />}
            label="Cobrado esta semana"
            value={`₡${totalWeek.toLocaleString()}`}
            colorClass="bg-green-50 text-green-600"
          />
          <SummaryCard
            icon={<DollarSign size={22} />}
            label="Cobrado histórico"
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
                ['paid', 'Pagados'],
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

        {/* Client + Type filters */}
        {tab !== 'stats' && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
            >
              <option value="all">Todos los clientes</option>
              {clientOptions.map(([key, name]) => (
                <option key={key} value={String(key)}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                if (e.target.value !== 'monthly') setOnlyAvailableMonthly(false);
              }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
            >
              <option value="all">Todos los tipos</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {PAYMENT_TYPE_LABEL[type] ?? type}
                </option>
              ))}
            </select>

            {typeFilter === 'monthly' && (
              <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={onlyAvailableMonthly}
                  onChange={(e) => setOnlyAvailableMonthly(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-slate-800"
                />
                Solo con espacio disponible
              </label>
            )}

            {(clientFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setClientFilter('all');
                  setTypeFilter('all');
                  setOnlyAvailableMonthly(false);
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition px-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

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
                  placeholder="Buscar cliente o descripción…"
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
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectId}
            onToggleSelectAll={toggleSelectAll}
            onBulkStatusSave={handleBulkStatusSave}
            onAmountSave={handleAmountSave}
            onClosePayment={setClosingPayment}
            onDeletePayment={setDeletingPayment}
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
    </AuthRoles>
  );
};

export default Payments;
