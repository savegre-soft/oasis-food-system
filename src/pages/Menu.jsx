import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import Contact from './contact';

const PAGE_SIZE = 6;

const Menu = () => {
  const { supabase } = useApp();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  const loadRecipes = async () => {
    setLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .schema('operations')
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('id_recipe', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setRecipes(data);
    setTotal(count);
    setLoading(false);
  };

  useEffect(() => {
    loadRecipes();
  }, [page, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openOrder = (dish) => {
    setSelectedDish(dish);
    setOpenModal(true);
  };

  return (
    <div className="py-16">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">
          Nuestro Menú
        </h1>

        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Descubre nuestros platos frescos preparados al momento con ingredientes naturales.
        </p>
      </div>

      {/* Filtros */}
      <div className="max-w-xl mx-auto mb-10">
        <input
          type="text"
          placeholder="Buscar platos..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
          >

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

              <div className="flex justify-end">
                <button
                  onClick={() => openOrder(dish)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 hover:scale-105 transition"
                >
                  Ordenar
                </button>
              </div>

            </div>

          </motion.div>
        ))}

      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full relative">

            {/* Close */}
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-xl"
            >
              ✕
            </button>

            <Contact
              title={`Ordenar: ${selectedDish?.name || ''}`}
              description="Déjanos tu información y te contactaremos para confirmar tu pedido."
            />

          </div>

        </div>
      )}

      {/* CTA */}
      <div className="mt-20 text-center">

        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
          ¿Listo para disfrutar?
        </h2>

        <p className="mt-3 text-slate-600">
          Haz tu pedido ahora y recibe tu comida fresca en minutos.
        </p>

        <button
          onClick={() => setOpenModal(true)}
          className="inline-block mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition"
        >
          Ordenar Ahora
        </button>

      </div>

    </div>
  );
};

export default Menu;