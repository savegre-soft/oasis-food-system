import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family:   { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

const PLAN_TYPE = {
  estandar:    { label: '⭐ Estándar',    className: 'bg-slate-100 text-slate-600' },
  nutricional: { label: '🥗 Nutricional', className: 'bg-green-50 text-green-700' },
};

const DAY_LABELS = {
  Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
  Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo',
};

const STATUS_CONFIG = {
  PENDING:   { label: 'Pendiente', icon: Clock,         color: 'text-amber-500',  bg: 'bg-amber-50 text-amber-700'  },
  PACKED:    { label: 'Empacado',  icon: CheckCircle2,  color: 'text-blue-500',   bg: 'bg-blue-50 text-blue-700'    },
  DELIVERED: { label: 'Entregado', icon: Truck,         color: 'text-green-500',  bg: 'bg-green-50 text-green-700'  },
  CANCELLED: { label: 'Cancelado', icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-50 text-red-600'      },
};

// Next week range (same logic as orderUtils)
const getNextWeekRange = () => {
  const today  = new Date();
  const diff   = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd:   sunday.toISOString().split('T')[0],
  };
};

const formatWeek = (start, end) => {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end   + 'T00:00:00');
  const opts = { day: '2-digit', month: 'short' };
  return s.toLocaleDateString('es-CR', opts) + ' — ' + e.toLocaleDateString('es-CR', { ...opts, year: 'numeric' });
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const MacroPanel = ({ label, accent, macro }) => {
  if (!macro) return null;
  const colors = {
    amber:  { border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };
  const c = colors[accent];
  return (
    <div className={'rounded-xl border p-4 ' + c.border + ' ' + c.bg}>
      <p className={'text-xs font-semibold mb-3 ' + c.text}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Proteína</p>
          <p className="text-sm font-semibold text-slate-800">{macro.protein_value} {macro.protein_unit}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Carbohidratos</p>
          <p className="text-sm font-semibold text-slate-800">{macro.carb_value} {macro.carb_unit}</p>
        </div>
      </div>
    </div>
  );
};

// Single order card — shows classification, route, days with recipes
const OrderBlock = ({ order }) => {
  const [open, setOpen] = useState(false);

  const classLabel =
    order.classification === 'Lunch'  ? '☀️ Almuerzo' :
    order.classification === 'Dinner' ? '🌙 Cena'      : '👨‍👩‍👧 Familiar';

  const classBg =
    order.classification === 'Lunch'  ? 'bg-amber-50 text-amber-700'   :
    order.classification === 'Dinner' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700';

  const days = (order.order_days ?? []).sort((a, b) =>
    new Date(a.delivery_date) - new Date(b.delivery_date)
  );

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full ' + classBg}>{classLabel}</span>
          {order.routes && (
            <span className="text-xs text-slate-500">📍 {order.routes.name}</span>
          )}
          {order.protein_snapshot && (
            <span className="text-xs text-slate-400">
              {order.protein_snapshot}{order.protein_unit_snapshot} prot · {order.carb_snapshot}{order.carb_unit_snapshot} carb
            </span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
      </button>

      {/* Days */}
      {open && (
        <div className="divide-y divide-slate-50">
          {days.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 italic">Sin días registrados</p>
          ) : (
            days.map((od) => {
              const st  = STATUS_CONFIG[od.status] ?? STATUS_CONFIG.PENDING;
              const Icon = st.icon;
              return (
                <div key={od.id_order_day} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className={st.color} />
                      <span className="text-sm font-medium text-slate-700">
                        {DAY_LABELS[od.day_of_week] ?? od.day_of_week}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(od.delivery_date + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + st.bg}>{st.label}</span>
                  </div>
                  {(od.order_day_details ?? []).length > 0 && (
                    <div className="ml-5 space-y-1">
                      {od.order_day_details.map((det, i) => {
                        const ovRows   = det.order_day_recipe_overrides ?? [];
                        const hasOv    = ovRows.length > 0;
                        const ingRows  = hasOv ? ovRows : (det.recipes?.recipe_ingredients ?? []);
                        const bycat    = { protein: [], carb: [], extra: [] };
                        ingRows.forEach(r => { if (bycat[r.category]) bycat[r.category].push(r.name); });
                        const hasIngs  = ['protein','carb','extra'].some(c => bycat[c].length > 0);
                        return (
                          <div key={i}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium text-slate-600">
                                {det.recipes?.name ?? 'Receta'}
                                {det.quantity > 1 ? ' ×' + det.quantity : ''}
                              </span>
                              {hasOv && (
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">modificada</span>
                              )}
                            </div>
                            {hasIngs && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {bycat.protein.map((n, j) => <span key={'p'+j} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{n}</span>)}
                                {bycat.carb.map((n, j)    => <span key={'c'+j} className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">{n}</span>)}
                                {bycat.extra.map((n, j)   => <span key={'e'+j} className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">{n}</span>)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Current week view — active orders
const CurrentWeekView = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No hay órdenes activas esta semana</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderBlock key={order.id_order} order={order} />
      ))}
    </div>
  );
};

// History view — grouped by week
const HistoryView = ({ orders }) => {
  const [openWeeks, setOpenWeeks] = useState({});

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Sin historial de órdenes</p>
      </div>
    );
  }

  // Group by week_start_date
  const grouped = {};
  orders.forEach((o) => {
    const key = o.week_start_date + '_' + o.week_end_date;
    if (!grouped[key]) grouped[key] = { start: o.week_start_date, end: o.week_end_date, orders: [] };
    grouped[key].orders.push(o);
  });

  const weeks = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  const toggleWeek = (key) => setOpenWeeks(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-3">
      {weeks.map(([key, { start, end, orders: weekOrders }]) => {
        const isOpen = openWeeks[key] ?? false;
        return (
          <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleWeek(key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">{formatWeek(start, end)}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {weekOrders.length} orden{weekOrders.length !== 1 ? 'es' : ''}
                </span>
              </div>
              {isOpen
                ? <ChevronUp size={15} className="text-slate-400" />
                : <ChevronDown size={15} className="text-slate-400" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-3 bg-slate-50">
                {weekOrders.map((order) => (
                  <OrderBlock key={order.id_order} order={order} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Orders section with tabs
const OrdersSection = ({ clientId }) => {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('current');

  const { weekStart, weekEnd } = getNextWeekRange();

  useEffect(() => {
    const fetch = async () => {
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
          routes ( id_route, name ),
          order_days (
            id_order_day,
            day_of_week,
            delivery_date,
            status,
            order_day_details (
              id_order_day_detail,
              recipe_id,
              quantity,
              recipes (
                id_recipe, name,
                recipe_ingredients ( name, category )
              ),
              order_day_recipe_overrides ( name, category )
            )
          )
        `)
        .eq('client_id', clientId)
        .order('week_start_date', { ascending: false })
        .order('id_order',        { ascending: false });

      if (error) { console.error(error); }
      else setOrders(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [clientId]);

  const currentOrders = orders.filter(
    (o) => o.week_start_date === weekStart && o.week_end_date === weekEnd
  );
  const historyOrders = orders.filter(
    (o) => !(o.week_start_date === weekStart && o.week_end_date === weekEnd)
  );

  const tabs = [
    { id: 'current', label: 'Semana actual', count: currentOrders.length },
    { id: 'history', label: 'Histórico',     count: historyOrders.length },
  ];

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Órdenes</p>

      {/* Tab bar */}
      <div className="flex gap-2">
        {tabs.map(({ id, label, count }) => {
          const isActive = activeTab === id;
          const cls = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border '
            + (isActive ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400');
          const badgeCls = 'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center '
            + (isActive ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-600');
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={cls}>
              {label}
              {count > 0 && <span className={badgeCls}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-slate-400 py-4">Cargando órdenes...</p>
      ) : activeTab === 'current' ? (
        <CurrentWeekView orders={currentOrders} />
      ) : (
        <HistoryView orders={historyOrders} />
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Customer = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('clients')
        .select(`
          *,
          lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
            id_macro_profile, name, protein_value, protein_unit, carb_value, carb_unit
          ),
          dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
            id_macro_profile, name, protein_value, protein_unit, carb_value, carb_unit
          )
        `)
        .eq('id_client', Number(id))
        .single();

      if (error) { console.error(error); return; }
      setCustomer(data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading)   return <p className="p-8 text-slate-400">Cargando cliente...</p>;
  if (!customer) return <p className="p-8 text-slate-400">Cliente no encontrado</p>;

  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  const planStyle = customer.plan_type ? (PLAN_TYPE[customer.plan_type] ?? PLAN_TYPE.estandar) : null;
  const hasMap    = customer.latitude && customer.longitude;
  const hasMacros = customer.lunch_macro || customer.dinner_macro;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={'text-xs px-2.5 py-0.5 rounded-full ' + (customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                {customer.is_active ? 'Activo' : 'Inactivo'}
              </span>
              <span className={'text-xs px-2.5 py-0.5 rounded-full ' + typeStyle.className}>{typeStyle.label}</span>
              {planStyle && customer.client_type === 'personal' && (
                <span className={'text-xs px-2.5 py-0.5 rounded-full ' + planStyle.className}>{planStyle.label}</span>
              )}
            </div>
          </div>
          <div className="space-y-1 text-sm text-slate-700 md:text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contacto</p>
            {customer.phone         && <p>📞 {customer.phone}</p>}
            {customer.address_detail && <p>📍 {customer.address_detail}</p>}
          </div>
        </div>
        {customer.created_at && (
          <p className="text-xs text-slate-400 mt-4">
            Cliente desde {new Date(customer.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Macros */}
      {customer.client_type === 'personal' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase">Perfiles Nutricionales</p>
          {hasMacros ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MacroPanel label="☀️ Almuerzo" accent="amber"  macro={customer.lunch_macro}  />
              <MacroPanel label="🌙 Cena"     accent="indigo" macro={customer.dinner_macro} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Sin perfil nutricional registrado</p>
          )}
        </div>
      )}

      {/* Orders */}
      <OrdersSection clientId={Number(id)} />

      {/* Map */}
      {hasMap && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase">Ubicación</p>
          <div className="rounded-xl overflow-hidden border">
            <MapContainer
              center={[customer.latitude, customer.longitude]}
              zoom={15}
              style={{ height: '260px', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[customer.latitude, customer.longitude]} />
            </MapContainer>
          </div>
          <p className="text-xs text-slate-400 text-center">
            {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default Customer;