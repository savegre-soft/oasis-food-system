import { useState, useEffect } from 'react';
import { Zap, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';

import ProductionPrintReport from '../components/ProductionPrintReport';
import KitchenPipeline from '../components/KitchenPipeline';
import { useOrderDayActions } from '../hooks/useOrderDayActions';

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

const DeliveriesExpress = () => {
  const { supabase } = useApp();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('cocina');
  const [showPrint, setShowPrint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingDays, setPendingDays] = useState([]);
  const [packedDays, setPackedDays] = useState([]);
  const [deliveredDays, setDeliveredDays] = useState([]);

  const getData = async () => {
    setLoading(true);
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
    setPendingDays((p.data ?? []).filter(isExpress));
    setPackedDays((k.data ?? []).filter(isExpress));
    setDeliveredDays((d.data ?? []).filter(isExpress));
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  const {
    markPacked,
    markDelivered,
    markPending,
    markPackedDetail,
    markDeliveredDetail,
    markPendingDetail,
  } = useOrderDayActions(supabase, getData);

  const todayLabel = new Date(todayStr + 'T00:00:00').toLocaleDateString('es-CR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      {showPrint && (
        <ProductionPrintReport
          orderDays={[...pendingDays, ...packedDays, ...deliveredDays]}
          slotLabel="Express"
          weekLabel={todayLabel}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Express</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Entrega hoy · {todayLabel}</p>
        </div>
        <button
          onClick={() => setShowPrint(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 px-4 py-2.5 rounded-xl text-sm font-medium transition shrink-0"
        >
          <Printer size={15} /> Imprimir resumen
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-5 py-4 flex items-center gap-3 mb-8">
        <Zap size={18} className="text-amber-500 dark:text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Pedidos Express</p>
          <p className="text-xs text-amber-600 dark:text-amber-400/80">Sin ruta fija, entrega el mismo día</p>
        </div>
        <div className="ml-auto">
          <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 px-2 py-0.5 rounded-full text-xs font-semibold">
            {pendingDays.length + packedDays.length} activos
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
      ) : (
        <KitchenPipeline
          pendingDays={pendingDays}
          packedDays={packedDays}
          deliveredDays={deliveredDays}
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
    </div>
  );
};

export default DeliveriesExpress;
