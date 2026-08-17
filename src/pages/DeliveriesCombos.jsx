import { useState, useEffect, useCallback } from 'react';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';
import { toDateString } from '../components/orderUtils';

import ComboDeliveryView from '../components/combos/ComboDeliveryView';
import ComboPrintReport from '../components/combos/ComboPrintReport';

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

// Los combos ya no tienen fecha de entrega individual — se organizan solo
// por combo_week (rango de semana configurado por el staff en
// ComboWeekBuilder). Acá se navega entre semanas por índice en vez de por
// rango calendario.
const DeliveriesCombos = () => {
  const { supabase } = useApp();
  const [weeks, setWeeks] = useState([]);
  const [weekIndex, setWeekIndex] = useState(0);
  const [loadingWeeks, setLoadingWeeks] = useState(true);

  const [loading, setLoading] = useState(false);
  const [comboOrders, setComboOrders] = useState([]);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    const fetchWeeks = async () => {
      setLoadingWeeks(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('combo_weeks')
        .select('id_combo_week, week_start_date, week_end_date, status')
        .order('week_start_date', { ascending: true });
      if (error) console.error(error);
      const list = data ?? [];
      setWeeks(list);

      const todayStr = toDateString(new Date());
      let idx = list.findIndex((w) => w.status === 'open');
      if (idx === -1) {
        idx = list.reduce((best, w, i) => (w.week_start_date <= todayStr ? i : best), -1);
      }
      setWeekIndex(idx === -1 ? list.length - 1 : idx);
      setLoadingWeeks(false);
    };
    fetchWeeks();
  }, [supabase]);

  const currentWeek = weeks[weekIndex] ?? null;

  const getComboData = useCallback(
    async (weekId) => {
      if (!weekId) {
        setComboOrders([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('combo_orders')
        .select(
          `id_combo_order, price, status,
         clients ( id_client, name ),
         combo_order_selections ( id_combo_order_selection, category, combo_item_id, combo_items ( name, portion_size_g ) )`
        )
        .eq('combo_week_id', weekId)
        .order('id_combo_order', { ascending: false });
      if (error) console.error(error);
      setComboOrders(data ?? []);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    setTimeout(() => getComboData(currentWeek?.id_combo_week), 0);
  }, [currentWeek, getComboData]);

  const refresh = async () => getComboData(currentWeek?.id_combo_week);

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

  const weekLabel = currentWeek
    ? 'Semana del ' +
      fmtDate(currentWeek.week_start_date, { day: '2-digit', month: 'long' }) +
      ' al ' +
      fmtDate(currentWeek.week_end_date, { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Sin semanas de combo configuradas';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      {showPrint && <ComboPrintReport orders={comboOrders} weekLabel={weekLabel} onClose={() => setShowPrint(false)} />}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Combos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{weekLabel}</p>
        </div>
        <button
          onClick={() => setShowPrint(true)}
          disabled={!currentWeek}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 px-4 py-2.5 rounded-xl text-sm font-medium transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={15} /> Imprimir resumen
        </button>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
          disabled={weekIndex <= 0}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium min-w-[8rem] text-center">
          {weeks.length > 0 ? `Semana ${weekIndex + 1} de ${weeks.length}` : ''}
        </span>
        <button
          onClick={() => setWeekIndex((i) => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIndex >= weeks.length - 1}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loadingWeeks || loading ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
      ) : !currentWeek ? (
        <p className="text-slate-400 dark:text-slate-600 text-sm">
          No hay ninguna semana de combo configurada todavía.
        </p>
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
