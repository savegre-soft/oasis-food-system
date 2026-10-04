import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import { INSTAGRAM_WELLSHOT, WHATSAPP_LINK } from '../lib/siteContent';
import { Leaf, Sparkles, ShoppingBag } from 'lucide-react';

const FLAVORS = [
  {
    key: 'reset',
    tone: 'butter',
    tag: 'Bienestar',
    name: 'RESET',
    desc: 'Ideal después de comidas pesadas o días de cansancio',
    bullets: [
      'Apoya la digestión y reduce la inflamación',
      'Ayuda a fortalecer el sistema inmune',
      'Rico en enzimas naturales y vitamina C',
    ],
    ingredients: ['Piña', 'Jengibre', 'Limón', 'Pimienta negra', 'Cúrcuma'],
  },
  {
    key: 'energy',
    tone: 'rose',
    tag: 'Energía',
    name: 'ENERGY BOOST',
    desc: 'Ideal antes de entrenar o para aumentar el enfoque',
    bullets: [
      'Energía natural sin cafeína',
      'Ayuda a mejorar circulación y oxigenación',
      'Rico en antioxidantes y nutrientes',
    ],
    ingredients: ['Remolacha', 'Maracuyá', 'Jengibre', 'Limón', 'Miel'],
  },
  {
    key: 'skin',
    tone: 'sand',
    tag: 'Cuidado de la piel',
    name: 'SKIN GLOW',
    desc: 'Ideal para empezar el día con energía natural',
    bullets: [
      'Apoya la salud de la piel y el sistema inmune',
      'Ayuda a combatir la inflamación',
      'Rico en antioxidantes y vitamina C',
    ],
    ingredients: ['Naranja', 'Zanahoria', 'Cúrcuma', 'Jengibre'],
  },
];

const IMPACT = [
  { icon: Leaf, title: 'Ingredientes naturales', desc: 'Frutas, raíces y especias frescas.' },
  {
    icon: Sparkles,
    title: 'Funcional',
    desc: 'Cada sabor con un propósito: bienestar, energía o piel.',
  },
  { icon: ShoppingBag, title: 'Fácil de llevar', desc: 'Agregalo a tu pedido de la semana.' },
];

const WellShot = () => {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-oasis-terracotta text-white text-xs font-semibold px-3 py-1 rounded-full">
            NUEVO
          </span>
          <SectionBadge className="block mt-4">Un formato de Oasis</SectionBadge>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-oasis-ink mt-3 tracking-wide">
            WELL SHOT
          </h1>
          <p className="font-display italic text-xl text-oasis-olive-600 mt-1">by Oasis</p>

          <p className="mt-6 text-oasis-ink/70 max-w-md">
            Bienestar en cada sorbo. Shots funcionales diseñados para nutrir tu cuerpo, con
            ingredientes naturales y sin complicaciones.
          </p>

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

        <PlaceholderImage tone="butter" className="aspect-square" caption="Foto: Well Shot" />
      </section>

      {/* SABORES */}
      <section className="bg-oasis-olive-50 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <SectionBadge>Nuestros sabores</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
            Un shot para cada necesidad
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            {FLAVORS.map((flavor) => (
              <div key={flavor.key} className="bg-white rounded-3xl p-7 shadow-sm flex flex-col">
                <PlaceholderImage
                  tone={flavor.tone}
                  className="aspect-[4/5] mb-6"
                  caption={flavor.name}
                />

                <span className="inline-block self-start bg-oasis-olive-100 text-oasis-olive-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {flavor.tag}
                </span>
                <h3 className="font-display text-2xl font-semibold text-oasis-ink mt-3">
                  {flavor.name}
                </h3>
                <p className="text-oasis-ink/60 text-sm italic mt-2">{flavor.desc}</p>

                <ul className="mt-4 space-y-2 text-sm text-oasis-ink/70">
                  {flavor.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-oasis-terracotta mt-1">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 mt-5">
                  {flavor.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="text-xs bg-oasis-cream-dark text-oasis-ink/70 px-2.5 py-1 rounded-full"
                    >
                      {ing}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6 pt-5 border-t border-oasis-olive-100">
                  <span className="text-oasis-ink/50 text-sm">₡ —</span>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-oasis-olive-100 text-oasis-olive-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-oasis-olive-600 hover:text-white transition"
                  >
                    Pedir
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRESENTACIONES */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <PlaceholderImage tone="sand" className="aspect-[4/3]" />

        <div>
          <SectionBadge>Presentaciones</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
            Para <span className="italic text-oasis-terracotta">hoy</span> o toda la{' '}
            <span className="italic text-oasis-olive-600">semana</span>
          </h2>
          <p className="mt-4 text-oasis-ink/70">
            Todos los sabores vienen en shot individual y en presentación grande.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-oasis-olive-100">
              <p className="font-semibold text-oasis-ink">Shot individual</p>
              <p className="text-sm text-oasis-ink/60 mt-1">Para tomar en el momento.</p>
              <p className="text-oasis-ink/50 text-sm mt-3">₡ —</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-oasis-olive-100">
              <p className="font-semibold text-oasis-ink">Presentación grande</p>
              <p className="text-sm text-oasis-ink/60 mt-1">Para tener en casa toda la semana.</p>
              <p className="text-oasis-ink/50 text-sm mt-3">₡ —</p>
            </div>
          </div>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-8 bg-oasis-olive-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-oasis-olive-700 transition"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </section>

      {/* IMPACTO */}
      <section className="bg-oasis-olive-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid lg:grid-cols-[1fr_2fr] gap-10 items-center">
          <div>
            <p className="font-display italic text-xl text-oasis-olive-200">Pequeño formato,</p>
            <h2 className="font-display text-3xl font-semibold">gran impacto</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {IMPACT.map((item) => (
              <div key={item.title}>
                <item.icon className="text-oasis-olive-300 mb-2" size={22} />
                <p className="font-semibold">{item.title}</p>
                <p className="text-oasis-olive-200 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default WellShot;
