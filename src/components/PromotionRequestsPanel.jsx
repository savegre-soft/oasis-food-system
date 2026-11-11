import { useEffect, useState, useCallback, useMemo } from 'react';
import { MessageCircle, Check, X, Inbox } from 'lucide-react';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';
import { computeComboPrice, groupSelectionsByItem } from './comboUtils';
import { summarizeBatch } from './bulkSalesUtils';
import { SOURCE_TYPE_LABEL } from '../lib/promotionSourceLabels';

const STATUS_LABEL = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
};

const STATUS_CLASS = {
  pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  contacted: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
  confirmed: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  rejected: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

const REQUEST_SELECT = `
  id_promotion_request, client_name, email, phone, delivery_address, quantity, selections, price,
  status, whatsapp_sent_at, created_at,
  promotions (
    id_promotion, title, source_type, combo_week_id, bulk_dish_id,
    combo_weeks ( id_combo_week, base_price ),
    bulk_dishes ( id_bulk_dish, name, suggested_price )
  )
`;

// Bandeja de solicitudes públicas de promociones (combo / venta masiva /
// manual). Reutilizada sin filtro en PromotionsAdmin.jsx (todas) y filtrada
// por `sourceTypeFilter="combo"` en Combos.jsx (solo las de combo, para que
// el staff no tenga que salir de esa pantalla).
const PromotionRequestsPanel = ({ sourceTypeFilter }) => {
  const { supabase } = useApp();

  const [requests, setRequests] = useState([]);
  const [comboItemsById, setComboItemsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [batchOptions, setBatchOptions] = useState({}); // { [id_promotion_request]: batches[] }
  const [selectedBatch, setSelectedBatch] = useState({}); // { [id_promotion_request]: id_bulk_sale_batch }
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .select(REQUEST_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setRequests(data ?? []);

    // `selections` es un snapshot jsonb (solo category/combo_item_id/...), sin
    // el nombre del ítem anidado — se resuelve acá en un solo query por los
    // ids que aparezcan, para que groupSelectionsByItem (que espera
    // row.combo_items.name) pueda mostrarlos.
    const itemIds = [
      ...new Set((data ?? []).flatMap((r) => (r.selections ?? []).map((s) => s.combo_item_id))),
    ];
    if (itemIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .schema('operations')
        .from('combo_items')
        .select('id_combo_item, name, portion_size_g, price')
        .in('id_combo_item', itemIds);
      if (itemsError) console.error(itemsError);
      setComboItemsById(Object.fromEntries((items ?? []).map((it) => [it.id_combo_item, it])));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRequests(), 0);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    if (!sourceTypeFilter) return requests;
    return requests.filter((r) => r.promotions?.source_type === sourceTypeFilter);
  }, [requests, sourceTypeFilter]);

  const groupedSelections = useCallback(
    (req) => {
      if (!req.selections) return [];
      const enriched = req.selections.map((s) => ({
        ...s,
        combo_items: comboItemsById[s.combo_item_id],
      }));
      return groupSelectionsByItem(enriched);
    },
    [comboItemsById]
  );

  const sendWhatsApp = async (req) => {
    const message = `Hola ${req.client_name}, somos Oasis. Vimos tu solicitud de "${req.promotions?.title ?? 'promoción'}" y queremos confirmarla contigo antes de prepararla. ¿Nos confirmas que fuiste tú quien la hizo?`;
    const phone = req.phone?.trim();
    if (!phone) {
      sileo.error('La solicitud no tiene teléfono');
      return;
    }
    window.open(`https://wa.me/506${phone}?text=${encodeURIComponent(message)}`, '_blank');

    const patch = { whatsapp_sent_at: new Date().toISOString() };
    if (req.status === 'pending') patch.status = 'contacted';
    const { error } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .update(patch)
      .eq('id_promotion_request', req.id_promotion_request);
    if (error) {
      console.error(error);
      return;
    }
    await fetchRequests();
  };

  const reject = async (req) => {
    const { error } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .update({ status: 'rejected' })
      .eq('id_promotion_request', req.id_promotion_request);
    if (error) {
      sileo.error('No se pudo rechazar la solicitud');
      console.error(error);
      return;
    }
    sileo.success('Solicitud rechazada');
    await fetchRequests();
  };

  // Para venta masiva: carga los lotes de ese plato con sobrante > 0, para
  // que el staff elija contra cuál se registra la venta al confirmar.
  const loadBatchOptions = async (req) => {
    const bulkDishId = req.promotions?.bulk_dish_id;
    if (!bulkDishId) return;
    const { data, error } = await supabase
      .schema('operations')
      .from('bulk_sale_batches')
      .select('id_bulk_sale_batch, batch_date, quantity_cooked, bulk_dishes(name), bulk_sale_entries(quantity)')
      .eq('bulk_dish_id', bulkDishId)
      .order('batch_date', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    const withLeftover = (data ?? [])
      .map((batch) => ({ ...batch, leftover: summarizeBatch(batch).leftover }))
      .filter((batch) => batch.leftover > 0);
    setBatchOptions((prev) => ({ ...prev, [req.id_promotion_request]: withLeftover }));
  };

  // Resuelve un cliente existente por teléfono o crea uno nuevo mínimo (sin
  // macros — los combos/venta masiva no las usan), mismo criterio de insert
  // mínimo que AddCustomer.jsx.
  const resolveClient = async (req) => {
    const phone = req.phone?.trim();
    if (phone) {
      const { data: existing, error: findError } = await supabase
        .schema('operations')
        .from('clients')
        .select('id_client')
        .eq('phone', phone)
        .limit(1)
        .maybeSingle();
      if (findError) throw findError;
      if (existing) return existing.id_client;
    }
    const { data: created, error: createError } = await supabase
      .schema('operations')
      .from('clients')
      .insert([
        {
          name: req.client_name,
          phone: phone || null,
          address_detail: req.delivery_address,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id_client')
      .single();
    if (createError) throw createError;
    return created.id_client;
  };

  // El cliente público manda `selections`/`price` calculados en su propio
  // navegador (ver RequestPromotion.jsx) — nunca se confía en ellos para
  // cobrar. Acá se recalculan desde cero contra la configuración real de la
  // semana (operations.combo_week_categories/combo_week_category_items) al
  // momento de confirmar: se descarta cualquier (categoría, ítem) que no
  // exista en esa configuración, y las unidades que exceden el cupo de cada
  // categoría (o que son de Plato Extra) se cobran al precio real del
  // catálogo (combo_items.price), nunca al que mandó el cliente.
  const recomputeComboSelections = async (req) => {
    const { data: categories, error } = await supabase
      .schema('operations')
      .from('combo_week_categories')
      .select(
        'id_combo_week_category, category, max_selections, combo_week_category_items(combo_item_id, combo_items(price))'
      )
      .eq('combo_week_id', req.promotions.combo_week_id);
    if (error) throw error;

    const validItemIds = new Set();
    const maxByCategory = {};
    const priceByItem = {};
    for (const cat of categories ?? []) {
      maxByCategory[cat.category] = cat.max_selections;
      for (const cwci of cat.combo_week_category_items ?? []) {
        validItemIds.add(`${cat.category}:${cwci.combo_item_id}`);
        priceByItem[cwci.combo_item_id] = Number(cwci.combo_items?.price) || 0;
      }
    }

    // Cuenta unidades por (categoría, ítem), descartando cualquier par que no
    // esté realmente configurado para esta semana.
    const counts = [];
    for (const s of req.selections ?? []) {
      const key = `${s.category}:${s.combo_item_id}`;
      if (!validItemIds.has(key)) continue;
      const existing = counts.find((c) => c.category === s.category && c.combo_item_id === s.combo_item_id);
      if (existing) existing.qty += 1;
      else counts.push({ category: s.category, combo_item_id: s.combo_item_id, qty: 1 });
    }

    const poolCapacity = Object.entries(maxByCategory)
      .filter(([category]) => category !== 'plato_extra')
      .reduce((sum, [, max]) => sum + max, 0);

    // El pool (cubierto por `base_price`) se asigna a las unidades más baratas
    // primero, sin importar el orden en que el cliente mandó `selections` —
    // de lo contrario un solicitante podría listar sus ítems más caros
    // primero para que caigan "gratis" en el pool y empujar los baratos a
    // overflow, pagando menos de lo que realmente pidió.
    const nonExtraUnits = [];
    const platoExtraUnits = [];
    for (const c of counts) {
      const target = c.category === 'plato_extra' ? platoExtraUnits : nonExtraUnits;
      for (let i = 0; i < c.qty; i++) {
        target.push({ category: c.category, combo_item_id: c.combo_item_id });
      }
    }
    nonExtraUnits.sort((a, b) => (priceByItem[a.combo_item_id] ?? 0) - (priceByItem[b.combo_item_id] ?? 0));

    const rows = nonExtraUnits.map((unit, idx) => {
      const overflow = idx >= poolCapacity;
      return {
        category: unit.category,
        combo_item_id: unit.combo_item_id,
        is_extra: overflow,
        unit_price: overflow ? priceByItem[unit.combo_item_id] : null,
      };
    });
    for (const unit of platoExtraUnits) {
      rows.push({
        category: unit.category,
        combo_item_id: unit.combo_item_id,
        is_extra: true,
        unit_price: priceByItem[unit.combo_item_id],
      });
    }

    return { selections: rows, price: computeComboPrice(req.promotions.combo_weeks?.base_price, rows) };
  };

  const confirmCombo = async (req) => {
    const { selections, price } = await recomputeComboSelections(req);
    const clientId = await resolveClient(req);

    const { data: payment, error: paymentError } = await supabase
      .schema('operations')
      .from('payments')
      .insert([
        {
          client_id: clientId,
          payment_type: 'combo',
          amount: price,
          currency: 'CRC',
          payment_date: null,
          status: 'pending',
          notes: 'Pedido desde el portal público de promociones',
        },
      ])
      .select('id_payment')
      .single();
    if (paymentError) throw paymentError;

    const { data: order, error: orderError } = await supabase
      .schema('operations')
      .from('combo_orders')
      .insert([
        {
          combo_week_id: req.promotions.combo_week_id,
          client_id: clientId,
          price,
          status: 'PENDING',
          payment_id: payment.id_payment,
          notes: 'Pedido desde el portal público de promociones',
        },
      ])
      .select('id_combo_order')
      .single();
    if (orderError) throw orderError;

    if (selections.length > 0) {
      const { error: selError } = await supabase
        .schema('operations')
        .from('combo_order_selections')
        .insert(
          selections.map((s) => ({
            combo_order_id: order.id_combo_order,
            combo_item_id: s.combo_item_id,
            category: s.category,
            is_extra: s.is_extra,
            unit_price: s.unit_price,
          }))
        );
      if (selError) throw selError;
    }

    const { error: updateError } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .update({ status: 'confirmed', converted_combo_order_id: order.id_combo_order })
      .eq('id_promotion_request', req.id_promotion_request);
    if (updateError) throw updateError;
  };

  const confirmBulk = async (req) => {
    const batchId = selectedBatch[req.id_promotion_request];
    if (!batchId) {
      sileo.error('Elige el lote contra el que se registra la venta');
      throw new Error('batch_not_selected');
    }

    // `batchOptions` se cargó al abrir el select y puede estar desactualizado
    // si se registraron otras ventas de ese lote mientras la solicitud
    // seguía pendiente — se recalcula el sobrante real justo antes de
    // confirmar, para no sobrevender.
    const { data: batch, error: batchError } = await supabase
      .schema('operations')
      .from('bulk_sale_batches')
      .select('quantity_cooked, bulk_sale_entries(quantity)')
      .eq('id_bulk_sale_batch', batchId)
      .single();
    if (batchError) throw batchError;

    const quantity = Number(req.quantity) || 1;
    const { leftover } = summarizeBatch(batch);
    if (quantity > leftover) {
      sileo.error(`El lote elegido solo tiene ${leftover} de sobrante — no alcanza para esta solicitud`);
      throw new Error('insufficient_leftover');
    }

    const clientId = await resolveClient(req);
    // Igual que en combos: el monto se recalcula desde el precio real del
    // catálogo (suggested_price), nunca desde el `price` que mandó el cliente.
    const amount = quantity * (Number(req.promotions?.bulk_dishes?.suggested_price) || 0);

    const { data: payment, error: paymentError } = await supabase
      .schema('operations')
      .from('payments')
      .insert([
        {
          client_id: clientId,
          payment_type: 'bulk',
          amount,
          currency: 'CRC',
          payment_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          notes: `Venta masiva desde el portal público: ${req.promotions?.title ?? ''}`,
        },
      ])
      .select('id_payment')
      .single();
    if (paymentError) throw paymentError;

    const { data: entry, error: entryError } = await supabase
      .schema('operations')
      .from('bulk_sale_entries')
      .insert([
        {
          batch_id: batchId,
          client_id: clientId,
          quantity,
          amount,
          payment_id: payment.id_payment,
        },
      ])
      .select('id_bulk_sale_entry')
      .single();
    if (entryError) {
      await supabase.schema('operations').from('payments').delete().eq('id_payment', payment.id_payment);
      throw entryError;
    }

    const { error: updateError } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .update({ status: 'confirmed', converted_bulk_sale_entry_id: entry.id_bulk_sale_entry })
      .eq('id_promotion_request', req.id_promotion_request);
    if (updateError) throw updateError;
  };

  const confirmManual = async (req) => {
    const { error } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .update({ status: 'confirmed' })
      .eq('id_promotion_request', req.id_promotion_request);
    if (error) throw error;
  };

  const confirm = async (req) => {
    setProcessingId(req.id_promotion_request);
    try {
      const sourceType = req.promotions?.source_type;
      if (sourceType === 'combo') await confirmCombo(req);
      else if (sourceType === 'bulk_dish') await confirmBulk(req);
      else await confirmManual(req);
      sileo.success('Solicitud confirmada');
      await fetchRequests();
    } catch (err) {
      if (err?.message !== 'batch_not_selected' && err?.message !== 'insufficient_leftover') {
        console.error(err);
        sileo.error('No se pudo confirmar la solicitud');
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>;

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-600">
        <Inbox size={40} className="mx-auto mb-3 opacity-30" />
        <p>Sin solicitudes de promociones todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredRequests.map((req) => {
        const sourceType = req.promotions?.source_type;
        const isDone = req.status === 'confirmed' || req.status === 'rejected';
        const grouped = groupedSelections(req);
        return (
          <div
            key={req.id_promotion_request}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{req.client_name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {req.promotions?.title} ·{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {SOURCE_TYPE_LABEL[sourceType] ?? sourceType}
                  </span>
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_CLASS[req.status] ?? ''}`}
              >
                {STATUS_LABEL[req.status] ?? req.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-1 text-sm text-slate-600 dark:text-slate-400 mb-2">
              <p>📞 {req.phone}</p>
              <p>✉️ {req.email}</p>
              <p className="sm:col-span-2">📍 {req.delivery_address}</p>
            </div>

            {sourceType === 'combo' && grouped.length > 0 && (
              <ul className="text-sm text-slate-700 dark:text-slate-300 mb-2 space-y-0.5">
                {grouped.map((s) => (
                  <li key={s.combo_item_id}>
                    {s.combo_items?.name}
                    {s.qty > 1 && ` ×${s.qty}`}
                  </li>
                ))}
              </ul>
            )}

            {sourceType === 'bulk_dish' && (
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Cantidad solicitada: {req.quantity}
              </p>
            )}

            {req.price != null && (
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                ₡{Number(req.price).toLocaleString('es-CR')}
              </p>
            )}

            {sourceType === 'bulk_dish' && !isDone && (
              <div className="mb-3">
                <select
                  value={selectedBatch[req.id_promotion_request] ?? ''}
                  onChange={(e) =>
                    setSelectedBatch((prev) => ({ ...prev, [req.id_promotion_request]: e.target.value }))
                  }
                  onFocus={() => {
                    if (!batchOptions[req.id_promotion_request]) loadBatchOptions(req);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">Elegir lote para la venta…</option>
                  {(batchOptions[req.id_promotion_request] ?? []).map((batch) => (
                    <option key={batch.id_bulk_sale_batch} value={batch.id_bulk_sale_batch}>
                      {batch.batch_date} · sobrante: {batch.leftover}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => sendWhatsApp(req)}
                className="flex items-center gap-1.5 text-xs font-medium bg-green-600 text-white px-2.5 py-1.5 rounded-xl hover:bg-green-700 transition"
              >
                <MessageCircle size={12} />
                {req.whatsapp_sent_at ? 'Reenviar WhatsApp' : 'Confirmar por WhatsApp'}
              </button>

              {!isDone && (
                <>
                  <button
                    onClick={() => confirm(req)}
                    disabled={processingId === req.id_promotion_request}
                    className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 dark:bg-slate-700 text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition disabled:opacity-50"
                  >
                    <Check size={12} />
                    {processingId === req.id_promotion_request ? 'Confirmando…' : 'Confirmar solicitud'}
                  </button>
                  <button
                    onClick={() => reject(req)}
                    className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-1.5 rounded-xl hover:border-red-300 hover:text-red-600 transition"
                  >
                    <X size={12} /> Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionRequestsPanel;
