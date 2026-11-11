import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import Seo from '../components/public/Seo';
import ComboCategorySelector from '../components/combos/ComboCategorySelector';
import { useComboSelections } from '../hooks/useComboSelections';
import { computeComboPrice } from '../components/comboUtils';

const PROMOTION_SELECT = `
  id_promotion, title, description, source_type, combo_week_id, bulk_dish_id, is_active,
  combo_weeks (
    id_combo_week, base_price,
    combo_week_categories (
      id_combo_week_category, category, max_selections,
      combo_week_category_items (
        id_combo_week_category_item, combo_item_id,
        combo_items ( id_combo_item, name, portion_size_g, category, price )
      )
    )
  ),
  bulk_dishes ( id_bulk_dish, name, suggested_price )
`;

// Pasarela pública de solicitud de una promoción (RF-CV-09/10 simplificado —
// ver docs/v2/07_REQUERIMIENTOS_COMBOS_VENTAS.md §6). Reemplaza el CTA de
// WhatsApp genérico: el cliente elige ítems (combo) o cantidad (venta
// masiva), llena sus datos de contacto, y la solicitud queda pendiente de
// confirmación manual por WhatsApp desde el panel interno — sin OTP ni
// proveedor de mensajería nuevo.
const RequestPromotion = () => {
  const { promotionId } = useParams();
  const { supabase } = useApp();

  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .schema('operations')
        .from('promotions')
        .select(PROMOTION_SELECT)
        .eq('id_promotion', promotionId)
        .eq('is_active', true)
        .maybeSingle();
      if (fetchError) console.error(fetchError);
      setPromotion(data ?? null);
      setLoading(false);
    };
    load();
  }, [supabase, promotionId]);

  const comboWeek = promotion?.combo_weeks;
  const categories = useMemo(() => comboWeek?.combo_week_categories ?? [], [comboWeek]);
  const bulkDish = promotion?.bulk_dishes;

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
  } = useComboSelections(categories);

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
          });
        }
        for (const charge of extraList) {
          rows.push({ category: cat.category, combo_item_id: itemId, unit_price: charge, is_extra: true });
        }
      }
    }
    return rows;
  }, [categories, quantities, extraCharges]);

  const totalPrice =
    promotion?.source_type === 'combo'
      ? computeComboPrice(comboWeek?.base_price, flatSelections)
      : promotion?.source_type === 'bulk_dish'
        ? (Number(bulkDish?.suggested_price) || 0) * quantity
        : null;

  const canSubmit =
    clientName.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && address.trim() !== '' && acceptedLegal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    if (honeypot) {
      setDone(true);
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      promotion_id: promotion.id_promotion,
      client_name: clientName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      delivery_address: address.trim(),
      quantity: promotion.source_type === 'bulk_dish' ? quantity : null,
      selections: promotion.source_type === 'combo' ? flatSelections : null,
      price: totalPrice,
    };

    const { error: insertError } = await supabase
      .schema('operations')
      .from('promotion_requests')
      .insert([payload]);

    setSubmitting(false);

    if (insertError) {
      console.error(insertError);
      setError('No se pudo enviar tu solicitud. Intentá de nuevo en un momento.');
      return;
    }

    setDone(true);
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-oasis-ink/70">Cargando...</div>;
  }

  if (!promotion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-oasis-ink mb-3">Esta promoción ya no está disponible</h1>
        <Link to="/promociones" className="text-oasis-olive-700 font-semibold hover:underline">
          Ver promociones vigentes
        </Link>
      </div>
    );
  }

  const needsSelectionStep = promotion.source_type === 'combo' || promotion.source_type === 'bulk_dish';

  return (
    <div>
      <Seo
        title={`Pedir ${promotion.title}`}
        description={`Solicitá "${promotion.title}" y coordinamos la entrega por WhatsApp.`}
        path={`/pedir-promo/${promotion.id_promotion}`}
      />

      <section className="bg-oasis-olive-50 py-14 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <SectionBadge>Solicitud</SectionBadge>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
            {promotion.title}
          </h1>
          {promotion.description && <p className="mt-3 text-oasis-ink/70">{promotion.description}</p>}
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-14">
        {done ? (
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold text-emerald-700 mb-2">¡Solicitud recibida!</h3>
            <p className="text-oasis-ink/70">
              Nuestro equipo te va a contactar por WhatsApp para confirmar tu solicitud y coordinar la
              entrega.
            </p>
            <Link to="/promociones" className="inline-block mt-6 text-oasis-olive-700 font-semibold hover:underline">
              Volver a Promociones
            </Link>
          </div>
        ) : (
          <>
            {needsSelectionStep && (
              <div className="flex items-center gap-2 mb-8 text-sm font-medium text-oasis-ink/60">
                <span className={step === 1 ? 'text-oasis-olive-700' : ''}>1. Elegí tu pedido</span>
                <span>→</span>
                <span className={step === 2 ? 'text-oasis-olive-700' : ''}>2. Tus datos</span>
              </div>
            )}

            {needsSelectionStep && step === 1 && (
              <div className="space-y-5">
                {promotion.source_type === 'combo' && (
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
                )}

                {promotion.source_type === 'bulk_dish' && (
                  <div className="flex items-center justify-between px-4 py-4 border border-oasis-olive-200 rounded-2xl bg-white">
                    <span className="font-medium text-oasis-ink">{bulkDish?.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-oasis-olive-200 text-oasis-ink/70 hover:bg-oasis-olive-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-oasis-olive-200 text-oasis-ink/70 hover:bg-oasis-olive-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-4 py-3 border border-oasis-olive-200 rounded-xl bg-oasis-olive-50">
                  <span className="text-sm font-medium text-oasis-ink/70">Precio total</span>
                  <span className="text-sm font-semibold text-oasis-ink">
                    ₡{Number(totalPrice ?? 0).toLocaleString('es-CR')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-oasis-olive-700 text-white py-3 rounded-2xl font-semibold hover:bg-oasis-olive-800 transition"
                >
                  Continuar
                </button>
              </div>
            )}

            {(!needsSelectionStep || step === 2) && (
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div>
                  <label className="block text-sm font-medium text-oasis-ink mb-2">Nombre</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-oasis-ink mb-2">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-oasis-ink mb-2">Número de teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="8888-8888"
                    className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-oasis-ink mb-2">Dirección de entrega</label>
                  <textarea
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Indicanos tu dirección exacta de entrega"
                    className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 text-sm text-oasis-ink/70">
                  <input
                    type="checkbox"
                    checked={acceptedLegal}
                    onChange={(e) => setAcceptedLegal(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Estos datos solo se usarán para contactarte sobre tu solicitud y coordinar la entrega,
                    no para ningún otro fin. Consultá nuestra{' '}
                    <Link to="/politica-privacidad" className="text-oasis-olive-700 font-semibold hover:underline">
                      política de privacidad
                    </Link>
                    .
                  </span>
                </label>

                {/* Honeypot — oculto para personas, visible para bots que completan todos los campos */}
                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <label htmlFor="website">Sitio web</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3">
                  {needsSelectionStep && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-2xl border border-oasis-olive-200 text-oasis-ink/70 font-medium hover:bg-oasis-olive-50 transition"
                    >
                      Atrás
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="flex-1 bg-oasis-olive-700 text-white py-3 rounded-2xl font-semibold hover:bg-oasis-olive-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RequestPromotion;
