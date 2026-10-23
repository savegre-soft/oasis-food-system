import { useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import LeadForm from '../components/LeadForm';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import Seo from '../components/public/Seo';
import { EASE } from '../lib/motion';
import { getWeekRange } from '../components/orderUtils';
import { WHATSAPP_LINK } from '../lib/siteContent';

const PAGE_SIZE = 8;

// Categorías del menú. Se derivan del nombre de la receta porque `recipes` aún
// no tiene un campo de categoría poblado (`meal_type` está en null). Cuando se
// poblen esas categorías en la DB, `categoryOf` puede pasar a leer el campo.
const FILTERS = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Almuerzos', label: 'Almuerzos' },
  { key: 'Desayunos', label: 'Desayunos' },
  { key: 'Por porción', label: 'Por porción' },
];

// Clasifica una receta por heurística sobre el nombre:
// - "Por porción": ítems a granel ("500g de pollo mechado", etc.)
// - "Desayunos":  combos de huevo/tortilla ("3 tortillas, 3 huevos…")
// - "Almuerzos":  el resto (platos completos)
const categoryOf = (dish) => {
  const name = (dish?.name || '').trim();
  if (/^\d+\s*g\b/i.test(name) || /\b\d{3}\s*g\b/i.test(name)) return 'Por porción';
  if (/tortilla/i.test(name) || (/huevos/i.test(name) && /pl[áa]tano/i.test(name))) {
    return 'Desayunos';
  }
  return 'Almuerzos';
};

const TONES = ['sage', 'sand', 'olive', 'rose', 'butter'];

const Menu = () => {
  const { supabase } = useApp();

  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [page, setPage] = useState(1);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  const weekLabel = getWeekRange().label;

  useEffect(() => {
    if (!openModal) return;

    // Recordar qué tenía el foco para devolvérselo al cerrar.
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenModal(false);
        return;
      }

      // Focus trap: mantener el tabulador dentro del diálogo.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [openModal]);

  // Se cargan TODAS las recetas activas una sola vez (son pocas) y el filtrado,
  // la búsqueda y la paginación se hacen en cliente. Así los chips de categoría
  // funcionan de verdad y la búsqueda es instantánea, sin ir al servidor en cada
  // tecla.
  useEffect(() => {
    let active = true;

    const loadRecipes = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .schema('operations')
        .from('recipes')
        .select('*')
        .eq('is_active', true)
        .order('id_recipe', { ascending: false });

      if (!active) return;

      if (error) {
        console.error(error);
        setLoadError(error.message || 'No se pudo cargar el menú.');
        setLoading(false);
        return;
      }

      setLoadError('');
      setAllRecipes(data ?? []);
      setLoading(false);
    };

    loadRecipes();
    return () => {
      active = false;
    };
  }, [supabase]);

  // Recetas tras aplicar categoría + búsqueda.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRecipes.filter((dish) => {
      const matchCategory = filter === 'Todos' || categoryOf(dish) === filter;
      const matchSearch =
        !q ||
        (dish.name || '').toLowerCase().includes(q) ||
        (dish.description || '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [allRecipes, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Cambiar de filtro o búsqueda vuelve a la primera página (se hace en los
  // handlers para no llamar a setState dentro de un efecto).
  const selectFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  const onSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const openOrder = (dish) => {
    setSelectedDish(dish);
    setOpenModal(true);
  };

  return (
    <div>
      <Seo
        title="Menú de la semana"
        description="Menú semanal de comida preparada saludable en Costa Rica: almuerzos balanceados con proteína, carbohidrato y vegetales. Pedí por WhatsApp antes del viernes a medianoche."
        path="/menu"
        keywords={['menú semanal saludable', 'almuerzos balanceados', 'pedidos por WhatsApp']}
      />

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
                onClick={() => selectFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                  filter === f.key
                    ? 'bg-oasis-olive-700 text-white border-oasis-olive-700'
                    : 'bg-white text-oasis-ink/70 border-oasis-olive-200 hover:border-oasis-olive-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-oasis-ink/70">Semana del {weekLabel}</p>
        </div>

        <div className="max-w-md mb-10">
          <input
            type="text"
            placeholder="Buscar platos..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-3 border border-oasis-olive-200 rounded-xl focus:ring-2 focus:ring-oasis-olive-500 outline-none bg-white"
          />
        </div>

        {loading && <div className="text-center text-oasis-ink/70 py-10">Cargando menú...</div>}

        {!loading && loadError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-medium">No se pudo cargar el menú.</p>
            <p className="text-oasis-ink/60 text-sm mt-1">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="text-center text-oasis-ink/70 py-10">
            {search || filter !== 'Todos'
              ? 'No encontramos platos con ese criterio.'
              : 'Todavía no hay platos activos en el menú. Activá recetas desde el panel de administración.'}
          </div>
        )}

        {/* Grid de platos — sin animación de entrada: contenido principal que se
            pagina, debe verse siempre. Solo se conserva el hover (CSS). */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pageItems.map((dish, index) => (
            <div
              key={dish.id_recipe}
              className="group bg-white rounded-2xl border border-oasis-olive-100 overflow-hidden flex flex-col hover:shadow-xl hover:border-oasis-olive-200 hover:-translate-y-1.5 transition"
            >
              <div className="overflow-hidden">
                {dish.image_url ? (
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <PlaceholderImage
                    tone={TONES[index % TONES.length]}
                    rounded="rounded-none"
                    className="aspect-square transition-transform duration-500 group-hover:scale-105"
                    caption={`Foto: ${dish.name}`}
                  />
                )}
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-oasis-olive-600">
                    Almuerzo
                  </span>
                  <h3 className="font-semibold text-oasis-ink mt-1">{dish.name}</h3>
                  <p className="text-oasis-ink/60 text-sm mt-1 line-clamp-2">{dish.description}</p>
                </div>

                <div className="flex items-center justify-end mt-5">
                  <button
                    onClick={() => openOrder(dish)}
                    className="bg-oasis-olive-100 text-oasis-olive-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-oasis-olive-600 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    Pedir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition ${
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
            className="bg-white text-oasis-olive-700 px-7 py-3.5 rounded-full font-semibold hover:bg-oasis-cream hover:-translate-y-0.5 active:translate-y-0 transition-all text-center whitespace-nowrap"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {openModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpenModal(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dish-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl max-w-lg w-full relative p-8 md:p-10"
            >
              <button
                ref={closeButtonRef}
                onClick={() => setOpenModal(false)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 text-oasis-ink/70 hover:text-oasis-ink text-xl transition-transform hover:rotate-90"
              >
                ✕
              </button>

              <div className="mb-6">
                <h2
                  id="dish-modal-title"
                  className="font-display text-2xl font-semibold text-oasis-ink"
                >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menu;
