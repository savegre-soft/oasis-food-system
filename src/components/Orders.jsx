import { useEffect, useState, useMemo } from 'react';
import { ClipboardList, Calendar, History, ChevronLeft, ChevronRight, X, User, Users, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence, motion } from 'framer-motion';

import Modal from '../components/Modal';
import AddOrder from '../components/AddOrder';
import EditOrder from '../components/EditOrder';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_ORDER  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_LABELS = { Monday:'Lunes', Tuesday:'Martes', Wednesday:'Miércoles', Thursday:'Jueves', Friday:'Viernes', Saturday:'Sábado', Sunday:'Domingo' };
const DAY_SHORT  = { Monday:'Lun', Tuesday:'Mar', Wednesday:'Mié', Thursday:'Jue', Friday:'Vie', Saturday:'Sáb', Sunday:'Dom' };

const getNextWeekRange = () => {
  const today  = new Date();
  const day    = today.getDay();
  const diff   = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { weekStart: fmt(monday), weekEnd: fmt(sunday), monday };
};

const { weekStart: NEXT_WEEK_START, weekEnd: NEXT_WEEK_END, monday: NEXT_MONDAY } = getNextWeekRange();

const STATUS_STYLES = {
  PENDING:   { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PACKED:    { label: 'Empacado',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  DELIVERED: { label: 'Entregado', cls: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border-red-200' },
};

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

// ── OrderDetailModal ──────────────────────────────────────────────────────────
// Mirrors the step-4 summary of AddOrder

const OrderDetailModal = ({ order, onClose, onEdit }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!order) return null;

  const isFamilyClient = order.clients?.client_type === 'family';
  const st = STATUS_STYLES[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

  // Group order_days by day_of_week, sorted
  const dayMap = useMemo(() => {
    const map = {};
    (order.order_days ?? []).forEach((od) => {
      if (!map[od.day_of_week]) map[od.day_of_week] = { ...od, details: [] };
      (od.order_day_details ?? []).forEach((det) => map[od.day_of_week].details.push(det));
    });
    return map;
  }, [order]);

  const orderedDays = DAY_ORDER.filter((d) => dayMap[d]);

  // Delivery days from route
  const deliveryDays = order.routes?.route_delivery_days ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800 text-lg">{order.clients?.name}</p>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${isFamilyClient ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                {isFamilyClient ? <><Users size={10} className="inline mr-1"/>Familiar</> : <><User size={10} className="inline mr-1"/>Personal</>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {onEdit && (
              <button onClick={() => onEdit(order)} className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 transition">
                <Pencil size={12} /> Editar
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Semana */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Semana</p>
            <p className="text-sm text-slate-700">
              {fmtDate(order.week_start_date, { day: '2-digit', month: 'long' })} — {fmtDate(order.week_end_date, { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Menú */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Menú</p>
            <p className="text-sm text-slate-700">
              {isFamilyClient ? 'Familiar'
                : order.classification === 'both' ? 'Almuerzo + Cena'
                : order.classification === 'Lunch' ? '☀️ Solo Almuerzo'
                : order.classification === 'Dinner' ? '🌙 Solo Cena'
                : order.classification}
            </p>
          </div>

          {/* Ruta */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Ruta</p>
            {order.routes ? (
              <>
                <p className="text-sm font-medium text-slate-800">{order.routes.name}</p>
                {deliveryDays.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {deliveryDays.map((d, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Sin ruta asignada</p>
            )}
          </div>

          {/* Macros globales */}
          {!isFamilyClient && order.protein_snapshot && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Macros globales</p>
              <p className="text-sm text-slate-700">
                {order.classification !== 'Dinner' && (
                  <span>☀️ {order.protein_snapshot}{order.protein_unit_snapshot} prot · {order.carb_snapshot}{order.carb_unit_snapshot} carbos</span>
                )}

              </p>
            </div>
          )}

          {/* Días con recetas */}
          {orderedDays.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Días con recetas</p>
              <div className="space-y-2">
                {orderedDays.map((day) => {
                  const od = dayMap[day];
                  const details = od.details ?? [];
                  const daySt = STATUS_STYLES[od.status] ?? { label: od.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                  return (
                    <div key={day} className="flex items-start gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium min-w-[48px] text-center shrink-0 mt-0.5">
                        {DAY_SHORT[day]}
                      </span>
                      <div className="flex-1 min-w-0">
                        {details.length > 0 ? (
                          <div className="space-y-0.5">
                            {details.map((det, i) => (
                              <p key={i} className="text-xs text-slate-600">
                                {det.recipes?.name ?? '—'}
                                {det.quantity > 1 && <span className="text-slate-400"> ×{det.quantity}</span>}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Sin recetas</p>
                        )}
                        {od.delivery_date && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Entrega: {fmtDate(od.delivery_date, { day: '2-digit', month: 'short' })}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full border text-[10px] ${daySt.cls}`}>{daySt.label}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── OrderCard (clickable) ─────────────────────────────────────────────────────

const OrderCard = ({ order, onClick, onEdit }) => {
  const st = STATUS_STYLES[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <div className="group relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition">
      <button type="button" onClick={() => onClick(order)} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800">{order.clients?.name}</p>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {order.classification === 'Lunch' ? '☀️ Almuerzo'
                  : order.classification === 'Dinner' ? '🌙 Cena'
                  : order.classification}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {fmtDate(order.week_start_date, { day: '2-digit', month: 'short' })} — {fmtDate(order.week_end_date, { day: '2-digit', month: 'short', year: 'numeric' })}
              {order.routes && <span className="ml-3">· {order.routes.name}</span>}
            </p>
            {order.order_days?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {[...order.order_days]
                  .sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week))
                  .map((d) => (
                  <span key={d.id_order_day} className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {DAY_SHORT[d.day_of_week]}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-slate-300 shrink-0 mt-1" />
        </div>
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(order); }}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 transition shadow-md opacity-0 group-hover:opacity-100"
        >
          <Pencil size={12} /> Editar
        </button>
      )}
    </div>
  );
};

// ── MiniOrderCard (calendar cell) ─────────────────────────────────────────────

const MiniOrderCard = ({ order, dayOfWeek, onClick }) => {
  const st = STATUS_STYLES[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

  // Recipes for this specific day
  const dayDetails = useMemo(() => {
    const od = (order.order_days ?? []).find((d) => d.day_of_week === dayOfWeek);
    return od?.order_day_details ?? [];
  }, [order, dayOfWeek]);

  return (
    <button
      type="button"
      onClick={() => onClick(order)}
      className="w-full text-left bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm hover:border-slate-300 hover:shadow-md transition"
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className="font-semibold text-xs text-slate-800 truncate max-w-[100px]">{order.clients?.name}</span>
        <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${st.cls}`}>{st.label}</span>
      </div>
      {dayDetails.length > 0 ? (
        <div className="space-y-0.5">
          {dayDetails.map((det, i) => (
            <p key={i} className="text-[10px] text-slate-500 truncate">
              {det.recipes?.name ?? '—'}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-slate-300">Sin recetas</p>
      )}
    </button>
  );
};

// ── CalendarView ──────────────────────────────────────────────────────────────

const CalendarView = ({ orders, onOrderClick }) => {
  const cells = useMemo(() => {
    const map = {};
    DAY_ORDER.forEach((d) => { map[d] = []; });
    orders.forEach((order) => {
      const days = [...new Set((order.order_days ?? []).map((od) => od.day_of_week))];
      days.forEach((day) => { if (map[day]) map[day].push(order); });
    });
    return map;
  }, [orders]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid grid-cols-7 gap-2 min-w-[700px]">
        {DAY_ORDER.map((day, i) => {
          const date      = new Date(NEXT_MONDAY);
          date.setDate(NEXT_MONDAY.getDate() + i);
          const dateLabel = date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
          const dayOrders = cells[day] ?? [];

          return (
            <div key={day} className="flex flex-col gap-1.5">
              <div className="rounded-xl px-2 py-2 text-center bg-white border border-slate-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{DAY_SHORT[day]}</p>
                <p className="text-sm font-semibold text-slate-700">{dateLabel}</p>
                {dayOrders.length > 0 && (
                  <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-800 text-white px-1.5 py-0.5 rounded-full">
                    {dayOrders.length}
                  </span>
                )}
              </div>
              {dayOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-300 flex-1">—</div>
              ) : (
                <div className="space-y-1.5">
                  {dayOrders.map((order) => (
                    <MiniOrderCard key={order.id_order} order={order} dayOfWeek={day} onClick={onOrderClick} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── HistoryView ───────────────────────────────────────────────────────────────

const HISTORY_PAGE_SIZE = 8;

const HistoryView = ({ orders, onOrderClick, onEdit }) => {
  const [page, setPage] = useState(0);

  const grouped = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = o.week_start_date;
      if (!map[key]) map[key] = { weekStart: o.week_start_date, weekEnd: o.week_end_date, orders: [] };
      map[key].orders.push(o);
    });
    return Object.values(map).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [orders]);

  const totalPages = Math.ceil(grouped.length / HISTORY_PAGE_SIZE);
  const paginated  = grouped.slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <History size={40} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos históricos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {paginated.map(({ weekStart, weekEnd, orders: weekOrders }) => {
        const from = fmtDate(weekStart, { day: '2-digit', month: 'long' });
        const to   = fmtDate(weekEnd,   { day: '2-digit', month: 'long', year: 'numeric' });
        return (
          <div key={weekStart}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{from} — {to}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-3">
              {weekOrders.map((order) => (
                <OrderCard key={order.id_order} order={order} onClick={onOrderClick} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 disabled:opacity-30 transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-500">Página {page + 1} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 disabled:opacity-30 transition">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'week',    label: 'Esta semana', Icon: Calendar },
  { id: 'history', label: 'Histórico',   Icon: History  },
];

const Orders = () => {
  const { supabase } = useApp();

  const [allOrders,    setAllOrders]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [activeTab,    setActiveTab]    = useState('week');
  const [calendarView, setCalendarView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder,  setEditingOrder]  = useState(null);

  const getData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('orders')
      .select(`
        id_order,
        week_start_date,
        week_end_date,
        classification,
        status,
        protein_snapshot,
        protein_unit_snapshot,
        carb_snapshot,
        carb_unit_snapshot,
        clients ( id_client, name, client_type ),
        routes  ( id_route, name, route_delivery_days(day_of_week) ),
        order_days (
          id_order_day,
          day_of_week,
          delivery_date,
          status,
          order_day_details (
            id_order_day_detail,
            recipe_id,
            quantity,
            recipes ( id_recipe, name )
          )
        )
      `)
      .order('week_start_date', { ascending: false })
      .order('id_order',        { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }
    setAllOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { getData(); }, []);

  // "Esta semana" = orders for the upcoming delivery week (next week).
  // If none exist yet, fall back to the most recent week found in data.
  const currentWeekOrders = useMemo(() =>
    allOrders.filter((o) => o.week_start_date === NEXT_WEEK_START && o.week_end_date === NEXT_WEEK_END),
    [allOrders]);

  const latestWeekStart = useMemo(() => {
    if (currentWeekOrders.length > 0) return NEXT_WEEK_START;
    // fallback: most recent week_start_date in data
    const dates = allOrders.map((o) => o.week_start_date).filter(Boolean);
    return dates.length > 0 ? [...dates].sort().reverse()[0] : null;
  }, [allOrders, currentWeekOrders]);

  const weekOrders = useMemo(() =>
    allOrders.filter((o) => o.week_start_date === latestWeekStart),
    [allOrders, latestWeekStart]);

  const historyOrders = useMemo(() =>
    allOrders.filter((o) => o.week_start_date !== latestWeekStart),
    [allOrders, latestWeekStart]);

  const weekLabel = useMemo(() => {
    if (!latestWeekStart) return '';
    const ws = weekOrders[0]?.week_start_date ?? latestWeekStart;
    const we = weekOrders[0]?.week_end_date ?? NEXT_WEEK_END;
    return `${fmtDate(ws, { day: '2-digit', month: 'long' })} — ${fmtDate(we, { day: '2-digit', month: 'long', year: 'numeric' })}`;
  }, [weekOrders, latestWeekStart]);

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => { setShowModal(false); getData(); }}>
            <AddOrder onSuccess={() => { setShowModal(false); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onEdit={(o) => { setSelectedOrder(null); setEditingOrder(o); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingOrder && (
          <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)}>
            <EditOrder order={editingOrder} onSuccess={() => { setEditingOrder(null); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Pedidos</h1>
            <p className="text-slate-500 mt-1">Gestiona y consulta los pedidos semanales</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium">
            <ClipboardList size={16} /> Nuevo Pedido
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
          {TABS.map(({ id, label, Icon }) => {
            const count  = id === 'week' ? weekOrders.length : historyOrders.length;
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${active ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${active ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Cargando...</p>
        ) : (
          <AnimatePresence mode="wait">

            {activeTab === 'week' && (
              <motion.div key="week" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Semana de entrega</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{weekLabel}</p>
                  </div>
                  {weekOrders.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                      <button onClick={() => setCalendarView(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${!calendarView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <ClipboardList size={13} /> Lista
                      </button>
                      <button onClick={() => setCalendarView(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${calendarView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Calendar size={13} /> Calendario
                      </button>
                    </div>
                  )}
                </div>

                {weekOrders.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay pedidos para esta semana</p>
                    <p className="text-xs mt-1 text-slate-300">{weekLabel}</p>
                  </div>
                ) : calendarView ? (
                  <CalendarView orders={weekOrders} onOrderClick={setSelectedOrder} />
                ) : (
                  <div className="space-y-3">
                    {weekOrders.map((order) => (
                      <OrderCard key={order.id_order} order={order} onClick={setSelectedOrder} onEdit={setEditingOrder} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <HistoryView orders={historyOrders} onOrderClick={setSelectedOrder} onEdit={setEditingOrder} />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default Orders;
