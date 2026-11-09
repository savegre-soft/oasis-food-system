import { Link } from 'react-router-dom';
import SectionBadge from '../components/public/SectionBadge';
import Photo from '../components/public/Photo';
import Seo from '../components/public/Seo';
import { Reveal, Stagger, StaggerItem } from '../components/public/Motion';
import { scaleIn } from '../lib/motion';

const SERVICES = [
  {
    img: '/photos/catherin/1.png',
    title: 'Barra de eventos',
    desc: 'Estaciones de comida servidas por nuestro equipo.',
  },
  {
    img: '/photos/catherin/3.png',
    title: 'Snack bar',
    desc: 'Bowls de yogurt, frutas, toppings y bocadillos.',
  },
  {
    img: '/photos/wellshot/5.png',
    title: 'Bebidas y Well Shot',
    desc: 'Jugos naturales y shots funcionales.',
  },
  {
    img: '/photos/catherin/4-navidad.png',
    title: 'Menús de temporada',
    desc: 'Menú navideño y fechas especiales.',
  },
];

const STEPS = [
  { n: '01', title: 'Contanos', desc: 'Fecha, lugar, número de invitados y tipo de evento.' },
  { n: '02', title: 'Cotizamos', desc: 'Te enviamos una propuesta de menú y precio.' },
  { n: '03', title: 'Confirmás', desc: 'Reservás la fecha con tu adelanto.' },
  { n: '04', title: 'Disfrutás', desc: 'Montamos, servimos y nos encargamos de todo.' },
];

const Catering = () => {
  return (
    <div>
      <Seo
        title="Catering saludable para eventos"
        description="Catering de comida saludable en la Zona Norte de Costa Rica: barras de comida, snack bar y bebidas para eventos corporativos y celebraciones. Cotizá tu evento por WhatsApp."
        path="/catering"
        keywords={[
          'catering saludable',
          'catering eventos Costa Rica',
          'barra de comida saludable',
        ]}
      />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <Reveal>
          <SectionBadge>Catering service</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3 max-w-2xl">
            Comida saludable para tus eventos
          </h1>
          <p className="mt-4 text-oasis-ink/70 max-w-xl">
            Barras de comida, snack bar y bebidas para eventos corporativos, celebraciones y
            reuniones. Nosotros cocinamos, montamos y servimos.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/contacto?form=quote"
              className="bg-oasis-olive-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Cotizar mi evento
            </Link>
          </div>
        </Reveal>

        <Stagger className="mt-12 grid md:grid-cols-2 gap-6 items-center" stagger={0.1}>
          <StaggerItem variants={scaleIn}>
            <Photo
              src="/photos/oasis/catering.png"
              alt="Mesa de catering Oasis: panadería, cupcakes y pastel para eventos"
              className="aspect-683/854"
            />
          </StaggerItem>
          <StaggerItem variants={scaleIn}>
            <Photo
              src="/photos/catherin/2.png"
              alt="Bowls de ensalada con pollo y aderezo servidos en un evento Oasis"
              className="aspect-square"
            />
          </StaggerItem>
        </Stagger>
      </section>

      {/* SERVICIOS */}
      <section className="bg-oasis-olive-50 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge>Servicios</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-10">
            Lo que podemos llevar a tu evento
          </h2>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
            {SERVICES.map((service) => (
              <StaggerItem key={service.title} whileHover={{ y: -6 }} className="group">
                <div className="overflow-hidden rounded-3xl">
                  <Photo
                    src={service.img}
                    alt={service.title}
                    className="aspect-square transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="font-semibold text-oasis-ink mt-4">{service.title}</p>
                <p className="text-sm text-oasis-ink/60 mt-1">{service.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-oasis-olive-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">¿Cómo funciona?</h2>

          <Stagger className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8" stagger={0.12}>
            {STEPS.map((step) => (
              <StaggerItem key={step.n} className="border-t border-white/20 pt-5">
                <span className="font-display text-2xl text-oasis-olive-300">{step.n}</span>
                <p className="font-semibold mt-2">{step.title}</p>
                <p className="text-oasis-olive-200 text-sm mt-1">{step.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* COTIZADOR */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 text-center">
        <Reveal>
          <SectionBadge>Cotizá tu evento</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
            Contanos qué tenés en mente
          </h2>
          <p className="mt-4 text-oasis-ink/70 max-w-xl mx-auto">
            Te respondemos por WhatsApp con una propuesta a la medida.
          </p>
          <Link
            to="/contacto?form=quote"
            className="inline-block mt-8 bg-oasis-olive-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Cotizar mi evento
          </Link>
        </Reveal>
      </section>
    </div>
  );
};

export default Catering;
