import { useState, useEffect } from 'react';
import { Truck, ChefHat, Package, Zap, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import CocinaView from '../components/Kitchen';
import ProductionPrintReport from '../components/ProductionPrintReport';
import EmpaqueView from '../components/Package';
import EntregaView from '../components/Delivered';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TABS = [
  { id: 'cocina', label: 'Cocina', Icon: ChefHat },
  { id: 'empaque', label: 'Empaque', Icon: Package },
  { id: 'entrega', label: 'Entrega', Icon: Truck },
  { id: 'express', label: 'Express', Icon: Zap },
];

const EXPRESS_SUBTABS = [
  { id: 'cocina', label: 'Cocina', Icon: ChefHat },
  { id: 'empaque', label: 'Empaque', Icon: Package },
  { id: 'entrega', label: 'Entrega', Icon: Truck },
];

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

const cycleIdx = (d) => (d === 'Sunday' ? -1 : DAY_ORDER.indexOf(d));

const isoOfDay = (name, weekMonday) => {
  const d = new Date(weekMonday);
  if (name === 'Sunday') {
    d.setDate(weekMonday.getDate() - 1);
  } else {
    d.setDate(weekMonday.getDate() + DAY_ORDER.indexOf(name));
  }
  return d.toISOString().split('T')[0];
};

const buildDeliverySlots = (deliveryDayNames, weekMonday) => {
  const sorted = [...deliveryDayNames].sort((a, b) => cycleIdx(a) - cycleIdx(b));
  return sorted.map((name) => {
    const deliveryDate = isoOfDay(name, weekMonday);
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
    (isActive ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800');
  return (
    <button onClick={() => onSelect(slot)} className={cls}>
      <span>{slot.label}</span>
      <span className="text-xs font-normal opacity-60">{delivLabel}</span>
    </button>
  );
};

const TabButton = ({ id, label, Icon, isActive, count, onSelect }) => {
  const cls =
    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition border ' +
    (isActive
      ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400');
  const badgeCls =
    'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ' +
    (isActive ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-600');
  return (
    <button key={id} onClick={() => onSelect(id)} className={cls}>
      <Icon size={15} />
      {label}
      {count > 0 && <span className={badgeCls}>{count}</span>}
    </button>
  );
};

const ClientFilterButton = ({ id, label, isActive, onSelect }) => {
  const cls =
    'px-4 py-1.5 rounded-xl text-xs font-medium transition border ' +
    (isActive
      ? 'bg-slate-800 text-white border-slate-800'
      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400');
  return (
    <button onClick={() => onSelect(id)} className={cls}>
      {label}
    </button>
  );
};

const EmptyState = ({ icon, text }) => (
  <div className="text-center py-16 text-slate-400">
    <div className="mx-auto mb-3 opacity-30 flex justify-center">{icon}</div>
    <p>{text}</p>
  </div>
);

// ── ExpressView ────────────────────────────────────────────────────────────────

const ExpressView = ({
  pendingDays,
  packedDays,
  deliveredDays,
  onPack,
  onDeliver,
  expressTab,
  setExpressTab,
  todayStr,
}) => {
  const subCounts = {
    cocina: pendingDays.length,
    empaque: pendingDays.length + packedDays.length,
    entrega: deliveredDays.length,
  };

  const todayLabel = new Date(todayStr + 'T00:00:00').toLocaleDateString('es-CR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
        <Zap size={18} className="text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Pedidos Express</p>
          <p className="text-xs text-amber-600">Entrega hoy · {todayLabel}</p>
        </div>
        <div className="ml-auto">
          <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-xs font-semibold">
            {pendingDays.length + packedDays.length} activos
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {EXPRESS_SUBTABS.map(({ id, label, Icon }) => (
          <TabButton
            key={id}
            id={id}
            label={label}
            Icon={Icon}
            isActive={expressTab === id}
            count={subCounts[id] ?? 0}
            onSelect={setExpressTab}
          />
        ))}
      </div>

      {expressTab === 'cocina' &&
        (pendingDays.length === 0 ? (
          <EmptyState icon={<ChefHat size={36} />} text="No hay pedidos express pendientes" />
        ) : (
          <CocinaView orderDays={pendingDays} onPack={onPack} DAY_LABELS={DAY_LABELS} />
        ))}
      {expressTab === 'empaque' &&
        (pendingDays.length === 0 && packedDays.length === 0 ? (
          <EmptyState icon={<Package size={36} />} text="No hay pedidos express para empacar" />
        ) : (
          <EmpaqueView pendingDays={pendingDays} packedDays={packedDays} onDeliver={onDeliver} />
        ))}
      {expressTab === 'entrega' &&
        (deliveredDays.length === 0 ? (
          <EmptyState icon={<Truck size={36} />} text="No hay entregas express hoy" />
        ) : (
          <EntregaView orderDays={deliveredDays} />
        ))}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const Production = () => {
  const { supabase } = useApp();
  const todayStr = new Date().toISOString().split('T')[0];

  const [weekOffset, setWeekOffset] = useState(0);
  const { weekStart, weekEnd } = computeWeekRange(weekOffset);

  const [activeTab, setActiveTab] = useState('cocina');
  const [expressTab, setExpressTab] = useState('cocina');
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

  // ── Express: fetch today's orders regardless of slot ─────────────────────────

  const [expressPendingAll, setExpressPendingAll] = useState([]);
  const [expressPackedAll, setExpressPackedAll] = useState([]);
  const [expressDeliveredAll, setExpressDeliveredAll] = useState([]);

  const getExpressData = async () => {
    const base = (status) =>
      supabase
        .schema('operations')
        .from('order_days')
        .select(ORDER_DAY_SELECT)
        .eq('delivery_date', todayStr)
        .eq('status', status)
        .order('id_order_day');

    const [p, k, d] = await Promise.all([base('PENDING'), base('PACKED'), base('DELIVERED')]);
    const isExpress = (row) => row.orders?.route_id === null;
    setExpressPendingAll((p.data ?? []).filter(isExpress));
    setExpressPackedAll((k.data ?? []).filter(isExpress));
    setExpressDeliveredAll((d.data ?? []).filter(isExpress));
  };

  useEffect(() => {
    const { weekStart: ws, weekEnd: we } = computeWeekRange(weekOffset);
    // Clear stale data immediately so old week's orders don't linger
    setSelectedSlot(null);
    setPendingDays([]);
    setPackedDays([]);
    setDeliveredDays([]);
    // Express is always today-based; clear it when not on current week
    if (weekOffset !== 0) {
      setExpressPendingAll([]);
      setExpressPackedAll([]);
      setExpressDeliveredAll([]);
    }
    getAvailableDays(ws, we);
    if (weekOffset === 0) getExpressData();
  }, [weekOffset]);

  useEffect(() => {
    getData();
  }, [selectedSlot]);

  const refresh = async () => {
    const { weekStart: ws, weekEnd: we } = computeWeekRange(weekOffset);
    await getAvailableDays(ws, we);
    await getData();
    if (weekOffset === 0) await getExpressData();
  };

  // ── Status transitions ─────────────────────────────────────────────────────────

  const updateStatus = async (orderDayId, newStatus, successMsg) => {
    const { error } = await supabase
      .schema('operations')
      .from('order_days')
      .update({ status: newStatus })
      .eq('id_order_day', orderDayId);

    if (error) {
      sileo.error('Error al actualizar el estado');
      console.error(error);
      return;
    }
    sileo.success(successMsg);
    await refresh();
  };

  const markPacked = (id) => updateStatus(id, 'PACKED', '📦 Marcado como empacado');
  const markDelivered = (id) => updateStatus(id, 'DELIVERED', '🚚 Entrega registrada');

  // ── Filters ────────────────────────────────────────────────────────────────────

  const filterByClient = (days) => {
    if (clientFilter === 'todos') return days;
    return days.filter((d) => d.orders?.clients?.client_type === clientFilter);
  };

  // Normal tabs exclude express (route_id = null + today)
  const isExpressDay = (d) => d.orders?.route_id === null && d.delivery_date === todayStr;
  const normalPending = filterByClient(pendingDays.filter((d) => !isExpressDay(d)));
  const normalPacked = filterByClient(packedDays.filter((d) => !isExpressDay(d)));
  const normalDelivered = filterByClient(deliveredDays.filter((d) => !isExpressDay(d)));

  const counts = {
    cocina: normalPending.length,
    empaque: normalPacked.length + normalPending.length,
    entrega: normalDelivered.length,
    express: expressPendingAll.length + expressPackedAll.length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Print report */}
      {showPrint && activeTab !== 'express' && (
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
      {showPrint && activeTab === 'express' && (
        <ProductionPrintReport
          orderDays={[...expressPendingAll, ...expressPackedAll, ...expressDeliveredAll]}
          slotLabel="Express"
          weekLabel={new Date(todayStr + 'T00:00:00').toLocaleDateString('es-CR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
          })}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Producción</h1>
          <p className="text-slate-500 mt-1">
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
        <button
          onClick={() => setShowPrint(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition shrink-0"
        >
          <Printer size={15} /> Imprimir resumen
        </button>
      </div>

      {/* Week segmenter */}
      <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit mb-8">
        {WEEK_SEGMENTS.map(({ offset, label }) => (
          <button
            key={offset}
            onClick={() => setWeekOffset(offset)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              weekOffset === offset
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadingDays ? (
        <p className="text-slate-400 text-sm">Cargando días...</p>
      ) : (
        <>
          {/* Slot selector + client filter — hidden in express tab */}
          {activeTab !== 'express' && (
            <>
              {slots.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Truck size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No hay pedidos activos esta semana</p>
                </div>
              ) : (
                <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-6">
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
            </>
          )}

          {/* Tab bar */}
          <div className="flex gap-2 mb-8">
            {TABS.map(({ id, label, Icon }) => (
              <TabButton
                key={id}
                id={id}
                label={label}
                Icon={Icon}
                isActive={activeTab === id}
                count={counts[id] ?? 0}
                onSelect={setActiveTab}
              />
            ))}
          </div>

          {/* Views */}
          {loading && activeTab !== 'express' ? (
            <p className="text-slate-500 text-sm">Cargando...</p>
          ) : (
            <>
              {activeTab === 'cocina' && (
                <CocinaView orderDays={normalPending} onPack={markPacked} DAY_LABELS={DAY_LABELS} />
              )}
              {activeTab === 'empaque' && (
                <EmpaqueView
                  pendingDays={normalPending}
                  packedDays={normalPacked}
                  onDeliver={markDelivered}
                />
              )}
              {activeTab === 'entrega' && <EntregaView orderDays={normalDelivered} />}
              {activeTab === 'express' && (
                <ExpressView
                  pendingDays={expressPendingAll}
                  packedDays={expressPackedAll}
                  deliveredDays={expressDeliveredAll}
                  onPack={markPacked}
                  onDeliver={markDelivered}
                  expressTab={expressTab}
                  setExpressTab={setExpressTab}
                  todayStr={todayStr}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Production;
