import { useEffect, useState, useMemo } from 'react';
import {
  ClipboardList,
  Calendar,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Users,
  Pencil,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence, motion } from 'framer-motion';

import Modal from '../components/Modal';
import AddOrder from '../components/AddOrder';
import EditOrder from '../components/EditOrder';
import { MACRO_UNIT } from '../components/orderUtils';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};
const DAY_SHORT = {
  Monday: 'Lun',
  Tuesday: 'Mar',
  Wednesday: 'Mié',
  Thursday: 'Jue',
  Friday: 'Vie',
  Saturday: 'Sáb',
  Sunday: 'Dom',
};

const STATUS_STYLES = {
  PENDING: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PACKED: { label: 'Empacado', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  DELIVERED: { label: 'Entregado', cls: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border-red-200' },
};

const TABS = [
  { id: 'week', label: 'Esta semana', Icon: Calendar },
  { id: 'history', label: 'Historico', Icon: History },
];

const HISTORY_PAGE_SIZE = 8;

const getNextWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { weekStart: fmt(monday), weekEnd: fmt(sunday), monday };
};

const {
  weekStart: NEXT_WEEK_START,
  weekEnd: NEXT_WEEK_END,
  monday: NEXT_MONDAY,
} = getNextWeekRange();

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

// ── OrderDetailModal ──────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose, onEdit }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!order) return null;

  const isFamilyClient = order.clients?.client_type === 'family';
  const st = STATUS_STYLES[order.status] ?? {
    label: order.status,
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const dayMap = {};
  (order.order_days ?? []).forEach((od) => {
    if (!dayMap[od.day_of_week]) dayMap[od.day_of_week] = { ...od, details: [] };
    (od.order_day_details ?? []).forEach((det) => dayMap[od.day_of_week].details.push(det));
  });
  const orderedDays = DAY_ORDER.filter((d) => dayMap[d]);
  const deliveryDays = order.routes?.route_delivery_days ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-transparent dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">
              {order.clients?.name}
            </p>
            <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full border ' + st.cls}>
              {st.label}
            </span>
            <span
              className={
                'text-xs font-medium px-2.5 py-0.5 rounded-full ' +
                (isFamilyClient
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400')
              }
            >
              {isFamilyClient ? (
                <>
                  <Users size={10} className="inline mr-1" /> Familiar
                </>
              ) : (
                <>
                  <User size={10} className="inline mr-1" /> Personal
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 dark:bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 dark:hover:bg-indigo-500 transition shadow-sm"
              >
                <Pencil size={12} /> Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 dark:text-slate-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-5">
          <section>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">
              Semana
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {fmtDate(order.week_start_date, { day: '2-digit', month: 'long' })}
              {' — '}
              {fmtDate(order.week_end_date, { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </section>

          <section>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">
              Menú
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {isFamilyClient
                ? 'Familiar'
                : order.classification === 'both'
                  ? 'Almuerzo + Cena'
                  : order.classification === 'Lunch'
                    ? 'Almuerzo'
                    : order.classification === 'Dinner'
                      ? 'Cena'
                      : order.classification}
            </p>
          </section>

          <section>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">
              Ruta
            </p>
            {order.routes ? (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {order.routes.name}
                </p>
                {deliveryDays.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {deliveryDays.map((d, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-600"
                      >
                        {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-600 italic">Sin ruta asignada</p>
            )}
          </section>

          {/* Macros */}
          {!isFamilyClient && order.protein_snapshot != null && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1.5">
                Macros globales
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {order.classification === 'Dinner' ? '🌙 ' : '☀️ '}
                {order.protein_snapshot} {MACRO_UNIT} prot
                <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                {order.carb_snapshot} {MACRO_UNIT} carbos
              </p>
            </div>
          )}

          {/* Listado de Días */}
          {orderedDays.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-3">
                Días con recetas
              </p>
              <div className="space-y-3">
                {orderedDays.map((day) => {
                  const od = dayMap[day];
                  const details = od.details ?? [];
                  const daySt = STATUS_STYLES[od.status] ?? {
                    label: od.status,
                    cls: 'bg-slate-100 text-slate-600 border-slate-200',
                  };
                  return (
                    <div
                      key={day}
                      className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg font-bold min-w-[48px] text-center shrink-0">
                        {DAY_SHORT[day]}
                      </span>
                      <div className="flex-1 min-w-0">
                        {details.length > 0 ? (
                          <div className="space-y-1">
                            {details.map((det, i) => (
                              <p
                                key={i}
                                className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                              >
                                <span className="font-medium">{det.recipes?.name ?? 'Receta'}</span>
                                {det.quantity > 1 && (
                                  <span className="text-indigo-500 dark:text-indigo-400 font-bold">
                                    {' '}
                                    ×{det.quantity}
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-600">Sin recetas</p>
                        )}
                        {od.delivery_date && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar size={10} />
                              {fmtDate(od.delivery_date, { day: '2-digit', month: 'short' })}
                            </p>
                            <span
                              className={
                                'px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ' +
                                daySt.cls
                              }
                            >
                              {daySt.label}
                            </span>
                          </div>
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

// ── OrderCard ─────────────────────────────────────────────────────────────────

const OrderCard = ({ order, onClick, onEdit }) => {
  const st = STATUS_STYLES[order.status] ?? {
    label: order.status,
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <div className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all">
      <button type="button" onClick={() => onClick(order)} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {order.clients?.name}
              </p>

              {/* Badge de Estado Principal (asumiendo que st.cls viene del backend/helper) */}
              <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full border ' + st.cls}>
                {st.label}
              </span>

              {/* Badge de Clasificación (Almuerzo/Cena) */}
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {order.classification === 'Lunch'
                  ? 'Almuerzo'
                  : order.classification === 'Dinner'
                    ? 'Cena'
                    : order.classification}
              </span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {fmtDate(order.week_start_date, { day: '2-digit', month: 'short' })}
              {' — '}
              {fmtDate(order.week_end_date, { day: '2-digit', month: 'short', year: 'numeric' })}
              {order.routes && (
                <span className="ml-3 font-medium text-slate-600 dark:text-slate-300">
                  {'· ' + order.routes.name}
                </span>
              )}
            </p>

            {order.order_days?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {[...order.order_days]
                  .sort(
                    (a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week)
                  )
                  .map((d) => (
                    <span
                      key={d.id_order_day}
                      className={
                        'text-xs font-medium px-2 py-0.5 rounded-full ' +
                        (d.status === 'DELIVERED'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400')
                      }
                    >
                      {DAY_SHORT[d.day_of_week]}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
        </div>
      </button>

      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(order);
          }}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium bg-slate-800 dark:bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 dark:hover:bg-indigo-500 transition shadow-md opacity-0 group-hover:opacity-100"
        >
          <Pencil size={12} /> Editar
        </button>
      )}
    </div>
  );
};

// ── MiniOrderCard ─────────────────────────────────────────────────────────────

const MiniOrderCard = ({ order, dayOfWeek, onClick }) => {
  const st = STATUS_STYLES[order.status] ?? {
    label: order.status,
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const od = (order.order_days ?? []).find((d) => d.day_of_week === dayOfWeek);
  const dayDetails = od?.order_day_details ?? [];

  return (
    <button
      type="button"
      onClick={() => onClick(order)}
      className="w-full text-left bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm hover:border-slate-300 hover:shadow-md transition"
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className="font-semibold text-xs text-slate-800 truncate max-w-[100px]">
          {order.clients?.name}
        </span>
        <span className={'px-1.5 py-0.5 rounded-full border text-[10px] font-medium ' + st.cls}>
          {st.label}
        </span>
      </div>
      {dayDetails.length > 0 ? (
        <div className="space-y-0.5">
          {dayDetails.map((det, i) => (
            <p key={i} className="text-[10px] text-slate-500 truncate">
              {det.recipes?.name ?? 'Receta'}
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
    DAY_ORDER.forEach((d) => {
      map[d] = [];
    });
    orders.forEach((order) => {
      const days = [...new Set((order.order_days ?? []).map((od) => od.day_of_week))];
      days.forEach((day) => {
        if (map[day]) map[day].push(order);
      });
    });
    return map;
  }, [orders]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid grid-cols-7 gap-2 min-w-[700px]">
        {DAY_ORDER.map((day, i) => {
          const date = new Date(NEXT_MONDAY);
          date.setDate(NEXT_MONDAY.getDate() + i);
          const dateLabel = date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
          const dayOrders = cells[day] ?? [];

          return (
            <div key={day} className="flex flex-col gap-1.5">
              <div className="rounded-xl px-2 py-2 text-center bg-white border border-slate-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {DAY_SHORT[day]}
                </p>
                <p className="text-sm font-semibold text-slate-700">{dateLabel}</p>
                {dayOrders.length > 0 && (
                  <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-800 text-white px-1.5 py-0.5 rounded-full">
                    {dayOrders.length}
                  </span>
                )}
              </div>
              {dayOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-300 flex-1">
                  -
                </div>
              ) : (
                <div className="space-y-1.5">
                  {dayOrders.map((order) => (
                    <MiniOrderCard
                      key={order.id_order}
                      order={order}
                      dayOfWeek={day}
                      onClick={onOrderClick}
                    />
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

const HistoryView = ({ orders, onOrderClick, onEdit }) => {
  const [page, setPage] = useState(0);

  const grouped = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = o.week_start_date;
      if (!map[key])
        map[key] = { weekStart: o.week_start_date, weekEnd: o.week_end_date, orders: [] };
      map[key].orders.push(o);
    });
    return Object.values(map).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [orders]);

  const totalPages = Math.ceil(grouped.length / HISTORY_PAGE_SIZE);
  const paginated = grouped.slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <History size={40} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos historicos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {paginated.map(({ weekStart, weekEnd, orders: weekOrders }) => (
        <div key={weekStart}>
          {/* Separador de Fecha */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">
              {fmtDate(weekStart, { day: '2-digit', month: 'long' })}
              {' - '}
              {fmtDate(weekEnd, { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="space-y-3">
            {weekOrders.map((order) => (
              <OrderCard
                key={order.id_order}
                order={order}
                onClick={onOrderClick}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-30 transition shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {'Página ' + (page + 1) + ' de ' + totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-30 transition shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const Orders = () => {
  const { supabase } = useApp();

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('week');
  const [calendarView, setCalendarView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [search, setSearch] = useState('');

  const getData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('orders')
      .select(
        `
        id_order,
        week_start_date,
        week_end_date,
        classification,
        status,
        protein_snapshot,
        carb_snapshot,
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
      `
      )
      .order('week_start_date', { ascending: false })
      .order('id_order', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setAllOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  const currentWeekOrders = useMemo(
    () =>
      allOrders.filter(
        (o) => o.week_start_date === NEXT_WEEK_START && o.week_end_date === NEXT_WEEK_END
      ),
    [allOrders]
  );

  const latestWeekStart = useMemo(() => {
    if (currentWeekOrders.length > 0) return NEXT_WEEK_START;
    const dates = allOrders.map((o) => o.week_start_date).filter(Boolean);
    return dates.length > 0 ? [...dates].sort().reverse()[0] : null;
  }, [allOrders, currentWeekOrders]);

  const weekOrders = useMemo(
    () => allOrders.filter((o) => o.week_start_date === latestWeekStart),
    [allOrders, latestWeekStart]
  );

  const historyOrders = useMemo(
    () => allOrders.filter((o) => o.week_start_date !== latestWeekStart),
    [allOrders, latestWeekStart]
  );

  const weekLabel = useMemo(() => {
    if (!latestWeekStart) return '';
    const ws = weekOrders[0]?.week_start_date ?? latestWeekStart;
    const we = weekOrders[0]?.week_end_date ?? NEXT_WEEK_END;
    return (
      fmtDate(ws, { day: '2-digit', month: 'long' }) +
      ' - ' +
      fmtDate(we, { day: '2-digit', month: 'long', year: 'numeric' })
    );
  }, [weekOrders, latestWeekStart]);

  const applySearch = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (o) => o.clients?.name?.toLowerCase().includes(q) || o.routes?.name?.toLowerCase().includes(q)
    );
  };

  const filteredWeek = applySearch(weekOrders);
  const filteredHistory = applySearch(historyOrders);

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              getData();
            }}
          >
            <AddOrder
              onSuccess={() => {
                setShowModal(false);
                getData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onEdit={(o) => {
              setSelectedOrder(null);
              setEditingOrder(o);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingOrder && (
          <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)}>
            <EditOrder
              order={editingOrder}
              onSuccess={() => {
                setEditingOrder(null);
                getData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pedidos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gestiona y consulta los pedidos semanales
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 dark:hover:bg-indigo-500 transition text-sm font-medium shrink-0 shadow-sm"
          >
            <ClipboardList size={16} /> Nuevo Pedido
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative mb-5 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o ruta..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 transition-colors"
          />
        </div>

        {/* Tabs Principales */}
        <div className="flex items-center gap-1 mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 w-fit shadow-sm">
          {TABS.map(({ id, label, Icon }) => {
            const count = id === 'week' ? filteredWeek.length : filteredHistory.length;
            const active = activeTab === id;
            const cls =
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ' +
              (active
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200');
            const badgeCls =
              'text-xs px-1.5 py-0.5 rounded-full font-semibold ' +
              (active
                ? 'bg-slate-600 dark:bg-slate-500 text-slate-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400');
            return (
              <button key={id} onClick={() => setActiveTab(id)} className={cls}>
                <Icon size={15} />
                {label}
                {count > 0 && <span className={badgeCls}>{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'week' && (
              <motion.div
                key="week"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">
                      Semana de entrega
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {weekLabel}
                    </p>
                  </div>

                  {/* Selector Vista Lista/Calendario */}
                  {filteredWeek.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border dark:border-slate-800">
                      <button
                        onClick={() => setCalendarView(false)}
                        className={
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ' +
                          (!calendarView
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')
                        }
                      >
                        <ClipboardList size={13} /> Lista
                      </button>
                      <button
                        onClick={() => setCalendarView(true)}
                        className={
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ' +
                          (calendarView
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')
                        }
                      >
                        <Calendar size={13} /> Calendario
                      </button>
                    </div>
                  )}
                </div>

                {filteredWeek.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                    <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{search ? 'Sin resultados' : 'No hay pedidos para esta semana'}</p>
                    {!search && (
                      <p className="text-xs mt-1 text-slate-300 dark:text-slate-700">{weekLabel}</p>
                    )}
                  </div>
                ) : calendarView ? (
                  <CalendarView orders={filteredWeek} onOrderClick={setSelectedOrder} />
                ) : (
                  <div className="space-y-3">
                    {filteredWeek.map((order) => (
                      <OrderCard
                        key={order.id_order}
                        order={order}
                        onClick={setSelectedOrder}
                        onEdit={setEditingOrder}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <HistoryView
                  orders={filteredHistory}
                  onOrderClick={setSelectedOrder}
                  onEdit={setEditingOrder}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default Orders;
