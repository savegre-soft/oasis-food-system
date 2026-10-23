import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import LeadForm from '../components/LeadForm';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import Seo from '../components/public/Seo';
import { EASE } from '../lib/motion';
import {
  getWeekRange,
  getWeekOfMonth,
  toDateString,
  DAYS_ORDER,
  DAY_LABELS,
  mealLabel,
} from '../components/orderUtils';
import { WHATSAPP_LINK } from '../lib/siteContent';

// Tiempos de comida que se muestran en el menú público (el desayuno no entra acá).
const MEALS = ['Lunch', 'Dinner'];
const TONES = ['sage', 'sand', 'olive', 'rose', 'butter'];

// Convierte una plantilla (con días anidados) en tarjetas de plato, una por
// receta, en orden de día. Cada tarjeta lleva el día como etiqueta.
const cardsOf = (template) => {
  if (!template) return [];
  const byDay = {};
  (template.order_template_days ?? []).forEach((d) => {
    const dishes = (d.order_template_details ?? [])
      .map((det) => det.recipes)
      .filter(Boolean)
      .map((r) => ({
        id: r.id_recipe,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
      }));
    if (dishes.length) byDay[d.day_of_week] = dishes;
  });
  return DAYS_ORDER.filter((d) => byDay[d]?.length).flatMap((d) =>
    byDay[d].map((dish, i) => ({
      key: `${d}-${dish.id ?? i}`,
      dayLabel: DAY_LABELS[d],
      dish,
    }))
  );
};

const formatWeekLabel = (start, end) => {
  const fmt = (d) => d.toLocaleDateString('es-CR', { day: 'numeric', month: 'long' });
  return `${fmt(start)} al ${fmt(end)}`;
};

const Menu = () => {
  const { supabase } = useApp();

  // menu = { Lunch: plantilla|null, Dinner: plantilla|null }
  const [menu, setMenu] = useState({ Lunch: null, Dinner: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [meal, setMeal] = useState('Lunch');

  const [openModal, setOpenModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  const { weekStart, weekEnd } = getWeekRange();
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

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

  // Resuelve el menú de la semana activa. Para cada tiempo de comida la plantilla
  // efectiva es el override puntual de la semana (portal_template_overrides) o,
  // si no hay, la plantilla automática por week_of_month. Misma lógica que usa
  // el portal de clientes / el asistente interno.
  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      const weekOfMonth = getWeekOfMonth(weekStart);
      const weekStartStr = toDateString(weekStart);

      const [tplRes, ovrRes] = await Promise.all([
        supabase
          .schema('operations')
          .from('order_templates')
          .select(
            'id_template, meal_type, week_of_month, order_template_days(day_of_week, order_template_details(quantity, recipes(id_recipe, name, description, image_url)))'
          )
          .in('meal_type', MEALS)
          .eq('is_active', true),
        supabase
          .schema('operations')
          .from('portal_template_overrides')
          .select('meal_type, template_id')
          .eq('week_start_date', weekStartStr),
      ]);

      if (!active) return;

      if (tplRes.error) {
        console.error(tplRes.error);
        setLoadError(tplRes.error.message || 'No se pudo cargar el menú.');
        setLoading(false);
        return;
      }

      const templates = tplRes.data ?? [];
      const overrides = {};
      (ovrRes.data ?? []).forEach((o) => {
        overrides[o.meal_type] = o.template_id;
      });

      const resolve = (mealType) => {
        const effectiveId =
          overrides[mealType] ??
          templates.find((t) => t.meal_type === mealType && t.week_of_month === weekOfMonth)
            ?.id_template;
        return templates.find((t) => t.id_template === effectiveId) ?? null;
      };

      setLoadError('');
      setMenu({ Lunch: resolve('Lunch'), Dinner: resolve('Dinner') });
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
    // weekStart es estable durante la sesión (misma semana); solo depende de supabase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const availableMeals = MEALS.filter((m) => menu[m]);
  // Tiempo de comida efectivo a mostrar (cae al disponible si el activo no tiene menú).
  const activeMeal = menu[meal] ? meal : availableMeals[0];
  const cards = cardsOf(menu[activeMeal]);

  const openOrder = (dish) => {
    setSelectedDish(dish);
    setOpenModal(true);
  };

  return (
    <div>
      <Seo
        title="Menú de la semana"
        description="Menú semanal de comida preparada saludable en Costa Rica: almuerzos y cenas balanceados con proteína, carbohidrato y vegetales. Pedí por WhatsApp antes del viernes a medianoche."
        path="/menu"
        keywords={['menú semanal saludable', 'almuerzos y cenas balanceados', 'pedidos por WhatsApp']}
      />

      {/* Header */}
      <section className="bg-oasis-olive-50 py-16 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative">
          <SectionBadge>Menú de la semana</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Cada menú está pensado para cuidarte
          </h1>
          <p className="mt-4 text-oasis-ink/70">Semana del {weekLabel}</p>
          <p className="mt-2 text-sm text-oasis-ink/60">
            Elegí tus platos y hacé tu pedido por WhatsApp. Cerramos pedidos los viernes a
            medianoche.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        {loading && <div className="text-center text-oasis-ink/70 py-10">Cargando menú...</div>}

        {!loading && loadError && (
          <div className="text-center py-10">
            <p className="text-red-600 font-medium">No se pudo cargar el menú.</p>
            <p className="text-oasis-ink/60 text-sm mt-1">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && availableMeals.length === 0 && (
          <div className="text-center text-oasis-ink/70 py-10">
            Todavía no hay un menú publicado para esta semana. Escribinos por WhatsApp y con gusto
            te contamos qué hay disponible.
          </div>
        )}

        {!loading && !loadError && availableMeals.length > 0 && (
          <>
            {/* Pestañas Almuerzos / Cenas */}
            <div className="flex justify-center gap-2 mb-10">
              {availableMeals.map((m) => (
                <button
                  key={m}
                  onClick={() => setMeal(m)}
                  aria-pressed={activeMeal === m}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                    activeMeal === m
                      ? 'bg-oasis-olive-700 text-white border-oasis-olive-700'
                      : 'bg-white text-oasis-ink/70 border-oasis-olive-200 hover:border-oasis-olive-400'
                  }`}
                >
                  {mealLabel(m)}
                </button>
              ))}
            </div>

            {/* Menú del tiempo de comida activo — vista de tarjetas (una por plato,
                con su día como etiqueta). Muestra la foto de la receta si existe. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMeal}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {cards.map(({ key, dayLabel, dish }, index) => (
                  <div
                    key={key}
                    className="group bg-white rounded-2xl border border-oasis-olive-100 overflow-hidden flex flex-col hover:shadow-xl hover:border-oasis-olive-200 hover:-translate-y-1.5 transition"
                  >
                    <div className="relative overflow-hidden">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          loading="lazy"
                          className="w-full aspect-4/3 object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <PlaceholderImage
                          tone={TONES[index % TONES.length]}
                          rounded="rounded-none"
                          className="aspect-4/3 transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <span className="absolute top-3 left-3 bg-oasis-olive-700 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                        {dayLabel}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-semibold text-oasis-ink">{dish.name}</h3>
                        {dish.description && (
                          <p className="text-sm text-oasis-ink/60 mt-1 line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end mt-4">
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
              </motion.div>
            </AnimatePresence>
          </>
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
