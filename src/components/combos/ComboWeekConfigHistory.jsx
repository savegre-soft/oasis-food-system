import { useState, useEffect, useCallback } from 'react';
import { History, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import ConfirmDialog from '../ConfirmDialog';
import { COMBO_CATEGORY_LABEL, CATEGORY_ORDER, isGramCategory } from '../comboUtils';
import { toDateString } from '../orderUtils';

const HISTORY_PAGE_SIZE = 8;

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

// Mismo select anidado que ComboOrdersTab.jsx (COMBO_WEEK_SELECT), sin
// filtrar por status='open' — trae todas las semanas para ver cómo se armó
// cada combo (categorías/ítems/precio), no los pedidos de clientes contra
// él (eso ya lo muestra ComboHistoryView.jsx). Incluye combo_items.is_active
// para poder filtrarlos al reutilizar una configuración vieja (ver applyConfig).
const COMBO_WEEK_CONFIG_SELECT = `
  id_combo_week, week_start_date, week_end_date, base_price, image_url,
  combo_week_categories (
    id_combo_week_category, category, max_selections,
    combo_week_category_items (
      id_combo_week_category_item, combo_item_id, extra_price,
      combo_items ( id_combo_item, name, portion_size_g, category, price, is_active )
    )
  )
`;

// onApplied: callback opcional (ej. cambiar a la pestaña "Semana" en Combos.jsx)
// para que el staff vea de inmediato el resultado tras reutilizar una config.
const ComboWeekConfigHistory = ({ onApplied }) => {
  const { supabase } = useApp();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [confirmWeek, setConfirmWeek] = useState(null);
  const [applying, setApplying] = useState(false);

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

  // Reutiliza las categorías/ítems/precio base de `week` (una semana pasada)
  // como el combo de la semana actual: si ya hay una semana abierta, se le
  // reemplaza toda la configuración (mismo patrón delete+reinsert de
  // ComboWeekBuilder.jsx — los pedidos ya registrados no se ven afectados,
  // referencian combo_item_id directo); si no hay ninguna abierta, se crea
  // una nueva con fechas desde hoy. Se descartan ítems desactivados desde
  // entonces, y los de Plato Extra sin precio asignado hoy (no se puede
  // cobrar automáticamente sin uno).
  const applyConfig = async (week) => {
    setApplying(true);
    try {
      const { data: openWeek, error: openError } = await supabase
        .schema('operations')
        .from('combo_weeks')
        .select('id_combo_week')
        .eq('status', 'open')
        .order('id_combo_week', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (openError) throw openError;

      let targetWeekId = openWeek?.id_combo_week;
      if (!targetWeekId) {
        const today = new Date();
        const inSevenDays = new Date(today);
        inSevenDays.setDate(today.getDate() + 6);
        const { data: newWeek, error: insertError } = await supabase
          .schema('operations')
          .from('combo_weeks')
          .insert([
            {
              week_start_date: toDateString(today),
              week_end_date: toDateString(inSevenDays),
              base_price: week.base_price,
              status: 'open',
            },
          ])
          .select('id_combo_week')
          .single();
        if (insertError) throw insertError;
        targetWeekId = newWeek.id_combo_week;
      } else {
        const { error: updateError } = await supabase
          .schema('operations')
          .from('combo_weeks')
          .update({ base_price: week.base_price })
          .eq('id_combo_week', targetWeekId);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .schema('operations')
          .from('combo_week_categories')
          .delete()
          .eq('combo_week_id', targetWeekId);
        if (deleteError) throw deleteError;
      }

      for (const cat of week.combo_week_categories ?? []) {
        const validItems = (cat.combo_week_category_items ?? []).filter((cwci) => {
          const item = cwci.combo_items;
          if (!item || item.is_active === false) return false;
          if (cat.category === 'plato_extra' && !(Number(item.price) > 0)) return false;
          return true;
        });
        if (validItems.length === 0) continue;

        const { data: catData, error: catError } = await supabase
          .schema('operations')
          .from('combo_week_categories')
          .insert([
            {
              combo_week_id: targetWeekId,
              category: cat.category,
              max_selections: cat.max_selections,
            },
          ])
          .select('id_combo_week_category')
          .single();
        if (catError) throw catError;

        const rows = validItems.map((cwci) => ({
          combo_week_category_id: catData.id_combo_week_category,
          combo_item_id: cwci.combo_item_id,
        }));
        const { error: itemsError } = await supabase
          .schema('operations')
          .from('combo_week_category_items')
          .insert(rows);
        if (itemsError) throw itemsError;
      }

      sileo.success('Configuración aplicada al combo de esta semana');
      if (onApplied) onApplied();
    } catch (err) {
      console.error(err);
      sileo.error('No se pudo aplicar la configuración');
    } finally {
      setApplying(false);
      setConfirmWeek(null);
    }
  };

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
      <ConfirmDialog
        open={!!confirmWeek}
        title="¿Usar esta configuración?"
        message={`Se reemplazará la configuración del combo de esta semana (categorías, ítems y precio base) por la de la semana del ${confirmWeek ? fmtDate(confirmWeek.week_start_date, { day: '2-digit', month: 'long' }) : ''}. Los pedidos ya registrados no se ven afectados.`}
        confirmLabel={applying ? 'Aplicando...' : 'Usar esta configuración'}
        confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition disabled:opacity-50"
        onConfirm={() => applyConfig(confirmWeek)}
        onCancel={() => setConfirmWeek(null)}
      />

      {paginated.map((week) => {
        const categories = [...(week.combo_week_categories ?? [])].sort(
          (a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)
        );

        return (
          <div key={week.id_combo_week}>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {week.image_url && (
                <img
                  src={week.image_url}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              )}
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 min-w-[1rem]" />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {fmtDate(week.week_start_date, { day: '2-digit', month: 'long' })}
                {' - '}
                {fmtDate(week.week_end_date, { day: '2-digit', month: 'long', year: 'numeric' })}
                {' · ₡'}
                {Number(week.base_price).toLocaleString('es-CR')} base
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 min-w-[1rem]" />
              <button
                onClick={() => setConfirmWeek(week)}
                disabled={applying}
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={12} /> Usar esta semana
              </button>
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
                        {cat.combo_week_category_items.map((cwci) => {
                          // extra_price: snapshot histórico de semanas configuradas
                          // antes del precio por ítem; combo_items.price es el
                          // precio vigente, usado como respaldo en semanas nuevas.
                          const price = cwci.extra_price ?? cwci.combo_items?.price;
                          return (
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
                              {price != null && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                                  +₡{Number(price).toLocaleString('es-CR')}
                                </span>
                              )}
                            </li>
                          );
                        })}
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
