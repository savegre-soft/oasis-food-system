import { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import Seo from '../components/public/Seo';

// Precio en vivo desde el combo/plato vinculado (si corresponde) — ver misma
// lógica en PromotionsAdmin.jsx.
const getDisplayPrice = (promo) => {
  if (promo.source_type === 'combo' && promo.combo_weeks?.base_price != null) {
    return `₡${Number(promo.combo_weeks.base_price).toLocaleString('es-CR')}`;
  }
  if (promo.source_type === 'bulk_dish' && promo.bulk_dishes?.suggested_price != null) {
    return `₡${Number(promo.bulk_dishes.suggested_price).toLocaleString('es-CR')}`;
  }
  return promo.price_label;
};

const TONES = ['sage', 'butter', 'rose', 'sand'];

const Promotions = () => {
  const { supabase } = useApp();

  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('promotions')
        .select('*, combo_weeks(base_price), bulk_dishes(suggested_price)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setPromos(data ?? []);
      setLoading(false);
    };

    loadPromotions();
  }, [supabase]);

  const [featured, ...rest] = promos;

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

        {/* Promo destacada */}
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
                {getDisplayPrice(featured) && (
                  <span className="text-2xl font-bold">{getDisplayPrice(featured)}</span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/ordenar"
                  className="bg-white text-oasis-olive-700 px-6 py-2.5 rounded-full font-semibold hover:bg-oasis-cream transition"
                >
                  Pedir esta promo
                </Link>
                <Link
                  to="/contacto"
                  className="border-2 border-white/60 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 transition"
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

        {/* Resto de promos */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((promo, index) => (
            <motion.div
              key={promo.id_promotion}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-oasis-olive-100 overflow-hidden"
            >
              {promo.image_url ? (
                <img src={promo.image_url} alt={promo.title} className="w-full h-40 object-cover" />
              ) : (
                <PlaceholderImage
                  tone={TONES[index % TONES.length]}
                  rounded="rounded-none"
                  className="h-40"
                />
              )}

              <div className="p-6">
                {promo.badge && (
                  <span className="text-xs font-semibold text-oasis-terracotta-dark uppercase tracking-wide">
                    {promo.badge}
                  </span>
                )}
                <h3 className="font-semibold text-oasis-ink mt-1">{promo.title}</h3>
                {promo.description && (
                  <p className="text-oasis-ink/60 text-sm mt-2">{promo.description}</p>
                )}
                {promo.validity && (
                  <p className="text-xs text-oasis-terracotta-dark mt-3">
                    ● Válida: {promo.validity}
                  </p>
                )}

                <div className="flex items-center justify-between mt-5">
                  {getDisplayPrice(promo) && (
                    <span className="font-semibold text-oasis-ink">{getDisplayPrice(promo)}</span>
                  )}
                  <Link
                    to="/ordenar"
                    className="bg-oasis-olive-100 text-oasis-olive-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-oasis-olive-600 hover:text-white transition"
                  >
                    Pedir
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Condiciones */}
        <div className="mt-10 bg-oasis-olive-50 rounded-2xl p-6 text-sm text-oasis-ink/60">
          <p className="font-semibold text-oasis-ink mb-1">Condiciones</p>
          Promociones no acumulables. Aplican para pedidos realizados antes del cierre del viernes a
          medianoche y en las zonas de entrega disponibles.
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="bg-oasis-olive-800 text-white py-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">
          ¡No dejes pasar estas ofertas!
        </h2>
        <p className="mt-3 text-oasis-olive-200">Promociones válidas por tiempo limitado.</p>
        <Link
          to="/menu"
          className="inline-block mt-6 bg-white text-oasis-olive-700 px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-oasis-cream transition"
        >
          Ver Menú Completo
        </Link>
      </section>
    </div>
  );
};

export default Promotions;
