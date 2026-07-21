import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { COMBO_CATEGORIES, isGramCategory, computeComboPrice } from '../comboUtils';
import { toDateString } from '../orderUtils';

const STEPS = ['Cliente', 'Combo', 'Pago', 'Confirmar'];

// comboWeek: fila de combo_weeks con combo_week_categories(*, combo_week_category_items(*, combo_items(*)))
const AddComboOrder = ({ comboWeek, clients, onSuccess }) => {
  const { supabase } = useApp();

  const [step, setStep] = useState(1);

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

  const canGoNext = () => {
    if (step === 1) return !!selectedClient;
    if (step === 3) return !!deliveryDate && (status !== 'paid' || !!paymentDate);
    return true;
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const resetWizard = () => {
    setStep(1);
    setClientSearch('');
    setSelectedClient(null);
    setDeliveryDate(toDateString(new Date()));
    setSelections({});
    setStatus('pending');
    setPaymentDate(toDateString(new Date()));
    setNotes('');
  };

  const handleSubmit = async () => {
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
    resetWizard();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-2xl mx-auto dark:bg-slate-950 transition-colors">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Nuevo pedido de combo
      </h2>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const pos = i + 1;
          const active = pos === step;
          const done = pos < step;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  active
                    ? 'bg-green-800 dark:bg-green-600 text-white ring-4 ring-slate-100 dark:ring-green-900/30'
                    : done
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {done ? '✓' : pos}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  active
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 transition-colors ${
                    done ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        {/* Paso 1 — Cliente */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Buscar cliente…"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-600 bg-white dark:bg-slate-900 dark:text-slate-200 transition-all shadow-sm"
              spellCheck="false"
              autoComplete="off"
            />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {clients
                .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                .map((c) => {
                  const isSelected = selectedClient?.id_client === c.id_client;
                  return (
                    <button
                      key={c.id_client}
                      type="button"
                      onClick={() => setSelectedClient(c)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm shadow-sm ${
                        isSelected
                          ? 'bg-green-800 dark:bg-green-600 text-white border-green-800 dark:border-green-500'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Paso 2 — Selecciones del combo */}
        {step === 2 && (
          <div className="space-y-4">
            {categories.map((cat) => {
              const meta = COMBO_CATEGORIES.find((c) => c.key === cat.category);
              const chosen = selections[cat.category] ?? new Set();
              return (
                <div
                  key={cat.id_combo_week_category}
                  className="border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                    {meta?.label ?? cat.category}{' '}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
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
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Precio total
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                ₡{totalPrice.toLocaleString('es-CR')}
              </span>
            </div>
          </div>
        )}

        {/* Paso 3 — Entrega y pago */}
        {step === 3 && (
          <div className="space-y-5">
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
          </div>
        )}

        {/* Paso 4 — Confirmar */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Cliente</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {selectedClient?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Entrega</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {deliveryDate}
                </span>
              </div>
              {flatSelections.length > 0 && (
                <div className="text-sm">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Selecciones</span>
                  <ul className="space-y-1">
                    {flatSelections.map((s) => (
                      <li
                        key={s.combo_item_id}
                        className="text-slate-700 dark:text-slate-300 flex justify-between"
                      >
                        <span>{s.item?.name}</span>
                        {s.category === 'plato_extra' && (
                          <span className="text-amber-600 dark:text-amber-400">
                            +₡{Number(s.extra_price ?? 0).toLocaleString()}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Precio total</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  ₡{totalPrice.toLocaleString('es-CR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Estado de pago</span>
                <span className="font-medium text-slate-800 dark:text-slate-100 capitalize">
                  {status === 'pending' ? 'Pendiente' : status === 'paid' ? 'Pagado' : 'Cancelado'}
                </span>
              </div>
              {notes && (
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Notas</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 text-right">
                    {notes}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex justify-between mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition text-sm font-medium"
          >
            <ChevronLeft size={16} /> Atrás
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-800 dark:bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500 transition text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-green-600 text-white hover:bg-slate-700 dark:hover:bg-green-500 transition text-sm font-semibold shadow-md disabled:opacity-40"
          >
            <Check size={16} /> {loading ? 'Guardando…' : 'Registrar pedido de combo'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AddComboOrder;
