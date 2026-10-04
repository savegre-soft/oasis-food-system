import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Clock3, LayoutList, HeartHandshake, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import { DELIVERY_ZONES, INSTAGRAM_WELLSHOT, WHATSAPP_LINK } from '../lib/siteContent';

const HELP_ITEMS = [
  {
    icon: Clock3,
    title: 'Te ahorra tiempo.',
    desc: 'Para que invertás en lo que realmente importa.',
  },
  {
    icon: LayoutList,
    title: 'Te da estructura.',
    desc: 'Porque una semana organizada se siente más ligera.',
  },
  {
    icon: HeartHandshake,
    title: 'Te quita una preocupación.',
    desc: 'Y eso también es amor propio.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Hacé tu pedido',
    desc: 'Elegí tus platos del menú de la semana y escribinos por WhatsApp. Sin suscripciones.',
  },
  {
    n: '02',
    title: 'Macros bajo control',
    desc: 'Cada plato se prepara con la proteína, el carbohidrato y los vegetales que tu cuerpo necesita.',
  },
  {
    n: '03',
    title: 'Entrega por rutas',
    desc: 'Recibí tu pedido en la puerta de tu casa, según la ruta y el día que te corresponde.',
  },
];

const MORE_SERVICES = [
  {
    tone: 'olive',
    title: 'Catering para eventos',
    desc: 'Barras de comida y servicio completo para tus eventos.',
    caption: 'Foto: catering para eventos',
    to: '/catering',
  },
  {
    tone: 'rose',
    title: 'Snack bar',
    desc: 'Bowls de yogurt, frutas, rutas y toppings.',
    caption: 'Foto: snack bar',
    to: '/menu',
  },
  {
    tone: 'sand',
    title: 'Bowls',
    desc: 'Bowls frescos y balanceados para el almuerzo.',
    caption: 'Foto: bowls',
    to: '/menu',
  },
];

const TESTIMONIALS = [
  'Pegar aquí una reseña real de cliente — tomar de los highlights "Clientes" de Instagram.',
  'Pegar aquí una reseña real de cliente — tomar de los highlights "Clientes" de Instagram.',
  'Pegar aquí una reseña real de cliente — tomar de los highlights "Clientes" de Instagram.',
];

const MENU_TONES = ['sage', 'sand', 'olive', 'rose'];

