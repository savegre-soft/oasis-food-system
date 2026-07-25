import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { COMBO_CATEGORIES, isGramCategory, isPooledCategory, computeComboPrice } from '../comboUtils';
import { toDateString } from '../orderUtils';

// order: fila de combo_orders con combo_order_selections(combo_item_id, category)
// y payments(status, payment_date) anidados (misma forma que usa ComboOrdersTab).
// comboWeek: la semana a la que pertenece el pedido, con combo_week_categories
// (misma forma que usa AddComboOrder) — define qué ítems se pueden elegir.
// A diferencia de AddComboOrder, esto es una sola pantalla (no wizard): el
// cliente no cambia al editar, solo selecciones/entrega/pago/notas.
const EditComboOrder = ({ order, comboWeek, onSuccess }) => {
  const { supabase } = useApp();

  const categories = comboWeek?.combo_week_categories ?? [];

  const initialSelections = () => {
    const sel = {};
    for (const s of order.combo_order_selections ?? []) {
      if (!sel[s.category]) sel[s.category] = new Set();
      sel[s.category].add(s.combo_item_id);
    }
    return sel;
  };

  const [deliveryDate, setDeliveryDate] = useState(order.delivery_date);
  const [selections, setSelections] = useState(initialSelections);
  const [status, setStatus] = useState(order.payments?.status ?? 'pending');
  const [paymentDate, setPaymentDate] = useState(order.payments?.payment_date ?? toDateString(new Date()));
  const [notes, setNotes] = useState(order.notes ?? '');
  const [loading, setLoading] = useState(false);

  // Mismo modelo de pool que AddComboOrder: Arroz/Proteína/Acompañamiento/Extra
  // comparten unidades; Plato Extra mantiene su propio tope (costo aparte).
  const poolTotal = categories
    .filter((c) => isPooledCategory(c.category))
    .reduce((sum, c) => sum + c.max_selections, 0);

  const pooledUsed = categories
    .filter((c) => isPooledCategory(c.category))
    .reduce((sum, c) => sum + (selections[c.category]?.size ?? 0), 0);

  const toggleSelection = (category, itemId, maxSelections) => {
    setSelections((prev) => {
      const current = new Set(prev[category] ?? []);
      if (current.has(itemId)) {
        current.delete(itemId);
      } else if (isPooledCategory(category)) {
        const pooledUsedNow = categories
          .filter((c) => isPooledCategory(c.category))
          .reduce((sum, c) => sum + (prev[c.category]?.size ?? 0), 0);
        if (pooledUsedNow >= poolTotal) return prev;
        current.add(itemId);
      } else {
        if (current.size >= maxSelections) return prev;
        current.add(itemId);
      }
      return { ...prev, [category]: current };
    });
  };

  const flatSelections = useMemo(() => {
    const rows = [];
    for (const cat of categories) {
      const chosen = selections[cat.category] ?? new Set();
      for (const cwci of cat.combo_week_category_items ?? []) {
        if (chosen.has(cwci.combo_item_id)) {
          rows.push({
            category: cat.category,
            combo_item_id: cwci.combo_item_id,
            extra_price: cwci.extra_price,
            item: cwci.combo_items,
          });
        }
      }
    }
    return rows;
  }, [selections, categories]);

  const totalPrice = computeComboPrice(comboWeek?.base_price, flatSelections);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryDate) {
      sileo.error('Ingresa la fecha de entrega');
      return;
    }
    if (status === 'paid' && !paymentDate) {
      sileo.error('Ingresa la fecha de pago');
      return;
    }
    setLoading(true);

    const effectivePaymentDate = status === 'paid' ? paymentDate : null;

    if (order.payment_id) {
      const { error: paymentError } = await supabase
        .schema('operations')
        .from('payments')
        .update({
          amount: totalPrice,
          payment_date: effectivePaymentDate,
          status,
          notes: notes || null,
        })
        .eq('id_payment', order.payment_id);
      if (paymentError) {
        sileo.error('Error al actualizar el pago');
        console.error(paymentError);
        setLoading(false);
        return;
      }
    }

    const { error: orderError } = await supabase
      .schema('operations')
      .from('combo_orders')
      .update({ delivery_date: deliveryDate, price: totalPrice, notes: notes || null })
      .eq('id_combo_order', order.id_combo_order);

    if (orderError) {
      sileo.error('Error al actualizar el pedido de combo');
      console.error(orderError);
      setLoading(false);
      return;
    }

    // Se reemplazan todas las selecciones — más simple que diffear, y el
    // pedido no tiene otras tablas que dependan de las selecciones previas.
    const { error: deleteError } = await supabase
      .schema('operations')
      .from('combo_order_selections')
      .delete()
      .eq('combo_order_id', order.id_combo_order);

    if (deleteError) {
      sileo.error('Error al reemplazar las selecciones');
      console.error(deleteError);
      setLoading(false);
      return;
    }

    if (flatSelections.length > 0) {
      const { error: selError } = await supabase
        .schema('operations')
        .from('combo_order_selections')
        .insert(
          flatSelections.map((s) => ({
            combo_order_id: order.id_combo_order,
            combo_item_id: s.combo_item_id,
            category: s.category,
          }))
        );
      if (selError) {
        sileo.error('Error al guardar las selecciones del combo');
        console.error(selError);
        setLoading(false);
        return;
      }
    }

    sileo.success('Pedido de combo actualizado');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 max-w-2xl mx-auto dark:bg-slate-950 transition-colors space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar pedido de combo</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.clients?.name}</p>
      </div>

      <div className="space-y-4">
        {poolTotal > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Unidades usadas (Arroz/Proteína/Acompañamiento/Extra)
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {pooledUsed} / {poolTotal}
            </span>
          </div>
        )}
        {categories.map((cat) => {
          const meta = COMBO_CATEGORIES.find((c) => c.key === cat.category);
          const chosen = selections[cat.category] ?? new Set();
          const pooled = isPooledCategory(cat.category);
          return (
            <div
              key={cat.id_combo_week_category}
              className="border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4"
            >
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                {meta?.label ?? cat.category}{' '}
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                  {pooled
                    ? `(sugerido: ${cat.max_selections}, según unidades disponibles)`
                    : `(elige hasta ${cat.max_selections})`}
                </span>
              </p>
              <div className="space-y-2">
                {(cat.combo_week_category_items ?? []).map((cwci) => {
                  const item = cwci.combo_items;
                  const checked = chosen.has(cwci.combo_item_id);
                  const atLimit = pooled
                    ? pooledUsed >= poolTotal && !checked
                    : chosen.size >= cat.max_selections && !checked;
                  return (
                    <label
                      key={cwci.id_combo_week_category_item}
                      className={`flex items-center gap-2 text-sm ${atLimit ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={atLimit}
                        onChange={() =>
                          toggleSelection(cat.category, cwci.combo_item_id, cat.max_selections)
                        }
                      />
                      {item?.name}
                      {isGramCategory(cat.category) && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ({item?.portion_size_g} g)
                        </span>
                      )}
                      {cat.category === 'plato_extra' && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          +₡{Number(cwci.extra_price ?? 0).toLocaleString()}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Precio total</span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            ₡{totalPrice.toLocaleString('es-CR')}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          Fecha de entrega
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          Estado
        </label>
        <div className="flex gap-2">
          {[
            ['pending', 'Pendiente'],
            ['paid', 'Pagado'],
            ['cancelled', 'Cancelado'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatus(val)}
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                status === val
                  ? val === 'pending'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400'
                    : val === 'paid'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700 text-red-800 dark:text-red-400'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {status === 'paid' ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Fecha de pago
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
          La fecha de pago se registra sola cuando el pago quede marcado como "Pagado".
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          Notas <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200 resize-none"
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-green-600 text-white hover:bg-slate-700 dark:hover:bg-green-500 transition text-sm font-semibold shadow-md disabled:opacity-40"
        >
          <Check size={16} /> {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};

export default EditComboOrder;
