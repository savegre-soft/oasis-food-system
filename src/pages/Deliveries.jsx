import { useState, useEffect } from 'react';
import { Truck, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';

import ProductionPrintReport from '../components/ProductionPrintReport';
import KitchenPipeline from '../components/KitchenPipeline';
import { useOrderDayActions } from '../hooks/useOrderDayActions';

import { DAYS_ORDER as DAY_ORDER, DAY_LABELS, cycleIdx, getAbsoluteDate, toDateString } from '../components/orderUtils';

// ── Week range ─────────────────────────────────────────────────────────────────

// offset: -1 = previous week, 0 = current week, 1 = next week
const computeWeekRange = (offset = 0) => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day; // to Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
};

const WEEK_SEGMENTS = [
  { offset: -1, label: 'Sem. anterior' },
  { offset: 0, label: 'Sem. actual' },
  { offset: 1, label: 'Sem. siguiente' },
];

// ── Delivery slot helpers ──────────────────────────────────────────────────────
// cycleIdx/getAbsoluteDate/toDateString son las mismas utilidades usadas por el
// asistente de pedidos (src/components/orderUtils.js) — única fuente de verdad
// para la resolución de fecha de entrega en todo el sistema.

const buildDeliverySlots = (deliveryDayNames, weekMonday) => {
  const sorted = [...deliveryDayNames].sort((a, b) => cycleIdx(a) - cycleIdx(b));
  return sorted.map((name) => {
    const deliveryDate = toDateString(getAbsoluteDate(name, weekMonday));
    return { name, label: DAY_LABELS[name] ?? name, deliveryDate };
  });
};

// ── Supabase select ────────────────────────────────────────────────────────────

const ORDER_DAY_SELECT = `
  id_order_day,
  day_of_week,
  delivery_date,
  status,
  orders (
    id_order,
    classification,
    route_id,
    clients ( id_client, name, client_type )
  ),
  order_day_details (
    id_order_day_detail,
    status,
    quantity,
    protein_value_applied,
    carb_value_applied,
    recipes (
      id_recipe, name,
      recipe_ingredients ( name, category )
    ),
    order_day_recipe_overrides ( name, category )
  )
`;

// ── Helper components ──────────────────────────────────────────────────────────

const SlotButton = ({ slot, isActive, onSelect }) => {
  const delivLabel = new Date(slot.deliveryDate + 'T00:00:00').toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
  });

  const cls =
    'flex flex-col items-center px-5 py-2 rounded-lg text-sm font-medium transition ' +
    (isActive
      ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200');

  return (
    <button onClick={() => onSelect(slot)} className={cls}>
      <span>{slot.label}</span>
      <span className="text-xs font-normal opacity-60">{delivLabel}</span>
    </button>
  );
};

