import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, MessageCircle } from 'lucide-react';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import Seo from '../components/public/Seo';
import ComboCategorySelector from '../components/combos/ComboCategorySelector';
import { useComboSelections } from '../hooks/useComboSelections';
import { computeComboPrice } from '../components/comboUtils';
import { summarizeBatch } from '../components/bulkSalesUtils';
import { buildWhatsAppLink } from '../lib/siteContent';

const MANUAL_SELECT = 'id_promotion, title, description, is_active';

const COMBO_SELECT = `
  id_combo_week, base_price, is_published,
  combo_week_categories (
    id_combo_week_category, category, max_selections,
    combo_week_category_items (
      id_combo_week_category_item, combo_item_id,
      combo_items ( id_combo_item, name, portion_size_g, category, price )
    )
  )
`;

const BULK_DISH_SELECT = 'id_bulk_dish, name, suggested_price, is_published';

// Pasarela pública de solicitud (RF-CV-09/10 simplificado — ver
// docs/v2/07_REQUERIMIENTOS_COMBOS_VENTAS.md §6). Cubre los 3 tipos de
// "oferta" que puede mostrar /promociones — una promoción manual, un combo
// semanal o un plato de venta — cada uno vive en su propia tabla (ver
// supabase/migrations/20261112_decouple_combo_bulk_from_promotions.sql), así
// que la ruta trae `offerType` + `offerId` en vez de un solo `promotionId`.
// El cliente elige ítems (combo) o cantidad (venta) cuando corresponde,
// llena sus datos de contacto, y la solicitud queda pendiente de
// confirmación manual por WhatsApp desde el panel interno.
const RequestPromotion = () => {
  const { offerType, offerId } = useParams();
  const { supabase } = useApp();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [availableQty, setAvailableQty] = useState(null); // solo bulk_dish; null = aún no se sabe
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

      if (offerType === 'manual') {
        const { data, error: fetchError } = await supabase
          .schema('operations')
          .from('promotions')
          .select(MANUAL_SELECT)
          .eq('id_promotion', offerId)
          .eq('is_active', true)
          .maybeSingle();
        if (fetchError) console.error(fetchError);
        setOffer(data ? { ...data, title: data.title } : null);
      } else if (offerType === 'combo') {
        const { data, error: fetchError } = await supabase
          .schema('operations')
          .from('combo_weeks')
          .select(COMBO_SELECT)
          .eq('id_combo_week', offerId)
          .eq('is_published', true)
          .maybeSingle();
        if (fetchError) console.error(fetchError);
        setOffer(data ? { ...data, title: 'Combo de la semana' } : null);
      } else if (offerType === 'bulk_dish') {
        const { data, error: fetchError } = await supabase
          .schema('operations')
          .from('bulk_dishes')
          .select(BULK_DISH_SELECT)
          .eq('id_bulk_dish', offerId)
          .eq('is_published', true)
          .maybeSingle();
        if (fetchError) console.error(fetchError);
        setOffer(data ? { ...data, title: data.name } : null);
      } else {
        setOffer(null);
      }

      setLoading(false);
    };
    load();
  }, [supabase, offerType, offerId]);

  // Sobrante real del plato (suma de cocinado - vendido de todos sus lotes,
  // cada uno sin bajar de cero) — el pedido público nunca puede exceder esto,
  // mismo criterio que ya protege la confirmación en PromotionRequestsPanel.
  useEffect(() => {
    if (offerType !== 'bulk_dish' || !offer?.id_bulk_dish) return;
    const loadAvailability = async () => {
      const { data, error: fetchError } = await supabase
        .schema('operations')
        .from('bulk_sale_batches')
        .select('quantity_cooked, bulk_sale_entries(quantity)')
        .eq('bulk_dish_id', offer.id_bulk_dish);
      if (fetchError) {
        console.error(fetchError);
        setAvailableQty(0);
        return;
      }
      const total = (data ?? []).reduce((sum, batch) => sum + Math.max(summarizeBatch(batch).leftover, 0), 0);
      setAvailableQty(total);
      setQuantity((q) => Math.min(Math.max(q, 1), Math.max(total, 1)));
    };
    loadAvailability();
  }, [supabase, offerType, offer?.id_bulk_dish]);

  const categories = useMemo(() => offer?.combo_week_categories ?? [], [offer]);

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

  // Un plato sin precio configurado en el catálogo (price=null, distinto de
  // un ₡0 explícito) no se puede cobrar — ni como Plato Extra (siempre tiene
  // costo aparte) ni como excedente del cupo normal. En vez de dejarlo pasar
  // gratis, se bloquea acá para que el cliente no pueda pedir algo que el
  // staff todavía no le puso precio.
  const handleIncrement = (category, itemId, maxSelections, itemName, itemPrice) => {
    const exceedsLimit = wouldExceedLimit(category, maxSelections);
    const needsPrice = category === 'plato_extra' || exceedsLimit;
    if (needsPrice && itemPrice == null) {
      sileo.error(`"${itemName}" no tiene precio configurado todavía — contactanos por WhatsApp para pedirlo.`);
      return;
    }
    if (exceedsLimit) {
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
    offerType === 'combo'
      ? computeComboPrice(offer?.base_price, flatSelections)
      : offerType === 'bulk_dish'
        ? (Number(offer?.suggested_price) || 0) * quantity
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
      offer_type: offerType,
      promotion_id: offerType === 'manual' ? offer.id_promotion : null,
      combo_week_id: offerType === 'combo' ? offer.id_combo_week : null,
      bulk_dish_id: offerType === 'bulk_dish' ? offer.id_bulk_dish : null,
      client_name: clientName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      delivery_address: address.trim(),
      quantity: offerType === 'bulk_dish' ? quantity : null,
      selections: offerType === 'combo' ? flatSelections : null,
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

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-oasis-ink mb-3">Esta promoción ya no está disponible</h1>
        <Link to="/promociones" className="text-oasis-olive-700 font-semibold hover:underline">
          Ver promociones vigentes
        </Link>
      </div>
    );
  }

  const needsSelectionStep = offerType === 'combo' || offerType === 'bulk_dish';
  const isBulkDish = offerType === 'bulk_dish';
  const soldOut = isBulkDish && availableQty === 0;
  const atAvailableLimit = isBulkDish && availableQty != null && availableQty > 0 && quantity >= availableQty;
  const whatsAppMoreLink = isBulkDish
    ? buildWhatsAppLink(`Hola! Quiero pedir ${offer?.name ?? 'este plato'} — ¿tienen más disponible de lo que aparece en el sitio?`)
    : null;

  return (
    <div>
      <Seo
        title={`Pedir ${offer.title}`}
        description={`Solicitá "${offer.title}" y coordinamos la entrega por WhatsApp.`}
        path={`/pedir-promo/${offerType}/${offerId}`}
      />

      <section className="bg-oasis-olive-50 py-14 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <SectionBadge>Solicitud</SectionBadge>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
            {offer.title}
          </h1>
          {offer.description && <p className="mt-3 text-oasis-ink/70">{offer.description}</p>}
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
            {needsSelectionStep && !soldOut && (
              <div className="flex items-center gap-2 mb-8 text-sm font-medium text-oasis-ink/60">
                <span className={step === 1 ? 'text-oasis-olive-700' : ''}>1. Elegí tu pedido</span>
                <span>→</span>
                <span className={step === 2 ? 'text-oasis-olive-700' : ''}>2. Tus datos</span>
              </div>
            )}

            {needsSelectionStep && step === 1 && soldOut && (
              <div className="space-y-5">
                <div className="text-center px-4 py-8 border border-oasis-olive-200 rounded-2xl bg-white">
                  <p className="font-medium text-oasis-ink mb-1">{offer.name}</p>
                  <p className="text-sm text-oasis-ink/60 mb-5">
                    Por ahora no tenemos sobrante de este plato disponible para pedir en línea.
                  </p>
                  <a
                    href={whatsAppMoreLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-oasis-olive-700 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-oasis-olive-800 transition"
                  >
                    <MessageCircle size={16} /> Consultar por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {needsSelectionStep && step === 1 && !soldOut && (
              <div className="space-y-5">
                {offerType === 'combo' && (
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

                {isBulkDish && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-4 py-4 border border-oasis-olive-200 rounded-2xl bg-white">
                      <span className="font-medium text-oasis-ink">{offer.name}</span>
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
                          onClick={() => setQuantity((q) => Math.min(availableQty ?? q + 1, q + 1))}
                          disabled={atAvailableLimit || availableQty == null}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-oasis-olive-200 text-oasis-ink/70 hover:bg-oasis-olive-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {atAvailableLimit && (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-xs text-amber-700">
                          Solo quedan {availableQty} disponibles por ahora.
                        </span>
                        <a
                          href={whatsAppMoreLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline shrink-0"
                        >
                          <MessageCircle size={12} /> Pedir más por WhatsApp
                        </a>
                      </div>
                    )}
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
