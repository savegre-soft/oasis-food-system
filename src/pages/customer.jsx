import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HistoryView from '../components/HistoryView';
import PaymentSection from '../components/PaymentsSection';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { CLIENT_TYPE, PLAN_TYPE, DAY_LABELS, STATUS_CONFIG } from '../utils/customerUtils';

import MacroPanel from '../components/macro/MacroPanel';
import CurrentWeekView from '../components/CurrentWeekView';

// Next week range (same logic as orderUtils)
const getNextWeekRange = () => {
  const today = new Date();
  const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
};

// Orders section with tabs
const OrdersSection = ({ clientId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  const { weekStart, weekEnd } = getNextWeekRange();

  useEffect(() => {
    const fetch = async () => {
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
        `
        )
        .eq('client_id', clientId)
        .order('week_start_date', { ascending: false })
        .order('id_order', { ascending: false });

      if (error) {
        console.error(error);
      } else setOrders(data ?? []);
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
    { id: 'history', label: 'Histórico', count: historyOrders.length },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Órdenes</p>

      {/* Tab bar */}
      <div className="flex gap-2">
        {tabs.map(({ id, label, count }) => {
          const isActive = activeTab === id;
          const cls =
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ' +
            (isActive
              ? 'bg-slate-800 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400');
          const badgeCls =
            'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ' +
            (isActive ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-600');
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('clients')
        .select(
          `
          *,
          lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
            id_macro_profile, name, protein_value, protein_unit, carb_value, carb_unit
          ),
          dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
            id_macro_profile, name, protein_value, protein_unit, carb_value, carb_unit
          )
        `
        )
        .eq('id_client', Number(id))
        .single();

      if (error) {
        console.error(error);
        return;
      }
      setCustomer(data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <p className="p-8 text-slate-400">Cargando cliente...</p>;
  if (!customer) return <p className="p-8 text-slate-400">Cliente no encontrado</p>;

  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  const planStyle = customer.plan_type
    ? (PLAN_TYPE[customer.plan_type] ?? PLAN_TYPE.estandar)
    : null;
  const hasMap = customer.latitude && customer.longitude;
  const hasMacros = customer.lunch_macro || customer.dinner_macro;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span
                className={
                  'text-xs px-2.5 py-0.5 rounded-full ' +
                  (customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')
                }
              >
                {customer.is_active ? 'Activo' : 'Inactivo'}
              </span>
              <span className={'text-xs px-2.5 py-0.5 rounded-full ' + typeStyle.className}>
                {typeStyle.label}
              </span>
              {planStyle && customer.client_type === 'personal' && (
                <span className={'text-xs px-2.5 py-0.5 rounded-full ' + planStyle.className}>
                  {planStyle.label}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1 text-sm text-slate-700 md:text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contacto</p>
            {customer.phone && <p>📞 {customer.phone}</p>}
            {customer.address_detail && <p>📍 {customer.address_detail}</p>}
          </div>
        </div>
        {customer.created_at && (
          <p className="text-xs text-slate-400 mt-4">
            Cliente desde{' '}
            {new Date(customer.created_at).toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Macros */}
      {customer.client_type === 'personal' && (
        <div className="bg-white  rounded-2xl p-6 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase">Perfiles Nutricionales</p>
          {hasMacros ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MacroPanel label="☀️ Almuerzo" accent="amber" macro={customer.lunch_macro} />
              <MacroPanel label="🌙 Cena" accent="indigo" macro={customer.dinner_macro} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Sin perfil nutricional registrado</p>
          )}
        </div>
      )}

      {/* Pagos */}

      <PaymentSection clientId={Number(id)} />

      {/* Orders */}
      <OrdersSection clientId={Number(id)} />

      {/* Map */}
      {hasMap && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
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
