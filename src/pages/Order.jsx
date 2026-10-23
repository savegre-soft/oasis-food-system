import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import Seo from '../components/public/Seo';
import { getWeekRange } from '../components/orderUtils';
import { DELIVERY_ZONES, WHATSAPP_LINK } from '../lib/siteContent';

const WELL_SHOTS = [
  { key: 'wellshot-reset', name: 'Reset', desc: 'Piña, jengibre, limón, pimienta negra, cúrcuma' },
  {
    key: 'wellshot-energy',
    name: 'Energy Boost',
    desc: 'Remolacha, maracuyá, jengibre, limón, miel',
  },
  { key: 'wellshot-skin', name: 'Skin Glow', desc: 'Naranja, zanahoria, cúrcuma, jengibre' },
];

const QtyControl = ({ value, onChange, label }) => (
  <div className="flex items-center gap-3 bg-oasis-olive-50 rounded-full px-2 py-1">
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      aria-label={`Restar ${label}`}
      className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-oasis-olive-700 hover:bg-oasis-olive-100 transition"
    >
      <Minus size={14} />
    </button>
    <span className="w-5 text-center text-sm font-semibold text-oasis-ink">{value}</span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      aria-label={`Sumar ${label}`}
      className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-oasis-olive-700 hover:bg-oasis-olive-100 transition"
    >
      <Plus size={14} />
    </button>
  </div>
);

const Order = () => {
  const { supabase } = useApp();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});

  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const weekLabel = getWeekRange().label;

  useEffect(() => {
    let active = true;

    const loadRecipes = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('recipes')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!active) return;
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      setRecipes(data ?? []);
      setLoading(false);
    };

    loadRecipes();
    return () => {
      active = false;
    };
  }, [supabase]);

  const setQty = (key, value) => setQuantities((q) => ({ ...q, [key]: value }));

  const cartItems = useMemo(() => {
    const items = [];

    recipes.forEach((dish) => {
      const key = `recipe-${dish.id_recipe}`;
      const qty = quantities[key] ?? 0;
      if (qty > 0) items.push({ key, name: dish.name, qty });
    });

    WELL_SHOTS.forEach((shot) => {
      const qty = quantities[shot.key] ?? 0;
      if (qty > 0) items.push({ key: shot.key, name: `${shot.name} (shot)`, qty });
    });

    return items;
  }, [recipes, quantities]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const buildSummary = () => {
    const lines = [
      `Pedido Oasis — semana del ${weekLabel}`,
      ...cartItems.map((i) => `${i.qty} × ${i.name}`),
      '',
      `Nombre: ${name || '—'}`,
      `Zona de entrega: ${zone || '—'}`,
      notes ? `Notas: ${notes}` : null,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      sileo.error({ title: 'Falta tu nombre', description: 'Ingresá tu nombre para continuar.' });
      return;
    }

    if (totalItems === 0) {
      sileo.error({ title: 'Pedido vacío', description: 'Elegí al menos un plato o Well Shot.' });
      return;
    }

    setSubmitting(true);

    const summary = buildSummary();

    const { error } = await supabase
      .schema('operations')
      .from('leads')
      .insert([
        {
          name: name.trim(),
          message: summary,
          source: 'pedido',
        },
      ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      sileo.error({
        title: 'No se pudo registrar tu pedido',
        description: 'Intentá de nuevo en un momento.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      sileo.success({
        title: 'Pedido copiado',
        description: 'Pegalo en el chat de WhatsApp que se va a abrir para confirmarlo.',
      });
    } catch {
      sileo.success({
        title: 'Pedido recibido',
        description: 'Te escribimos por WhatsApp para confirmar.',
      });
    }

    window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <Seo
        title="Armá tu pedido"
        description="Armá tu pedido de comida saludable preparada en Oasis: elegí almuerzos y Well Shot, confirmá tu zona de entrega y enviá tu pedido por WhatsApp."
        path="/ordenar"
        keywords={['pedir comida saludable', 'armar pedido online', 'entrega bajo pedido']}
      />

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <SectionBadge>Hacé tu pedido</SectionBadge>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
          Armá tu pedido
        </h1>

        <div className="mt-6 bg-oasis-olive-700 text-white rounded-2xl px-5 py-3 text-sm inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Pedidos para la semana del {weekLabel} — cerramos el viernes a medianoche
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid lg:grid-cols-[1.6fr_1fr] gap-10 items-start"
        >
          {/* Items */}
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-4">Almuerzos</h2>

              {loading && <p className="text-oasis-ink/70 text-sm">Cargando menú...</p>}

              <div className="space-y-3">
                {recipes.map((dish) => {
                  const key = `recipe-${dish.id_recipe}`;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 bg-white border border-oasis-olive-100 rounded-2xl px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-oasis-ink">{dish.name}</p>
                        {dish.description && (
                          <p className="text-sm text-oasis-ink/60 truncate">{dish.description}</p>
                        )}
                        <p className="text-xs text-oasis-ink/70 mt-1">₡ —</p>
                      </div>
                      <QtyControl
                        value={quantities[key] ?? 0}
                        onChange={(v) => setQty(key, v)}
                        label={dish.name}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-4">Well Shot</h2>

              <div className="space-y-3">
                {WELL_SHOTS.map((shot) => (
                  <div
                    key={shot.key}
                    className="flex items-center justify-between gap-4 bg-white border border-oasis-olive-100 rounded-2xl px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-oasis-ink">{shot.name}</p>
                      <p className="text-sm text-oasis-ink/60 truncate">{shot.desc}</p>
                      <p className="text-xs text-oasis-ink/70 mt-1">₡ —</p>
                    </div>
                    <QtyControl
                      value={quantities[shot.key] ?? 0}
                      onChange={(v) => setQty(shot.key, v)}
                      label={shot.name}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-oasis-olive-50 rounded-3xl p-7 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-4">Tu pedido</h2>

            {cartItems.length === 0 ? (
              <p className="text-sm text-oasis-ink/70">Todavía no agregaste platos.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {cartItems.map((item) => (
                  <li key={item.key} className="flex justify-between text-oasis-ink/80">
                    <span>
                      {item.qty} × {item.name}
                    </span>
                    <span className="text-oasis-ink/70">₡ —</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-between items-center mt-5 pt-5 border-t border-oasis-olive-200 font-semibold text-oasis-ink">
              <span>Total</span>
              <span>₡ —</span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="order-name"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Nombre
                </label>
                <input
                  id="order-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="order-zone"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Zona de entrega
                </label>
                <select
                  id="order-zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                >
                  <option value="">Elegí tu zona</option>
                  {DELIVERY_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="order-delivery-day"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Día de entrega
                </label>
                <input
                  id="order-delivery-day"
                  disabled
                  value="Según la ruta de tu zona"
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-oasis-olive-100/50 text-oasis-ink/70 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="order-notes"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Notas
                </label>
                <textarea
                  id="order-notes"
                  rows="3"
                  placeholder="Alergias, preferencias, dirección…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-oasis-olive-600 text-white py-3.5 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 transition disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
              </button>
              <p className="text-xs text-oasis-ink/70 text-center">
                Te confirmamos el pedido y el total por WhatsApp.
              </p>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Order;
