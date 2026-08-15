import { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

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

  return (
    <div className="py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">Promociones Especiales</h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Aprovecha nuestras ofertas exclusivas y disfruta más sabor por menos precio.
        </p>
      </div>

      {loading && <div className="text-center text-slate-500">Cargando promociones...</div>}

      {!loading && promos.length === 0 && (
        <div className="text-center text-slate-500 py-10">
          No hay promociones activas en este momento. Volvé a revisar pronto.
        </div>
      )}

      {/* Promo Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {promos.map((promo, index) => (
          <motion.div
            key={promo.id_promotion}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
          >
            {promo.image_url && (
              <img src={promo.image_url} alt={promo.title} className="w-full h-48 object-cover" />
            )}

            {promo.badge && (
              <span className="absolute top-4 right-4 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full shadow">
                {promo.badge}
              </span>
            )}

            <div className="p-8 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-xl font-semibold text-emerald-700 mb-3">{promo.title}</h3>
                {promo.description && (
                  <p className="text-slate-600 text-sm mb-6">{promo.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-6">
                {getDisplayPrice(promo) && (
                  <span className="text-2xl font-bold text-emerald-800">{getDisplayPrice(promo)}</span>
                )}

                <Link
                  to="/ordenar"
                  className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-700 hover:scale-105 transition"
                >
                  Ordenar
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
          ¡No dejes pasar estas ofertas!
        </h2>
        <p className="mt-3 text-slate-600">Promociones válidas por tiempo limitado.</p>
        <Link
          to="/menu"
          className="inline-block mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition"
        >
          Ver Menú Completo
        </Link>
      </div>
    </div>
  );
};

export default Promotions;
