import { useState, useEffect } from 'react';
import { Truck, ChefHat, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import CocinaView  from '../components/Kitchen';
import EmpaqueView from '../components/Package';
import EntregaView from '../components/Delivered';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = {
  Monday:    'Lunes',
  Tuesday:   'Martes',
  Wednesday: 'Miércoles',
  Thursday:  'Jueves',
  Friday:    'Viernes',
  Saturday:  'Sábado',
  Sunday:    'Domingo',
};

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TABS = [
  { id: 'cocina',  label: 'Cocina',  Icon: ChefHat },
  { id: 'empaque', label: 'Empaque', Icon: Package  },
  { id: 'entrega', label: 'Entrega', Icon: Truck    },
];

// ── Week range ────────────────────────────────────────────────────────────────

const getWeekRange = () => {
  const today  = new Date();
  const day    = today.getDay();
  const diff   = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + 7); // next week
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd:   sunday.toISOString().split('T')[0],
  };
};

// ── Route delivery slot helpers ───────────────────────────────────────────────
//
// Given the sorted delivery-day names of a route (e.g. ['Sunday','Tuesday'])
// and the week's Monday date, build an array of slots:
//   { label, dateFrom (ISO), dateTo (ISO) }
//
// Rule: slot N covers days from (slot[N-1].date + 1 day) to slot[N].date.
// For the first slot we wrap around: start = slot[last] of PREVIOUS week + 1.
//
// Cycle order for delivery slots: Sunday starts the week (index -1),
// then Mon(0)…Sat(5). Matches getDateForDay in AddOrder.
const cycleIdx = (d) => d === 'Sunday' ? -1 : DAY_ORDER.indexOf(d);

// Absolute ISO date of a named day within the week starting on weekMonday.
const isoOfDay = (name, weekMonday) => {
  const d = new Date(weekMonday);
  if (name === 'Sunday') {
    d.setDate(weekMonday.getDate() - 1); // Sunday precedes Monday
  } else {
    d.setDate(weekMonday.getDate() + DAY_ORDER.indexOf(name)); // Mon=0…Sat=5
  }
  return d.toISOString().split('T')[0];
};

// Build delivery slots from route delivery day names.
// Each slot's dateFrom/dateTo = the exact delivery_date stored in order_days
// for that slot (a single date, not a range), because Production filters by
// delivery_date == slot date.
//
// The slot LABEL shows which meal days it covers, but the DB query uses
// the exact delivery_date value.
//
// Slot order follows cycleIdx (Sun first, then Mon–Sat).
const buildDeliverySlots = (deliveryDayNames, weekMonday) => {
  const sorted = [...deliveryDayNames].sort((a, b) => cycleIdx(a) - cycleIdx(b));

  return sorted.map((name, i) => {
    const deliveryDate = isoOfDay(name, weekMonday);

    // Label: show which meal days this delivery covers
    // From: day after previous delivery (cycle order), To: day before next delivery
    const prevName = i === 0 ? null : sorted[i - 1];
    const nextName = sorted[i + 1] ?? null;

    const prevDate = prevName ? isoOfDay(prevName, weekMonday) : null;
    const nextDate = nextName ? isoOfDay(nextName, weekMonday) : null;

    // dateFrom/dateTo for DB query = exact delivery_date (single day)
    return {
      name,
      label:        DAY_LABELS[name] ?? name,
      deliveryDate, // exact date stored in order_days.delivery_date
      prevDate,     // for display: meal days start after this
      nextDate,     // for display: meal days end before this
    };
  });
};

// ── Supabase select fragment ──────────────────────────────────────────────────

const ORDER_DAY_SELECT = `
  id_order_day,
  day_of_week,
  delivery_date,
  status,
  orders (
    id_order,
    classification,
    clients ( id_client, name, client_type )
  ),
  order_day_details (
    id_order_day_detail,
    quantity,
    protein_value_applied,
    protein_unit_applied,
    carb_value_applied,
    carb_unit_applied,
    recipes (
      id_recipe, name,
      recipe_ingredients ( name, category )
    ),
    order_day_recipe_overrides ( name, category )
  )
`;

// ── Component ─────────────────────────────────────────────────────────────────