const Homes = () => {
  const { supabase } = useApp();
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('recipes')
        .select('*')
        .eq('is_active', true)
        .order('id_recipe', { ascending: false })
        .limit(4);

      if (!active) return;
      if (error) {
        console.error(error);
        return;
      }
      setRecipes(data ?? []);
    };

    loadPreview();
    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <div>
      {/* HERO */}
      <section className="bg-oasis-cream">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-4 text-center">
          <SectionBadge>
            Entregas bajo pedido · {DELIVERY_ZONES.slice(0, 2).join(' · ')}
          </SectionBadge>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-6xl font-semibold text-oasis-ink leading-[1.05]">
              Comida saludable, lista cada semana.
            </h1>

            <p className="mt-6 text-lg text-oasis-ink/70 max-w-xl">
              Hacé tu pedido y recibí tu comida saludable en la puerta de tu casa por ruta de
              entrega. Sin cocinar, sin complicarte — solo abrir y disfrutar.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/menu"
                className="bg-oasis-olive-600 text-white px-8 py-3.5 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 transition text-center"
              >
                Ver menú
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-oasis-olive-600 text-oasis-olive-700 px-8 py-3.5 rounded-full font-semibold hover:bg-oasis-olive-50 transition text-center"
              >
                Pedir por WhatsApp
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-oasis-ink/70">
              <span>🧮 Macros bajo control</span>
              <span>🚚 Entrega por rutas</span>
              <span>🍳 Sin cocinar</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <PlaceholderImage tone="sand" className="aspect-square" caption="Foto: plato Oasis" />
            <div className="absolute -top-4 -right-2 md:right-4 bg-white rounded-2xl shadow-lg px-4 py-3 text-sm">
              <p className="text-oasis-ink/50 text-xs">Pedidos hasta el</p>
              <p className="font-semibold text-oasis-ink">viernes, 12 a.m.</p>
            </div>
            <div className="absolute -bottom-4 left-2 md:-left-4 bg-oasis-olive-700 text-white rounded-2xl shadow-lg px-4 py-3 text-sm">
              <p className="text-oasis-olive-200 text-xs tracking-wide uppercase">Entregas</p>
              <p className="font-semibold">Bajo pedido</p>
            </div>
          </motion.div>
        </div>

        {/* Zonas de entrega */}
        <div className="bg-oasis-olive-700 text-white py-3 overflow-hidden">
          <p className="text-center text-sm font-medium tracking-wide">
            Entregamos en {DELIVERY_ZONES.join(' ✦ ')}
          </p>
        </div>
      </section>

      {/* 3 COSAS EN LAS QUE TE AYUDA */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <PlaceholderImage tone="olive" className="aspect-4/3" caption="Foto: plato Oasis" />

        <div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mb-8">
            3 cosas en las que te ayuda Oasis
          </h2>

          <div className="space-y-6">
            {HELP_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-4"
              >
                <span className="flex-none w-9 h-9 rounded-full bg-oasis-olive-600 text-white flex items-center justify-center font-semibold text-sm">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-oasis-ink">{item.title}</p>
                  <p className="text-oasis-ink/60 text-sm mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-oasis-olive-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <SectionBadge className="text-oasis-olive-300!">Cómo funciona</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-3">
            Tu semana, resuelta en 3 pasos
          </h2>
          <p className="mt-4 text-oasis-olive-200 max-w-xl mx-auto">
            Sin cocinar, sin complicarte. Vos elegís, nosotros cocinamos y te lo llevamos.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-oasis-olive-700/60 rounded-2xl p-7">
                <span className="font-display text-3xl text-oasis-olive-300">{step.n}</span>
                <p className="font-semibold text-lg mt-3">{step.title}</p>
                <p className="text-oasis-olive-200 text-sm mt-2">{step.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-oasis-olive-300">
            Cerramos pedidos los viernes a medianoche
          </p>
        </div>
      </section>

      {/* MENÚ DE LA SEMANA */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <SectionBadge>Menú de la semana</SectionBadge>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
              Cada menú está pensado para{' '}
              <span className="italic text-oasis-olive-600">cuidarte</span>
            </h2>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-oasis-olive-700 font-semibold hover:gap-3 transition-all"
          >
            Ver menú completo <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(recipes.length ? recipes : [1, 2, 3, 4]).map((dish, i) => (
            <div key={dish?.id_recipe ?? i} className="flex flex-col">
              {dish?.image_url ? (
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="w-full aspect-square object-cover rounded-2xl"
                />
              ) : (
                <PlaceholderImage
                  tone={MENU_TONES[i % MENU_TONES.length]}
                  className="aspect-square"
                  caption={dish?.name ? `Foto: ${dish.name}` : undefined}
                />
              )}
              <p className="text-xs text-oasis-olive-600 font-semibold uppercase tracking-wide mt-3">
                Almuerzo
              </p>
              <p className="font-semibold text-oasis-ink mt-1">{dish?.name ?? 'Plato del menú'}</p>
              {dish?.description && (
                <p className="text-sm text-oasis-ink/60 mt-1 line-clamp-2">{dish.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* WELL SHOT TEASER */}
      <section className="bg-oasis-terracotta/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <PlaceholderImage
            tone="butter"
            className="aspect-4/3 lg:order-2"
            caption="Well Shot by Oasis"
          />

          <div>
            <span className="inline-block bg-oasis-terracotta text-white text-xs font-semibold px-3 py-1 rounded-full">
              NUEVO
            </span>
            <SectionBadge className="block mt-4">Well Shot by Oasis</SectionBadge>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
              Un shot de bienestar, energía y cuidado de la piel
            </h2>
            <p className="mt-4 text-oasis-ink/70">
              Un nuevo formato de Oasis: shots funcionales diseñados para nutrir tu cuerpo.
              Bienestar en cada sorbo.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <p>
                <span className="font-semibold text-oasis-terracotta-dark">RESET</span>
                <span className="text-oasis-ink/60">
                  {' '}
                  · Piña, jengibre, limón, pimienta negra, cúrcuma
                </span>
              </p>
              <p>
                <span className="font-semibold text-oasis-rose-dark">ENERGY BOOST</span>
                <span className="text-oasis-ink/60">
                  {' '}
                  · Remolacha, maracuyá, jengibre, limón, miel
                </span>
              </p>
              <p>
                <span className="font-semibold text-oasis-butter-dark">SKIN GLOW</span>
                <span className="text-oasis-ink/60"> · Naranja, zanahoria, cúrcuma, jengibre</span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="bg-oasis-olive-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-700 transition"
              >
                Pedir por WhatsApp
              </a>
              <a
                href={INSTAGRAM_WELLSHOT.url}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-oasis-olive-600 text-oasis-olive-700 px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-50 transition"
              >
                Seguir {INSTAGRAM_WELLSHOT.handle}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MÁS QUE ALMUERZOS */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <SectionBadge>Más que almuerzos</SectionBadge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-10">
          Snack bar, jugos y catering
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {MORE_SERVICES.map((service) => (
            <Link
              key={service.title}
              to={service.to}
              className="group rounded-3xl overflow-hidden border border-oasis-olive-100 hover:shadow-lg transition"
            >
              <PlaceholderImage
                tone={service.tone}
                rounded="rounded-none"
                className="aspect-4/3"
                caption={service.caption}
              />
              <div className="p-6">
                <p className="font-semibold text-oasis-ink group-hover:text-oasis-olive-700 transition">
                  {service.title}
                </p>
                <p className="text-sm text-oasis-ink/60 mt-1">{service.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="bg-oasis-olive-50 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <p className="text-oasis-ink/60 italic">Lo que dicen nuestros</p>
          <h2 className="font-display text-3xl md:text-4xl italic text-oasis-olive-700">
            clientes
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            {TESTIMONIALS.map((quote, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-oasis-ink/70 text-sm italic">"{quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-oasis-olive-200" />
                  <div>
                    <p className="text-sm font-semibold text-oasis-ink">Nombre del cliente</p>
                    <p className="text-xs text-oasis-ink/50">Ciudad Quesada</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-oasis-olive-700 text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">
            No se trata de hacerlo perfecto, se trata de empezar.
          </h2>
          <p className="mt-4 text-oasis-olive-200">
            ¿Listo para comer mejor esta semana? Escribinos y armamos juntos tu pedido.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/ordenar"
              className="bg-white text-oasis-olive-700 px-8 py-3.5 rounded-full font-semibold shadow-md hover:bg-oasis-cream transition"
            >
              Quiero ser cliente
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-white/60 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 transition"
            >
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homes;
