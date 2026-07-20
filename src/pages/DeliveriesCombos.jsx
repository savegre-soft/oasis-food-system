import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import ComboDeliveryView from '../components/combos/ComboDeliveryView';

// offset: -1 = previous week, 0 = current week, 1 = next week
const computeWeekRange = (offset = 0) => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
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

const DeliveriesCombos = () => {
  const { supabase } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const { weekStart, weekEnd } = computeWeekRange(weekOffset);

  const [loading, setLoading] = useState(false);
  const [comboOrders, setComboOrders] = useState([]);

  const getComboData = async (wsStr, weStr) => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('combo_orders')
      .select(
        `id_combo_order, delivery_date, price, status,
         clients ( id_client, name ),
         combo_order_selections ( id_combo_order_selection, category, combo_item_id, combo_items ( name, portion_size_g ) )`
      )
      .gte('delivery_date', wsStr)
      .lte('delivery_date', weStr)
      .order('id_combo_order', { ascending: false });
    if (error) console.error(error);
    setComboOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const { weekStart: ws, weekEnd: we } = computeWeekRange(weekOffset);
    getComboData(ws, we);
  }, [weekOffset]);

  const refresh = async () => {
    const { weekStart: ws, weekEnd: we } = computeWeekRange(weekOffset);
    await getComboData(ws, we);
  };

  const updateComboOrderStatus = async (id, newStatus, successMsg) => {
    const { error } = await supabase
      .schema('operations')
      .from('combo_orders')
      .update({ status: newStatus })
      .eq('id_combo_order', id);
    if (error) {
      sileo.error('Error al actualizar el pedido de combo');
      console.error(error);
      return;
    }
    sileo.success(successMsg);
    await refresh();
  };

  const markComboPacked = (id) => updateComboOrderStatus(id, 'PACKED', '📦 Combo marcado como empacado');
  const markComboDelivered = (id) => updateComboOrderStatus(id, 'DELIVERED', '🚚 Combo entregado');
  const markComboPending = (id) => updateComboOrderStatus(id, 'PENDING', 'Combo devuelto a pendiente');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Combos</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {'Semana del '}
          {new Date(weekStart + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long' })}
          {' al '}
          {new Date(weekEnd + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

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

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
      ) : (
        <ComboDeliveryView
          orders={comboOrders}
          onPack={markComboPacked}
          onDeliver={markComboDelivered}
          onUnpack={markComboPending}
          onUndeliver={markComboPacked}
        />
      )}
    </div>
  );
};

export default DeliveriesCombos;
