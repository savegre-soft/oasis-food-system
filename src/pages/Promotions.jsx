import { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import Seo from '../components/public/Seo';
import { Reveal, Stagger, StaggerItem } from '../components/public/Motion';

const fmtPrice = (n) => (n != null ? `₡${Number(n).toLocaleString('es-CR')}` : null);

const fmtWeekRange = (start, end) => {
  const opts = { day: '2-digit', month: 'short' };
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-CR', opts);
  return `Semana del ${fmt(start)} al ${fmt(end)}`;
};

const TONES = ['sage', 'butter', 'rose', 'sand'];

// Un combo o una venta publicados acá no son "una promoción" — cada uno
// vive en su propia tabla con su propio flag `is_published` (ver
// supabase/migrations/20261112_decouple_combo_bulk_from_promotions.sql).
// Esta página los normaliza a una forma común solo para mostrarlos juntos,
// agrupados por tipo, en la sección pública "Promociones".
const SECTION_LABEL = { manual: 'Promociones', combo: 'Combos', bulk_dish: 'Ventas' };
const SECTION_ORDER = ['manual', 'combo', 'bulk_dish'];

const PromoCard = ({ promo, index }) => (
  <StaggerItem
    whileHover={{ y: -6 }}
    className="group bg-white rounded-2xl border border-oasis-olive-100 overflow-hidden hover:shadow-xl hover:border-oasis-olive-200 transition"
  >
    <div className="overflow-hidden h-40">
      {promo.image_url ? (
        <img
          src={promo.image_url}
          alt={promo.title}
          className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <PlaceholderImage
          tone={TONES[index % TONES.length]}
          rounded="rounded-none"
          className="h-40 transition-transform duration-500 group-hover:scale-105"
        />
      )}
    </div>

    <div className="p-6">
      {promo.badge && (
        <span className="text-xs font-semibold text-oasis-terracotta-dark uppercase tracking-wide">
          {promo.badge}
        </span>
      )}
      <h3 className="font-semibold text-oasis-ink mt-1">{promo.title}</h3>
      {promo.description && <p className="text-oasis-ink/60 text-sm mt-2">{promo.description}</p>}

      <div className="flex items-center justify-between mt-5">
        {promo.price_label && <span className="font-semibold text-oasis-ink">{promo.price_label}</span>}
        <Link
          to={`/pedir-promo/${promo.offer_type}/${promo.offer_id}`}
          className="bg-oasis-olive-100 text-oasis-olive-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-oasis-olive-600 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          Pedir
        </Link>
      </div>
    </div>
  </StaggerItem>
);

const Promotions = () => {
  const { supabase } = useApp();

  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true);
      const [{ data: manual, error: manualError }, { data: combos, error: comboError }, { data: bulk, error: bulkError }] =
        await Promise.all([
          supabase
            .schema('operations')
            .from('promotions')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
          supabase
            .schema('operations')
            .from('combo_weeks')
            .select('id_combo_week, base_price, image_url, week_start_date, week_end_date')
            .eq('is_published', true)
            .order('id_combo_week', { ascending: false }),
          supabase
            .schema('operations')
            .from('bulk_dishes')
            .select('id_bulk_dish, name, suggested_price')
            .eq('is_published', true)
            .order('name'),
        ]);

      if (manualError || comboError || bulkError) {
        console.error(manualError || comboError || bulkError);
        setLoading(false);
        return;
      }

      const normalized = [
        ...(manual ?? []).map((p) => ({
          offer_type: 'manual',
          offer_id: p.id_promotion,
          title: p.title,
          description: p.description,
          price_label: p.price_label,
          badge: p.badge,
          image_url: p.image_url,
        })),
        ...(combos ?? []).map((cw) => ({
          offer_type: 'combo',
          offer_id: cw.id_combo_week,
          title: 'Combo de la semana',
          description: fmtWeekRange(cw.week_start_date, cw.week_end_date),
          price_label: fmtPrice(cw.base_price),
          badge: null,
          image_url: cw.image_url,
        })),
        ...(bulk ?? []).map((bd) => ({
          offer_type: 'bulk_dish',
          offer_id: bd.id_bulk_dish,
          title: bd.name,
          description: null,
          price_label: fmtPrice(bd.suggested_price),
          badge: null,
          image_url: null,
        })),
      ];

      setPromos(normalized);
      setLoading(false);
    };

    loadPromotions();
  }, [supabase]);

  // Solo una promoción manual puede ser la destacada — combos/ventas no son
  // "la promo de la semana", son su propia sección siempre.
  const featuredIndex = promos.findIndex((p) => p.offer_type === 'manual');
  const featured = featuredIndex >= 0 ? promos[featuredIndex] : null;
  const rest = featured ? promos.filter((_, i) => i !== featuredIndex) : promos;

  const sections = SECTION_ORDER.map((type) => ({
    type,
    label: SECTION_LABEL[type],
    items: rest.filter((p) => p.offer_type === type),
  })).filter((section) => section.items.length > 0);

  return (
    <div>
      <Seo
        title="Promociones de comida saludable"
        description="Promos de la semana en Oasis: combos de almuerzos saludables, Well Shot y snack bar a precio especial. Válidas hasta agotar existencias."
        path="/promociones"
        keywords={[
          'promociones comida saludable',
          'combos de almuerzo',
          'ofertas comida preparada',
        ]}
      />

      {/* Header */}
      <section className="bg-oasis-olive-50 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <SectionBadge>Promociones</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Promos de la semana
          </h1>
          <p className="mt-4 text-oasis-ink/70">
            Aprovechá nuestras promociones vigentes. Válidas hasta agotar existencias o según fecha
            indicada.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        {loading && <div className="text-center text-oasis-ink/70">Cargando promociones...</div>}

        {!loading && promos.length === 0 && (
          <div className="text-center text-oasis-ink/70 py-10">
            No hay promociones activas en este momento. Volvé a revisar pronto.
          </div>
        )}

        {/* Promo destacada (solo manual) */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-oasis-olive-700 rounded-3xl overflow-hidden grid md:grid-cols-2 mb-10"
          >
            <div className="p-8 md:p-10 text-white">
              {featured.badge && (
                <span className="inline-block bg-oasis-terracotta text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  {featured.badge}
                </span>
              )}
              <h2 className="font-display text-3xl font-semibold">{featured.title}</h2>
              {featured.description && (
                <p className="mt-3 text-oasis-olive-100">{featured.description}</p>
              )}

              <div className="mt-6 flex items-center gap-3">
                {featured.price_label && (
                  <span className="text-2xl font-bold">{featured.price_label}</span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/pedir-promo/${featured.offer_type}/${featured.offer_id}`}
                  className="bg-white text-oasis-olive-700 px-6 py-2.5 rounded-full font-semibold hover:bg-oasis-cream hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Pedir esta promo
                </Link>
                <Link
                  to="/contacto"
                  className="border-2 border-white/60 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Ver condiciones
                </Link>
              </div>
            </div>

            {featured.image_url ? (
              <img
                src={featured.image_url}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <PlaceholderImage
                tone="olive"
                rounded="rounded-none"
                className="min-h-55"
                caption="Foto: promo destacada"
              />
            )}
          </motion.div>
        )}

        {/* Resto de ofertas, agrupadas por tipo (Promociones/Combos/Ventas) */}
        {sections.map((section) => (
          <div key={section.type} className="mb-12 last:mb-0">
            <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-6">{section.label}</h2>
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
              {section.items.map((promo, index) => (
                <PromoCard key={`${promo.offer_type}-${promo.offer_id}`} promo={promo} index={index} />
              ))}
            </Stagger>
          </div>
        ))}

        {/* Condiciones */}
        <div className="mt-10 bg-oasis-olive-50 rounded-2xl p-6 text-sm text-oasis-ink/60">
          <p className="font-semibold text-oasis-ink mb-1">Condiciones</p>
          Promociones no acumulables. Aplican para pedidos realizados antes del cierre del viernes a
          medianoche y en las zonas de entrega disponibles.
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="bg-oasis-olive-800 text-white py-16 text-center">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold">
            ¡No dejes pasar estas ofertas!
          </h2>
          <p className="mt-3 text-oasis-olive-200">Promociones válidas por tiempo limitado.</p>
          <Link
            to="/menu"
            className="inline-block mt-6 bg-white text-oasis-olive-700 px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-oasis-cream hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Ver Menú Completo
          </Link>
        </Reveal>
      </section>
    </div>
  );
};

export default Promotions;