const ClientFilterButton = ({ id, label, isActive, onSelect }) => {
  const cls =
    'px-4 py-1.5 rounded-xl text-xs font-medium transition border ' +
    (isActive
      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100'
      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600');

  return (
    <button onClick={() => onSelect(id)} className={cls}>
      {label}
    </button>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const Production = () => {
  const { supabase } = useApp();
  const todayStr = new Date().toISOString().split('T')[0];

  const [weekOffset, setWeekOffset] = useState(0);
  const { weekStart, weekEnd } = computeWeekRange(weekOffset);

  const [activeTab, setActiveTab] = useState('cocina');
  const [showPrint, setShowPrint] = useState(false);
  const [clientFilter, setClientFilter] = useState('todos');

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loadingDays, setLoadingDays] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingDays, setPendingDays] = useState([]);
  const [packedDays, setPackedDays] = useState([]);
  const [deliveredDays, setDeliveredDays] = useState([]);

  // ── Load routes → build delivery slots ──────────────────────────────────────

  const getAvailableDays = async (wsStr, weStr) => {
    setLoadingDays(true);

    const { data: routes, error } = await supabase
      .schema('operations')
      .from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('is_active', true);

    if (error) {
      console.error(error);
      setLoadingDays(false);
      return;
    }

    const allDayNames = [
      ...new Set(
        (routes ?? []).flatMap((r) => (r.route_delivery_days ?? []).map((d) => d.day_of_week))
      ),
    ];

    if (allDayNames.length === 0) {
      const { data: fallback } = await supabase
        .schema('operations')
        .from('order_days')
        .select('delivery_date, day_of_week')
        .in('status', ['PENDING', 'PACKED', 'DELIVERED'])
        .gte('delivery_date', wsStr)
        .lte('delivery_date', weStr);

      const uniqueDates = [...new Set((fallback ?? []).map((d) => d.delivery_date))].sort();
      const fallbackSlots = uniqueDates.map((dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        const name = DAY_ORDER[d.getDay() === 0 ? 6 : d.getDay() - 1];
        return { name, label: DAY_LABELS[name] ?? name, deliveryDate: dateStr };
      });
      setSlots(fallbackSlots);
      setSelectedSlot((prev) => prev ?? (fallbackSlots.length > 0 ? fallbackSlots[0] : null));
      setLoadingDays(false);
      return;
    }

    const weekMonday = new Date(wsStr + 'T00:00:00');
    const allSlots = buildDeliverySlots(allDayNames, weekMonday);
    // Include the Sunday before weekMonday — it belongs to this delivery cycle
    const sundayBefore = new Date(weekMonday);
    sundayBefore.setDate(weekMonday.getDate() - 1);
    const sundayBeforeStr = sundayBefore.toISOString().split('T')[0];

    const { data: activeDates } = await supabase
      .schema('operations')
      .from('order_days')
      .select('delivery_date')
      .in('status', ['PENDING', 'PACKED', 'DELIVERED'])
      .gte('delivery_date', sundayBeforeStr)
      .lte('delivery_date', weStr);

    const activeDateSet = new Set((activeDates ?? []).map((d) => d.delivery_date));
    const activeSlots = allSlots.filter((slot) => activeDateSet.has(slot.deliveryDate));

    setSlots(activeSlots);
    setSelectedSlot((prev) => prev ?? (activeSlots.length > 0 ? activeSlots[0] : null));
    setLoadingDays(false);
  };

  // ── Fetch order days for selected slot ────────────────────────────────────────

  const getData = async () => {
    if (!selectedSlot) return;
    setLoading(true);

    const base = (status) =>
      supabase
        .schema('operations')
        .from('order_days')
        .select(ORDER_DAY_SELECT)
        .eq('delivery_date', selectedSlot.deliveryDate)
        .eq('status', status)
        .order('id_order_day');

    const [pendingRes, packedRes, deliveredRes] = await Promise.all([
      base('PENDING'),
      base('PACKED'),
      base('DELIVERED'),
    ]);

    if (pendingRes.error) console.error(pendingRes.error);
    if (packedRes.error) console.error(packedRes.error);
    if (deliveredRes.error) console.error(deliveredRes.error);

    setPendingDays(pendingRes.data ?? []);
    setPackedDays(packedRes.data ?? []);
    setDeliveredDays(deliveredRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const { weekStart: ws, weekEnd: we } = computeWeekRange(weekOffset);
    // Clear stale data immediately so old week's orders don't linger
    setSelectedSlot(null);
    setPendingDays([]);
    setPackedDays([]);
    setDeliveredDays([]);
    getAvailableDays(ws, we);
  }, [weekOffset]);

  useEffect(() => {
    getData();
  }, [selectedSlot]);

  const refresh = async () => {
    const { weekStart: ws, weekEnd: we } = computeWeekRange(weekOffset);
    await getAvailableDays(ws, we);
    await getData();
  };

  const {
    markPacked,
    markDelivered,
    markPending,
    markPackedDetail,
    markDeliveredDetail,
    markPendingDetail,
  } = useOrderDayActions(supabase, refresh);

  // ── Filters ────────────────────────────────────────────────────────────────────

  const filterByClient = (days) => {
    if (clientFilter === 'todos') return days;
    return days.filter((d) => d.orders?.clients?.client_type === clientFilter);
  };

  // Excluye pedidos Express (route_id = null + entrega hoy) — tienen su propia página.
  const isExpressDay = (d) => d.orders?.route_id === null && d.delivery_date === todayStr;
  const normalPending = filterByClient(pendingDays.filter((d) => !isExpressDay(d)));
  const normalPacked = filterByClient(packedDays.filter((d) => !isExpressDay(d)));
  const normalDelivered = filterByClient(deliveredDays.filter((d) => !isExpressDay(d)));

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      {/* Print report */}
      {showPrint && (
        <ProductionPrintReport
          orderDays={[...pendingDays, ...packedDays, ...deliveredDays]}
          slotLabel={selectedSlot?.label}
          weekLabel={
            new Date(weekStart + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
            }) +
            ' al ' +
            new Date(weekEnd + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
          }
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Producción</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {'Semana del '}
            {new Date(weekStart + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
            })}
            {' al '}
            {new Date(weekEnd + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrint(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 px-4 py-2.5 rounded-xl text-sm font-medium transition shrink-0"
          >
            <Printer size={15} /> Imprimir resumen
          </button>
        </div>
      </div>

      {/* Week segmenter */}
      <div className="flex gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl w-fit mb-8">
        {WEEK_SEGMENTS.map(({ offset, label }) => (
          <button
            key={offset}
            onClick={() => setWeekOffset(offset)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              weekOffset === offset
                ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadingDays ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando días...</p>
      ) : (
        <>
          {slots.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-600">
              <Truck size={40} className="mx-auto mb-3 opacity-30" />
              <p>No hay pedidos activos esta semana</p>
            </div>
          ) : (
            <div className="flex gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl w-fit mb-6">
              {slots.map((slot) => (
                <SlotButton
                  key={slot.name}
                  slot={slot}
                  isActive={selectedSlot?.name === slot.name}
                  onSelect={setSelectedSlot}
                />
              ))}
            </div>
          )}
          <div className="flex gap-1 mb-4">
            {[
              { id: 'todos', label: '🌐 Todos' },
              { id: 'personal', label: '👤 Personales' },
              { id: 'family', label: '👨‍👩‍👧 Familiares' },
            ].map(({ id, label }) => (
              <ClientFilterButton
                key={id}
                id={id}
                label={label}
                isActive={clientFilter === id}
                onSelect={setClientFilter}
              />
            ))}
          </div>

          {loading ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
          ) : (
            <KitchenPipeline
              pendingDays={normalPending}
              packedDays={normalPacked}
              deliveredDays={normalDelivered}
              onPack={markPacked}
              onPackDetail={markPackedDetail}
              onDeliver={markDelivered}
              onDeliverDetail={markDeliveredDetail}
              onUnpack={markPending}
              onUnpackDetail={markPendingDetail}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Production;
