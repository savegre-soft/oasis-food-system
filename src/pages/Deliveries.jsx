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
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd:   sunday.toISOString().split('T')[0],
  };
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
    clients ( id_client, name )
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

  const [activeTab,     setActiveTab]     = useState('cocina');
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDay,   setSelectedDay]   = useState(null);
  const [loadingDays,   setLoadingDays]   = useState(false);
  const [loading,       setLoading]       = useState(false);

  // Each view has its own data slice
  const [pendingDays,   setPendingDays]   = useState([]);  // PENDING  → Cocina + Empaque
  const [packedDays,    setPackedDays]    = useState([]);  // PACKED   → Empaque
  const [deliveredDays, setDeliveredDays] = useState([]);  // DELIVERED → Entrega

  // ── Available days (PENDING ∪ PACKED) ─────────────────────────────────────

  const getAvailableDays = async () => {
    setLoadingDays(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('order_days')
      .select('day_of_week')
      .in('status', ['PENDING', 'PACKED', 'DELIVERED'])
      .gte('delivery_date', weekStart)
      .lte('delivery_date', weekEnd);

    if (error) { console.error(error); setLoadingDays(false); return; }

    const unique = [...new Set((data ?? []).map((d) => d.day_of_week))]
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

    setAvailableDays(unique);
    if (unique.length > 0 && !selectedDay) setSelectedDay(unique[0]);
    setLoadingDays(false);
  };

  // ── Data for selected day ─────────────────────────────────────────────────

  const getData = async () => {
    if (!selectedDay) return;
    setLoading(true);

    const base = (status) =>
      supabase
        .schema('operations')
        .from('order_days')
        .select(ORDER_DAY_SELECT)
        .eq('day_of_week', selectedDay)
        .eq('status', status)
        .gte('delivery_date', weekStart)
        .lte('delivery_date', weekEnd)
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

  useEffect(() => { getAvailableDays(); }, []);
  useEffect(() => { getData(); },          [selectedDay]);

  // ── Refresh both ──────────────────────────────────────────────────────────

  const refresh = async () => {
    await getAvailableDays();
    await getData();
  };

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

  const counts = {
    cocina:  pendingDays.length,
    empaque: packedDays.length + pendingDays.length,
    entrega: deliveredDays.length,
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
      ) : availableDays.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay pedidos activos esta semana</p>
        </div>
      ) : (
        <>
          {/* Day selector */}
          <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-6">
            {availableDays.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  selectedDay === day
                    ? 'bg-white shadow text-slate-800'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {DAY_LABELS[day] ?? day}
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
                  orderDays={pendingDays}
                  onPack={markPacked}
                  DAY_LABELS={DAY_LABELS}
                />
              )}
              {activeTab === 'empaque' && (
                <EmpaqueView
                  pendingDays={pendingDays}
                  packedDays={packedDays}
                  onDeliver={markDelivered}
                />
              )}
              {activeTab === 'entrega' && (
                <EntregaView
                  orderDays={deliveredDays}
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