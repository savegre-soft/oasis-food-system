import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Clock3, LayoutList, HeartHandshake, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import Photo from '../components/public/Photo';
import Seo from '../components/public/Seo';
import { Reveal, Stagger, StaggerItem } from '../components/public/Motion';
import { EASE, scaleIn } from '../lib/motion';
import {
  BUSINESS_JSON_LD,
  DELIVERY_ZONES,
  INSTAGRAM_WELLSHOT,
  WHATSAPP_LINK,
} from '../lib/siteContent';

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

// Reseñas reales de clientes. Mientras esté vacío, la sección NO se renderiza
// (preferimos ocultarla a mostrar testimonios de relleno). Para activarla,
// agregá objetos: { quote: 'Reseña…', name: 'Nombre', city: 'Ciudad Quesada' }.
const TESTIMONIALS = [];

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
      <Seo
        title="Comida saludable preparada cada semana"
        description="Comida preparada saludable y balanceada en la Zona Norte de Costa Rica. Pedí tu almuerzo con macros bajo control y recibilo en la puerta de tu casa por ruta de entrega."
        path="/"
        keywords={['almuerzos saludables', 'entrega de comida por ruta', 'macros bajo control']}
        jsonLd={BUSINESS_JSON_LD}
      />

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
            transition={{ duration: 0.6, ease: EASE }}
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
                className="bg-oasis-olive-600 text-white px-8 py-3.5 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all text-center"
              >
                Ver menú
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-oasis-olive-600 text-oasis-olive-700 px-8 py-3.5 rounded-full font-semibold hover:bg-oasis-olive-50 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
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
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="relative"
          >
            <Photo
              src="/photos/oasis/almuerzos.png"
              alt="Cuatro almuerzos Oasis en bowls: vegetales, proteína y arroz"
              className="aspect-679/852"
              loading="eager"
              fetchPriority="high"
            />
            {/* Tarjetas flotantes: oscilación lenta y sutil para dar vida al hero. */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-0 md:right-4 max-w-38 sm:max-w-none bg-white rounded-2xl shadow-lg px-4 py-3 text-sm"
            >
              <p className="text-oasis-ink/70 text-xs">Pedidos hasta el</p>
              <p className="font-semibold text-oasis-ink">viernes, 12 a.m.</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              className="absolute -bottom-4 left-0 md:-left-4 max-w-38 sm:max-w-none bg-oasis-olive-700 text-white rounded-2xl shadow-lg px-4 py-3 text-sm"
            >
              <p className="text-oasis-olive-200 text-xs tracking-wide uppercase">Entregas</p>
              <p className="font-semibold">Bajo pedido</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Zonas de entrega — marquee continuo (el contenido se duplica para un bucle perfecto) */}
        <div className="bg-oasis-olive-700 text-white py-3 overflow-hidden">
          <div className="flex w-max animate-marquee" aria-hidden="true">
            {[0, 1].map((dup) => (
              <p key={dup} className="text-sm font-medium tracking-wide whitespace-nowrap px-6">
                Entregamos en {DELIVERY_ZONES.join(' ✦ ')} ✦{' '}
              </p>
            ))}
          </div>
          <p className="sr-only">Entregamos en {DELIVERY_ZONES.join(', ')}</p>
        </div>
      </section>

      {/* 3 COSAS EN LAS QUE TE AYUDA */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal variants={scaleIn}>
          <Photo
            src="/photos/oasis/menu.png"
            alt="Variedad de platos Oasis: pastas, arroces, pollo y ensaladas"
            className="aspect-637/856"
          />
        </Reveal>

        <div>
          <Reveal as="h2" className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mb-8">
            3 cosas en las que te ayuda Oasis
          </Reveal>

          <Stagger className="space-y-6">
            {HELP_ITEMS.map((item, i) => (
              <StaggerItem key={item.title} className="flex gap-4">
                <span className="flex-none w-9 h-9 rounded-full bg-oasis-olive-600 text-white flex items-center justify-center font-semibold text-sm">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-oasis-ink">{item.title}</p>
                  <p className="text-oasis-ink/60 text-sm mt-1">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
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

          <Stagger className="mt-12 grid md:grid-cols-3 gap-6 text-left" stagger={0.12}>
            {STEPS.map((step) => (
              <StaggerItem
                key={step.n}
                whileHover={{ y: -6 }}
                className="bg-oasis-olive-700/60 rounded-2xl p-7 transition-colors hover:bg-oasis-olive-700"
              >
                <span className="font-display text-3xl text-oasis-olive-300">{step.n}</span>
                <p className="font-semibold text-lg mt-3">{step.title}</p>
                <p className="text-oasis-olive-200 text-sm mt-2">{step.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>

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

        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(recipes.length ? recipes : [1, 2, 3, 4]).map((dish, i) => (
            <StaggerItem
              key={dish?.id_recipe ?? i}
              whileHover={{ y: -6 }}
              className="flex flex-col group"
            >
              <div className="overflow-hidden rounded-2xl">
                {dish?.image_url ? (
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <PlaceholderImage
                    tone={MENU_TONES[i % MENU_TONES.length]}
                    className="aspect-square transition-transform duration-500 group-hover:scale-105"
                    caption={dish?.name ? `Foto: ${dish.name}` : undefined}
                  />
                )}
              </div>
              <p className="text-xs text-oasis-olive-600 font-semibold uppercase tracking-wide mt-3">
                Almuerzo
              </p>
              <p className="font-semibold text-oasis-ink mt-1">{dish?.name ?? 'Plato del menú'}</p>
              {dish?.description && (
                <p className="text-sm text-oasis-ink/60 mt-1 line-clamp-2">{dish.description}</p>
              )}
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* WELL SHOT TEASER */}
      <section className="bg-oasis-terracotta/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal variants={scaleIn} className="lg:order-2">
            <Photo
              src="/photos/wellshot/5.png"
              alt="Los tres Well Shot by Oasis: Reset, Energy Boost y Skin Glow con sus ingredientes"
              className="aspect-638/821"
            />
          </Reveal>

          <Reveal>
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
                className="bg-oasis-olive-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Pedir por WhatsApp
              </a>
              <a
                href={INSTAGRAM_WELLSHOT.url}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-oasis-olive-600 text-oasis-olive-700 px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-50 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Seguir {INSTAGRAM_WELLSHOT.handle}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MÁS QUE ALMUERZOS */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <SectionBadge>Más que almuerzos</SectionBadge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-10">
          Snack bar, jugos y catering
        </h2>

        <Stagger className="grid md:grid-cols-3 gap-6" stagger={0.12}>
          {MORE_SERVICES.map((service) => (
            <StaggerItem key={service.title} whileHover={{ y: -8 }} className="h-full">
              <Link
                to={service.to}
                className="group block h-full rounded-3xl overflow-hidden border border-oasis-olive-100 hover:shadow-xl hover:border-oasis-olive-200 transition"
              >
                <div className="overflow-hidden">
                  <PlaceholderImage
                    tone={service.tone}
                    rounded="rounded-none"
                    className="aspect-4/3 transition-transform duration-500 group-hover:scale-105"
                    caption={service.caption}
                  />
                </div>
                <div className="p-6">
                  <p className="font-semibold text-oasis-ink group-hover:text-oasis-olive-700 transition-colors">
                    {service.title}
                  </p>
                  <p className="text-sm text-oasis-ink/60 mt-1">{service.desc}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* TESTIMONIOS — solo se muestra cuando hay reseñas reales cargadas */}
      {TESTIMONIALS.length > 0 && (
        <section className="bg-oasis-olive-50 py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
            <p className="text-oasis-ink/60 italic">Lo que dicen nuestros</p>
            <h2 className="font-display text-3xl md:text-4xl italic text-oasis-olive-700">
              clientes
            </h2>

            <Stagger className="mt-12 grid md:grid-cols-3 gap-6 text-left">
              {TESTIMONIALS.map((t, i) => (
                <StaggerItem
                  key={i}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-oasis-ink/70 text-sm italic">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-oasis-olive-200" />
                    <div>
                      <p className="text-sm font-semibold text-oasis-ink">{t.name}</p>
                      {t.city && <p className="text-xs text-oasis-ink/70">{t.city}</p>}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="bg-oasis-olive-700 text-white py-20 text-center">
        <Reveal className="max-w-2xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">
            No se trata de hacerlo perfecto, se trata de empezar.
          </h2>
          <p className="mt-4 text-oasis-olive-200">
            ¿Listo para comer mejor esta semana? Escribinos y armamos juntos tu pedido.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/ordenar"
              className="bg-white text-oasis-olive-700 px-8 py-3.5 rounded-full font-semibold shadow-md hover:bg-oasis-cream hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Quiero ser cliente
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-white/60 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Escribinos por WhatsApp
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default Homes;
