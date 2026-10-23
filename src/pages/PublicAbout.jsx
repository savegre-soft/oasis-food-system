import { Link } from 'react-router-dom';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';
import Seo from '../components/public/Seo';
import { DELIVERY_ZONES, WHATSAPP_LINK } from '../lib/siteContent';

const MOVE_ITEMS = [
  {
    n: '01',
    title: 'Tiempo',
    desc: 'Te ahorramos horas de cocina para que las invertás en lo que realmente importa.',
  },
  {
    n: '02',
    title: 'Estructura',
    desc: 'Una semana organizada se siente más ligera. Planificá tu comida y olvidate.',
  },
  {
    n: '03',
    title: 'Amor propio',
    desc: 'Comer bien es una forma de cuidarte. Quitarte esa preocupación también lo es.',
  },
];

const WHAT_WE_DO = [
  { title: 'Comida preparada', desc: 'Almuerzos y bowls con entregas bajo pedido.' },
  { title: 'Well Shot by Oasis', desc: 'Shots funcionales: Reset, Energy Boost y Skin Glow.' },
  { title: 'Catering service', desc: 'Barras de comida y snack bar para tus eventos.' },
];

const STATS = [
  { value: '2 años', label: 'cocinando para la Zona Norte' },
  { value: '4 zonas', label: DELIVERY_ZONES.join(', ') },
  { value: '3 servicios', label: 'Comida preparada, Well Shot y catering' },
];

const PublicAbout = () => {
  return (
    <div>
      <Seo
        title="Sobre nosotros"
        description="Oasis prepara comida saludable y balanceada en la Zona Norte de Costa Rica desde hace 2 años: comida preparada, Well Shot y catering con entrega por ruta."
        path="/nosotros"
        keywords={['comida saludable Zona Norte', 'historia Oasis', 'catering y comida preparada']}
      />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionBadge>Sobre nosotros</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Comida que te cuida, hecha con <span className="italic text-oasis-olive-600">amor</span>
          </h1>
          <p className="mt-5 text-oasis-ink/70 max-w-md">
            Oasis nació para que comer saludable deje de ser una preocupación. Preparamos comida
            deliciosa y balanceada y la llevamos a tu puerta en la Zona Norte de Costa Rica.
          </p>
        </div>

        <div className="relative">
          <PlaceholderImage tone="olive" className="aspect-[4/3]" caption="Foto: Oasis" />
          <div className="absolute -bottom-6 left-4 bg-oasis-olive-700 text-white rounded-2xl shadow-lg px-5 py-4 text-center">
            <p className="font-display text-3xl font-semibold">2</p>
            <p className="text-xs text-oasis-olive-200 uppercase tracking-wide">Años</p>
            <p className="text-xs italic text-oasis-olive-200 mt-1 max-w-[9rem]">
              Gracias por ser parte de esta historia
            </p>
          </div>
        </div>
      </section>

      {/* LO QUE NOS MUEVE */}
      <section className="bg-oasis-olive-50 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge>Lo que nos mueve</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-10">
            Más que comida, tranquilidad
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {MOVE_ITEMS.map((item) => (
              <div key={item.n} className="bg-white rounded-2xl p-7 shadow-sm">
                <span className="font-display text-3xl text-oasis-olive-300">{item.n}</span>
                <p className="font-semibold text-oasis-ink mt-3">{item.title}</p>
                <p className="text-sm text-oasis-ink/60 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LO QUE HACEMOS */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="grid grid-cols-2 gap-4">
          <PlaceholderImage
            tone="sand"
            className="aspect-[3/4] col-span-1 row-span-2"
            caption="Foto: cocina / equipo"
          />
          <PlaceholderImage tone="olive" className="aspect-square" caption="Foto: catering" />
          <PlaceholderImage tone="butter" className="aspect-square" caption="Foto: Well Shot" />
        </div>

        <div>
          <SectionBadge>Lo que hacemos</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-8">
            Tres formas de comer mejor
          </h2>

          <div className="divide-y divide-oasis-olive-100">
            {WHAT_WE_DO.map((item) => (
              <div key={item.title} className="py-5 border-l-2 border-oasis-terracotta pl-5">
                <p className="font-semibold text-oasis-ink">{item.title}</p>
                <p className="text-sm text-oasis-ink/60 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-oasis-olive-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid sm:grid-cols-3 gap-8">
          {STATS.map((stat) => (
            <div key={stat.value}>
              <p className="font-display text-3xl font-semibold">{stat.value}</p>
              <p className="text-oasis-olive-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-oasis-ink">
          ¿Te unís a la familia Oasis?
        </h2>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/menu"
            className="bg-oasis-olive-600 text-white px-8 py-3.5 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 transition"
          >
            Ver menú
          </Link>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="border-2 border-oasis-olive-600 text-oasis-olive-700 px-8 py-3.5 rounded-full font-semibold hover:bg-oasis-olive-50 transition"
          >
            Escribinos
          </a>
        </div>
      </section>
    </div>
  );
};

export default PublicAbout;
