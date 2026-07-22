import { useState, useEffect } from 'react';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ComboOrderCard from './ComboOrderCard';

const HISTORY_PAGE_SIZE = 8;

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

const COMBO_WEEK_HISTORY_SELECT = `
  id_combo_week, week_start_date, week_end_date, base_price, image_url,
  combo_orders (
    id_combo_order, delivery_date, price, status,
    clients ( id_client, name ),
    combo_order_selections ( id_combo_order_selection, category, combo_items ( name, portion_size_g ) )
  )
`;

// Mismo patrón de agrupado/paginado que HistoryView en pages/Orders.jsx, pero
// agrupando por combo_weeks en vez de orders.week_start_date. La semana más
// reciente se muestra en la pestaña "Semana" (ComboOrdersTab); acá va el resto.
const ComboHistoryView = () => {
  const { supabase } = useApp();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchWeeks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('combo_weeks')
        .select(COMBO_WEEK_HISTORY_SELECT)
        .order('id_combo_week', { ascending: false });
      if (error) console.error(error);
      setWeeks((data ?? []).slice(1));
      setLoading(false);
    };
    fetchWeeks();
  }, []);

  const totalPages = Math.ceil(weeks.length / HISTORY_PAGE_SIZE);
  const paginated = weeks.slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE);

  if (loading) return <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>;

  if (weeks.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-600">
        <History size={40} className="mx-auto mb-3 opacity-30" />
        <p>No hay historial de combos todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {paginated.map((week) => (
        <div key={week.id_combo_week}>
          <div className="flex items-center gap-3 mb-3">
            {week.image_url && (
              <img
                src={week.image_url}
                alt=""
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            )}
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">
              {fmtDate(week.week_start_date, { day: '2-digit', month: 'long' })}
              {' - '}
              {fmtDate(week.week_end_date, { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · ₡'}
              {Number(week.base_price).toLocaleString('es-CR')} base
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          {(week.combo_orders ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">
              Sin pedidos registrados esa semana
            </p>
          ) : (
            <div className="space-y-3">
              {[...week.combo_orders]
                .sort((a, b) => b.id_combo_order - a.id_combo_order)
                .map((o) => (
                  <ComboOrderCard key={o.id_combo_order} order={o} />
                ))}
            </div>
          )}
        </div>
      ))}

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

export default ComboHistoryView;
