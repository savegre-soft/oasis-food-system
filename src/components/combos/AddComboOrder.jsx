import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { COMBO_CATEGORIES, isGramCategory, computeComboPrice } from '../comboUtils';
import { toDateString } from '../orderUtils';

// comboWeek: fila de combo_weeks con combo_week_categories(*, combo_week_category_items(*, combo_items(*)))
const AddComboOrder = ({ comboWeek, clients, onSuccess }) => {
  const { supabase } = useApp();

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(toDateString(new Date()));
  const [selections, setSelections] = useState({}); // { [category]: Set<combo_item_id> }
  const [status, setStatus] = useState('pending');
  const [paymentDate, setPaymentDate] = useState(toDateString(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = comboWeek?.combo_week_categories ?? [];

  const toggleSelection = (category, itemId, maxSelections) => {
    setSelections((prev) => {
      const current = new Set(prev[category] ?? []);
      if (current.has(itemId)) {
        current.delete(itemId);
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
    if (!selectedClient) {
      sileo.error('Selecciona un cliente');
      return;
    }
    setLoading(true);

    const effectivePaymentDate = status === 'paid' ? paymentDate : null;
    const { data: paymentData, error: paymentError } = await supabase
      .schema('operations')
      .from('payments')
      .insert([
        {
          client_id: selectedClient.id_client,
          payment_type: 'combo',
          amount: totalPrice,
          currency: 'CRC',
          payment_date: effectivePaymentDate,
          status,
          notes: notes || null,
        },
      ])
      .select('id_payment')
      .single();

    if (paymentError) {
      sileo.error('Error al registrar el pago');
      console.error(paymentError);
      setLoading(false);
      return;
    }

    const { data: orderData, error: orderError } = await supabase
      .schema('operations')
      .from('combo_orders')
      .insert([
        {
          combo_week_id: comboWeek.id_combo_week,
          client_id: selectedClient.id_client,
          delivery_date: deliveryDate,
          price: totalPrice,
          status: 'PENDING',
          payment_id: paymentData.id_payment,
          notes: notes || null,
        },
      ])
      .select('id_combo_order')
      .single();

    if (orderError) {
      sileo.error('Error al registrar el pedido de combo');
      console.error(orderError);
      setLoading(false);
      return;
    }

    if (flatSelections.length > 0) {
      const { error: selError } = await supabase
        .schema('operations')
        .from('combo_order_selections')
        .insert(
          flatSelections.map((s) => ({
            combo_order_id: orderData.id_combo_order,
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

    sileo.success('Pedido de combo registrado');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Nuevo pedido de combo</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Cliente</label>
          <input
            type="text"
            placeholder="Buscar cliente…"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 mb-2"
          />
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {clients
              .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
              .map((c) => (
                <button
                  key={c.id_client}
                  type="button"
                  onClick={() => setSelectedClient(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition ${
                    selectedClient?.id_client === c.id_client
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </div>

        {/* Categorías / selecciones */}
        {categories.map((cat) => {
          const meta = COMBO_CATEGORIES.find((c) => c.key === cat.category);
          const chosen = selections[cat.category] ?? new Set();
          return (
            <div key={cat.id_combo_week_category} className="border-2 border-slate-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                {meta?.label ?? cat.category}{' '}
                <span className="text-slate-400 font-normal">
                  (elige hasta {cat.max_selections})
                </span>
              </p>
              <div className="space-y-2">
                {(cat.combo_week_category_items ?? []).map((cwci) => {
                  const item = cwci.combo_items;
                  const checked = chosen.has(cwci.combo_item_id);
                  const atLimit = chosen.size >= cat.max_selections && !checked;
                  return (
                    <label
                      key={cwci.id_combo_week_category_item}
                      className={`flex items-center gap-2 text-sm ${atLimit ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={atLimit}
                        onChange={() => toggleSelection(cat.category, cwci.combo_item_id, cat.max_selections)}
                      />
                      {item?.name}
                      {isGramCategory(cat.category) && (
                        <span className="text-xs text-slate-400">({item?.portion_size_g} g)</span>
                      )}
                      {cat.category === 'plato_extra' && (
                        <span className="text-xs text-amber-600">
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

        {/* Entrega y precio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Fecha de entrega
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Precio total</label>
            <p className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 font-semibold text-slate-800">
              ₡{totalPrice.toLocaleString('es-CR')}
            </p>
          </div>
        </div>

        {/* Pago */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
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
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                      : val === 'paid'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {status === 'paid' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Fecha de pago
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            La fecha de pago se registra sola cuando el pago quede marcado como "Pagado".
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Notas <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Guardando...' : 'Registrar pedido de combo'}
        </button>
      </form>
    </div>
  );
};

export default AddComboOrder;
