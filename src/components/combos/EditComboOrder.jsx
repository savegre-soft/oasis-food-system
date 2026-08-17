import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { computeComboPrice } from '../comboUtils';
import { toDateString } from '../orderUtils';
import { useComboSelections } from '../../hooks/useComboSelections';
import ComboCategorySelector from './ComboCategorySelector';

// order: fila de combo_orders con combo_order_selections(combo_item_id, category, is_extra, unit_price)
// y payments(status, payment_date) anidados (misma forma que usa ComboOrdersTab).
// comboWeek: la semana a la que pertenece el pedido, con combo_week_categories
// (misma forma que usa AddComboOrder) — define qué ítems se pueden elegir.
// A diferencia de AddComboOrder, esto es una sola pantalla (no wizard): el
// cliente no cambia al editar, solo selecciones/pago/notas.
const EditComboOrder = ({ order, comboWeek, onSuccess }) => {
  const { supabase } = useApp();

  const categories = comboWeek?.combo_week_categories ?? [];

  // Cada fila guardada es una unidad (ver comboUtils): se reconstruyen tanto
  // las cantidades por ítem como el precio de las unidades extra, en el mismo
  // orden en que fueron guardadas. `unit_price ?? extra_charge` cubre pedidos
  // guardados antes de que existiera el precio por ítem.
  const buildInitial = () => {
    const quantities = {};
    const extraCharges = {};
    for (const s of order.combo_order_selections ?? []) {
      quantities[s.category] = quantities[s.category] ?? {};
      quantities[s.category][s.combo_item_id] = (quantities[s.category][s.combo_item_id] ?? 0) + 1;
      if (s.is_extra) {
        const key = `${s.category}:${s.combo_item_id}`;
        extraCharges[key] = [...(extraCharges[key] ?? []), s.unit_price ?? s.extra_charge];
      }
    }
    return { quantities, extraCharges };
  };

  const [status, setStatus] = useState(order.payments?.status ?? 'pending');
  const [paymentDate, setPaymentDate] = useState(
    order.payments?.payment_date ?? toDateString(new Date())
  );
  const [notes, setNotes] = useState(order.notes ?? '');
  const [loading, setLoading] = useState(false);

  const {
    quantities,
    extraCharges,
    poolTotal,
    pooledUsed,
    wouldExceedLimit,
    qtyOf,
    extraCountOf,
    extraTotalOf,
    addUnit,
    addExtraUnit,
    removeUnit,
  } = useComboSelections(categories, buildInitial());

  // Cada unidad que excede el cupo de su categoría se cobra automáticamente
  // al precio propio del ítem (combo_items.price) — ya no se le pregunta el
  // monto al staff.
  const handleIncrement = (category, itemId, maxSelections, itemName, itemPrice) => {
    if (wouldExceedLimit(category, maxSelections)) {
      addExtraUnit(category, itemId, Number(itemPrice) || 0);
      return;
    }
    addUnit(category, itemId);
  };

  const flatSelections = useMemo(() => {
    const rows = [];
    for (const cat of categories) {
      for (const cwci of cat.combo_week_category_items ?? []) {
        const itemId = cwci.combo_item_id;
        const qty = quantities[cat.category]?.[itemId] ?? 0;
        if (qty === 0) continue;
        const itemPrice = cwci.combo_items?.price ?? 0;
        const extraList = extraCharges[`${cat.category}:${itemId}`] ?? [];
        const normalQty = qty - extraList.length;
        for (let i = 0; i < normalQty; i++) {
          rows.push({
            category: cat.category,
            combo_item_id: itemId,
            unit_price: cat.category === 'plato_extra' ? itemPrice : null,
            is_extra: false,
            combo_items: cwci.combo_items,
          });
        }
        for (const charge of extraList) {
          rows.push({
            category: cat.category,
            combo_item_id: itemId,
            unit_price: charge,
            is_extra: true,
            combo_items: cwci.combo_items,
          });
        }
      }
    }
    return rows;
  }, [categories, quantities, extraCharges]);

  const totalPrice = computeComboPrice(comboWeek?.base_price, flatSelections);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      .update({ price: totalPrice, notes: notes || null })
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
            is_extra: s.is_extra,
            unit_price: s.unit_price,
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
    <form
      onSubmit={handleSubmit}
      className="p-2 max-w-2xl mx-auto dark:bg-slate-950 transition-colors space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Editar pedido de combo
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.clients?.name}</p>
      </div>

      <div className="space-y-4">
        <ComboCategorySelector
          categories={categories}
          poolTotal={poolTotal}
          pooledUsed={pooledUsed}
          qtyOf={qtyOf}
          extraCountOf={extraCountOf}
          extraTotalOf={extraTotalOf}
          onIncrement={handleIncrement}
          onDecrement={removeUnit}
        />

        <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Precio total
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            ₡{totalPrice.toLocaleString('es-CR')}
          </span>
        </div>
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
