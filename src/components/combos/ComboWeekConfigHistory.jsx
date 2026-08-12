import { useState, useEffect, useCallback } from 'react';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COMBO_CATEGORY_LABEL, CATEGORY_ORDER, isGramCategory } from '../comboUtils';

const HISTORY_PAGE_SIZE = 8;

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

// Mismo select anidado que ComboOrdersTab.jsx (COMBO_WEEK_SELECT), sin
// filtrar por status='open' — trae todas las semanas para ver cómo se armó
// cada combo (categorías/ítems/precio), no los pedidos de clientes contra
// él (eso ya lo muestra ComboHistoryView.jsx).
const COMBO_WEEK_CONFIG_SELECT = `
  id_combo_week, week_start_date, week_end_date, base_price, image_url,
  combo_week_categories (
    id_combo_week_category, category, max_selections,
    combo_week_category_items (
      id_combo_week_category_item, combo_item_id, extra_price,
      combo_items ( id_combo_item, name, portion_size_g, category )
    )
  )
`;

const ComboWeekConfigHistory = () => {
  const { supabase } = useApp();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchWeeks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('combo_weeks')
      .select(COMBO_WEEK_CONFIG_SELECT)
      .order('id_combo_week', { ascending: false });
    if (error) console.error(error);
    // La semana más reciente ya se ve en la pestaña "Semana" — acá va el resto.
    setWeeks((data ?? []).slice(1));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => fetchWeeks(), 0);
    return () => clearTimeout(timer);
  }, [fetchWeeks]);

  const totalPages = Math.ceil(weeks.length / HISTORY_PAGE_SIZE);
  const paginated = weeks.slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE);

  if (loading) return <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>;

  if (weeks.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-600">
        <History size={40} className="mx-auto mb-3 opacity-30" />
        <p>No hay semanas anteriores todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {paginated.map((week) => {
        const categories = [...(week.combo_week_categories ?? [])].sort(
          (a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)
        );

        return (
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

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">
                Sin categorías configuradas esa semana
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id_combo_week_category}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {COMBO_CATEGORY_LABEL[cat.category] ?? cat.category}
                      </h4>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        máx. {cat.max_selections}
                      </span>
                    </div>
                    {(cat.combo_week_category_items ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-600">Sin ítems habilitados</p>
                    ) : (
                      <ul className="space-y-1">
                        {cat.combo_week_category_items.map((cwci) => (
                          <li
                            key={cwci.id_combo_week_category_item}
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2"
                          >
                            <span>
                              {cwci.combo_items?.name}
                              {isGramCategory(cat.category) && cwci.combo_items?.portion_size_g
                                ? ` (${cwci.combo_items.portion_size_g}g)`
                                : ''}
                            </span>
                            {cwci.extra_price != null && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                                +₡{Number(cwci.extra_price).toLocaleString('es-CR')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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

export default ComboWeekConfigHistory;
