import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Menu = () => {
  const { supabase } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('recipes')
      .select('*')
      .eq('is_active', true)
      .order('id_recipe', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setRecipes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  return (
    <div className="py-16">

      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">
          Nuestro Menú
        </h1>

        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Descubre nuestros platos frescos preparados al momento con ingredientes naturales.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-slate-500">
          Cargando menú...
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

        {recipes.map((dish, index) => (
          <motion.div
            key={dish.id_recipe}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
          >

            {/* Imagen */}
            {dish.image_url && (
              <img
                src={dish.image_url}
                alt={dish.name}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-6 flex flex-col flex-1 justify-between">

              <div>
                <h3 className="text-xl font-semibold text-emerald-700 mb-2">
                  {dish.name}
                </h3>

                <p className="text-slate-600 text-sm mb-4">
                  {dish.description}
                </p>
              </div>

              <div className="flex items-center justify-end mt-4">

                <Link
                  to={`/ordenar/${dish.id_recipe}`}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 hover:scale-105 transition"
                >
                  Ordenar
                </Link>

              </div>
            </div>

          </motion.div>
        ))}

      </div>

      {/* CTA */}
      <div className="mt-20 text-center">

        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
          ¿Listo para disfrutar?
        </h2>

        <p className="mt-3 text-slate-600">
          Haz tu pedido ahora y recibe tu comida fresca en minutos.
        </p>

        <Link
          to="/ordenar"
          className="inline-block mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition"
        >
          Ordenar Ahora
        </Link>

      </div>
    </div>
  );
};

export default Menu;