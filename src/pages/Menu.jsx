import { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import LeadForm from '../components/LeadForm';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import { getWeekRange } from '../components/orderUtils';
import { WHATSAPP_LINK } from '../lib/siteContent';

const PAGE_SIZE = 8;

const FILTERS = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Almuerzos', label: 'Almuerzos' },
  { key: 'Bowls', label: 'Bowls' },
  { key: 'Snack bar', label: 'Snack bar' },
  { key: 'Well Shot', label: 'Well Shot' },
];

const TONES = ['sage', 'sand', 'olive', 'rose', 'butter'];

const Menu = () => {
  const { supabase } = useApp();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  // `recipes` no tiene categoría propia todavía (Almuerzos/Bowls/Snack bar/Well
  // Shot viven en tablas distintas) — los chips quedan visuales hasta que el
  // modelo de datos público soporte esa taxonomía.
  const [filter, setFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  const weekLabel = getWeekRange().label;

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
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openOrder = (dish) => {
    setSelectedDish(dish);
    setOpenModal(true);
  };

  return (
    <div>
      {/* Header */}
      <section className="bg-oasis-olive-50 py-16 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative">
          <SectionBadge>Menú de la semana</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Cada menú está pensado para cuidarte
          </h1>
          <p className="mt-4 text-oasis-ink/70">
            Elegí tus platos y hacé tu pedido por WhatsApp. Cerramos pedidos los viernes a
            medianoche.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  filter === f.key
                    ? 'bg-oasis-olive-700 text-white border-oasis-olive-700'
                    : 'bg-white text-oasis-ink/70 border-oasis-olive-200 hover:border-oasis-olive-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-oasis-ink/50">Semana del {weekLabel}</p>
        </div>

        <div className="max-w-md mb-10">
          <input
            type="text"
            placeholder="Buscar platos..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full px-4 py-3 border border-oasis-olive-200 rounded-xl focus:ring-2 focus:ring-oasis-olive-500 outline-none bg-white"
          />
        </div>

        {loading && <div className="text-center text-oasis-ink/50 py-10">Cargando menú...</div>}

        {!loading && recipes.length === 0 && (
          <div className="text-center text-oasis-ink/50 py-10">
            No encontramos platos con ese criterio.
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recipes.map((dish, index) => (
            <motion.div
              key={dish.id_recipe}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="bg-white rounded-2xl border border-oasis-olive-100 overflow-hidden flex flex-col hover:shadow-lg transition"
            >
              {dish.image_url ? (
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <PlaceholderImage
                  tone={TONES[index % TONES.length]}
                  rounded="rounded-none"
                  className="aspect-square"
                  caption={`Foto: ${dish.name}`}
                />
              )}

              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-oasis-olive-600">
                    Almuerzo
                  </span>
                  <h3 className="font-semibold text-oasis-ink mt-1">{dish.name}</h3>
                  <p className="text-oasis-ink/60 text-sm mt-1 line-clamp-2">{dish.description}</p>
                </div>

                <div className="flex items-center justify-between mt-5">
                  <span className="text-oasis-ink/50 text-sm">₡ —</span>
                  <button
                    onClick={() => openOrder(dish)}
                    className="bg-oasis-olive-100 text-oasis-olive-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-oasis-olive-600 hover:text-white transition"
                  >
                    Pedir
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                  page === p
                    ? 'bg-oasis-olive-700 text-white'
                    : 'bg-white border border-oasis-olive-200 text-oasis-ink/60 hover:border-oasis-olive-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pasos */}
      <section className="bg-oasis-olive-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid md:grid-cols-[1fr_1fr_1fr_auto] gap-8 items-center">
          {[
            { n: '01', title: 'Elegí', desc: 'Revisá el menú de la semana y elegí tus platos.' },
            {
              n: '02',
              title: 'Escribinos',
              desc: 'Enviá tu pedido por WhatsApp antes del viernes a medianoche.',
            },
            { n: '03', title: 'Recibí', desc: 'Te lo llevamos según la ruta y el día de tu zona.' },
          ].map((step) => (
            <div key={step.n}>
              <span className="font-display text-2xl text-oasis-olive-300">{step.n}</span>
              <p className="font-semibold mt-2">{step.title}</p>
              <p className="text-oasis-olive-200 text-sm mt-1">{step.desc}</p>
            </div>
          ))}

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-oasis-olive-700 px-7 py-3.5 rounded-full font-semibold hover:bg-oasis-cream transition text-center whitespace-nowrap"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </section>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full relative p-8 md:p-10">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-4 right-4 text-oasis-ink/50 hover:text-oasis-ink text-xl"
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-oasis-ink">
                {selectedDish ? `Interesado en: ${selectedDish.name}` : 'Quiero ser cliente'}
              </h2>
              <p className="mt-2 text-oasis-ink/60">
                Dejanos tu información y te contactamos para armar tu pedido.
              </p>
            </div>

            <LeadForm
              initialComment={selectedDish ? `Interesado en: ${selectedDish.name}` : ''}
              onSuccess={() => setOpenModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