const Production = () => {
  const { supabase }           = useApp();
  const { weekStart, weekEnd } = getWeekRange();

  const [activeTab,     setActiveTab]    = useState('cocina');
  const [clientFilter,  setClientFilter] = useState('todos');

  // Route-based slot selector
  const [slots,        setSlots]        = useState([]);  // [{ name, label, dateFrom, dateTo }]
  const [selectedSlot, setSelectedSlot] = useState(null); // slot object

  const [loadingDays, setLoadingDays] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const [pendingDays,   setPendingDays]   = useState([]);
  const [packedDays,    setPackedDays]    = useState([]);
  const [deliveredDays, setDeliveredDays] = useState([]);

  // ── Load routes → build delivery slots ───────────────────────────────────

  const getAvailableDays = async () => {
    setLoadingDays(true);

    // 1. Fetch all active routes with their delivery days
    const { data: routes, error } = await supabase
      .schema('operations')
      .from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('is_active', true);

    if (error) { console.error(error); setLoadingDays(false); return; }

    // 2. Collect all unique delivery-day names across all routes
    const allDayNames = [...new Set(
      (routes ?? []).flatMap((r) => (r.route_delivery_days ?? []).map((d) => d.day_of_week))
    )];

    if (allDayNames.length === 0) {
      // Fallback: use actual delivery_dates from order_days
      const { data: fallback } = await supabase
        .schema('operations')
        .from('order_days')
        .select('delivery_date, day_of_week')
        .in('status', ['PENDING', 'PACKED', 'DELIVERED'])
        .gte('delivery_date', weekStart)
        .lte('delivery_date', weekEnd);

      const uniqueDates = [...new Set((fallback ?? []).map((d) => d.delivery_date))].sort();
      const fallbackSlots = uniqueDates.map((dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        const name = DAY_ORDER[d.getDay() === 0 ? 6 : d.getDay() - 1];
        return { name, label: DAY_LABELS[name] ?? name, deliveryDate: dateStr };
      });
      setSlots(fallbackSlots);
      if (fallbackSlots.length > 0 && !selectedSlot) setSelectedSlot(fallbackSlots[0]);
      setLoadingDays(false);
      return;
    }

    // 3. Build slots from route delivery days
    const weekMonday = new Date(weekStart + 'T00:00:00');
    const allSlots   = buildDeliverySlots(allDayNames, weekMonday);

    // 4. Filter to slots that actually have order_days in their date range this week
    const { data: activeDates } = await supabase
      .schema('operations')
      .from('order_days')
      .select('delivery_date')
      .in('status', ['PENDING', 'PACKED', 'DELIVERED'])
      .gte('delivery_date', weekStart)
      .lte('delivery_date', weekEnd);

    const activeDateSet = new Set((activeDates ?? []).map((d) => d.delivery_date));

    const activeSlots = allSlots.filter((slot) =>
      activeDateSet.has(slot.deliveryDate)
    );

    setSlots(activeSlots);
    if (activeSlots.length > 0 && !selectedSlot) setSelectedSlot(activeSlots[0]);
    setLoadingDays(false);
  };

  // ── Data for selected slot (date range) ──────────────────────────────────

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

    if (pendingRes.error)   console.error(pendingRes.error);
    if (packedRes.error)    console.error(packedRes.error);
    if (deliveredRes.error) console.error(deliveredRes.error);

    setPendingDays(pendingRes.data     ?? []);
    setPackedDays(packedRes.data       ?? []);
    setDeliveredDays(deliveredRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { getAvailableDays(); },  []);
  useEffect(() => { getData(); },           [selectedSlot]);

  // ── Refresh both ──────────────────────────────────────────────────────────

  const refresh = async () => { await getAvailableDays(); await getData(); };

  // ── Status transitions ────────────────────────────────────────────────────

  const updateStatus = async (orderDayId, newStatus, successMsg) => {
    const { error } = await supabase
      .schema('operations')
      .from('order_days')
      .update({ status: newStatus })
      .eq('id_order_day', orderDayId);

    if (error) { sileo.error('Error al actualizar el estado'); console.error(error); return; }

    sileo.success(successMsg);
    await refresh();
  };

  const markPacked    = (id) => updateStatus(id, 'PACKED',    '📦 Marcado como empacado');
  const markDelivered = (id) => updateStatus(id, 'DELIVERED', '🚚 Entrega registrada');

  // ── Tab badge counts ──────────────────────────────────────────────────────

  // ── Client-type filter ───────────────────────────────────────────────────

  const filterByClient = (days) => {
    if (clientFilter === 'todos') return days;
    return days.filter((d) => d.orders?.clients?.client_type === clientFilter);
  };

  const pendingFiltered   = filterByClient(pendingDays);
  const packedFiltered    = filterByClient(packedDays);
  const deliveredFiltered = filterByClient(deliveredDays);

  const counts = {
    cocina:  pendingFiltered.length,
    empaque: packedFiltered.length + pendingFiltered.length,
    entrega: deliveredFiltered.length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Producción</h1>
        <p className="text-slate-500 mt-1">
          Semana del{' '}
          {new Date(weekStart + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long' })}
          {' '}al{' '}
          {new Date(weekEnd + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {loadingDays ? (
        <p className="text-slate-400 text-sm">Cargando días...</p>
      ) : slots.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay pedidos activos esta semana</p>
        </div>
      ) : (
        <>
          {/* Delivery slot selector */}
          <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-6">
            {slots.map((slot) => {
              const isActive = selectedSlot?.name === slot.name;
              const delivLabel = new Date(slot.deliveryDate + 'T00:00:00')
                .toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
              return (
                <button
                  key={slot.name}
                  onClick={() => setSelectedSlot(slot)}
                  className={`flex flex-col items-center px-5 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>{slot.label}</span>
                  <span className="text-xs font-normal opacity-60">{delivLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Client type filter */}
          <div className="flex gap-1 mb-4">
            {[
              { id: 'todos',    label: '🌐 Todos'      },
              { id: 'personal', label: '👤 Personales'  },
              { id: 'family',   label: '👨‍👩‍👧 Familiares' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setClientFilter(id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition border ${
                  clientFilter === id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 mb-8">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              const count    = counts[id];
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition border ${
                    isActive
                      ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                  {count > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                      isActive ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active view */}
          {loading ? (
            <p className="text-slate-500 text-sm">Cargando...</p>
          ) : (
            <div>
              {activeTab === 'cocina'  && (
                <CocinaView
                  orderDays={pendingFiltered}
                  onPack={markPacked}
                  DAY_LABELS={DAY_LABELS}
                />
              )}
              {activeTab === 'empaque' && (
                <EmpaqueView
                  pendingDays={pendingFiltered}
                  packedDays={packedFiltered}
                  onDeliver={markDelivered}
                />
              )}
              {activeTab === 'entrega' && (
                <EntregaView
                  orderDays={deliveredFiltered}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Production;