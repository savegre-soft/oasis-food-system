import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import PlaceholderImage from '../components/public/PlaceholderImage';

const SERVICES = [
  {
    tone: 'sage',
    title: 'Barra de eventos',
    desc: 'Estaciones de comida servidas por nuestro equipo.',
  },
  { tone: 'rose', title: 'Snack bar', desc: 'Bowls de yogurt, frutas, toppings y bocadillos.' },
  { tone: 'butter', title: 'Bebidas y Well Shot', desc: 'Jugos naturales y shots funcionales.' },
  { tone: 'sand', title: 'Menús de temporada', desc: 'Menú navideño y fechas especiales.' },
];

const STEPS = [
  { n: '01', title: 'Contanos', desc: 'Fecha, lugar, número de invitados y tipo de evento.' },
  { n: '02', title: 'Cotizamos', desc: 'Te enviamos una propuesta de menú y precio.' },
  { n: '03', title: 'Confirmás', desc: 'Reservás la fecha con tu adelanto.' },
  { n: '04', title: 'Disfrutás', desc: 'Montamos, servimos y nos encargamos de todo.' },
];

const CateringQuoteForm = () => {
  const { supabase } = useApp();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    eventDate: '',
    eventType: '',
    guests: '',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = form.name.trim() !== '' && form.phone.trim() !== '';

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    if (honeypot) {
      setDone(true);
      return;
    }

    setLoading(true);
    setError('');

    const details = [
      form.eventDate && `Fecha del evento: ${form.eventDate}`,
      form.eventType && `Tipo de evento: ${form.eventType}`,
      form.guests && `Invitados: ${form.guests}`,
      form.message && `Mensaje: ${form.message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const { error: insertError } = await supabase
      .schema('operations')
      .from('leads')
      .insert([
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          message: details || null,
          source: 'catering',
        },
      ]);

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError('No se pudo enviar tu solicitud. Intentá de nuevo en un momento.');
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <h3 className="font-display text-xl font-semibold text-oasis-ink mb-2">¡Gracias!</h3>
        <p className="text-oasis-ink/60">
          Te respondemos por WhatsApp con una propuesta a la medida.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
      <div>
        <label className="block text-sm font-medium text-oasis-ink/70 mb-2">Nombre</label>
        <input
          type="text"
          placeholder="Tu nombre"
          value={form.name}
          onChange={update('name')}
          className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-oasis-ink/70 mb-2">Teléfono</label>
        <input
          type="tel"
          placeholder="8888-8888"
          value={form.phone}
          onChange={update('phone')}
          className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-oasis-ink/70 mb-2">Fecha del evento</label>
        <input
          type="date"
          value={form.eventDate}
          onChange={update('eventDate')}
          className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-oasis-ink/70 mb-2">Invitados</label>
        <input
          type="number"
          min="1"
          placeholder="Ej. 50"
          value={form.guests}
          onChange={update('guests')}
          className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-oasis-ink/70 mb-2">Tipo de evento</label>
        <input
          type="text"
          placeholder="Corporativo, cumpleaños, boda…"
          value={form.eventType}
          onChange={update('eventType')}
          className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-oasis-ink/70 mb-2">Mensaje</label>
        <textarea
          rows="4"
          placeholder="Contanos más detalles"
          value={form.message}
          onChange={update('message')}
          className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition resize-none"
        />
      </div>

      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website-catering">Sitio web</label>
        <input
          type="text"
          id="website-catering"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="sm:col-span-2 mt-2 bg-oasis-olive-600 text-white py-3.5 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
};

const Catering = () => {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <SectionBadge>Catering service</SectionBadge>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3 max-w-2xl">
          Comida saludable para tus eventos
        </h1>
        <p className="mt-4 text-oasis-ink/70 max-w-xl">
          Barras de comida, snack bar y bebidas para eventos corporativos, celebraciones y
          reuniones. Nosotros cocinamos, montamos y servimos.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#cotizar"
            className="bg-oasis-olive-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-oasis-olive-700 transition"
          >
            Cotizar mi evento
          </a>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <PlaceholderImage tone="sage" className="aspect-[4/3]" caption="Foto: barra de evento" />
          <PlaceholderImage tone="sand" className="aspect-[4/3]" caption="Foto: equipo sirviendo" />
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="bg-oasis-olive-50 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <SectionBadge>Servicios</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-10">
            Lo que podemos llevar a tu evento
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div key={service.title}>
                <PlaceholderImage
                  tone={service.tone}
                  className="aspect-square"
                  caption={`Foto: ${service.title}`}
                />
                <p className="font-semibold text-oasis-ink mt-4">{service.title}</p>
                <p className="text-sm text-oasis-ink/60 mt-1">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-oasis-olive-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">¿Cómo funciona?</h2>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="border-t border-white/20 pt-5">
                <span className="font-display text-2xl text-oasis-olive-300">{step.n}</span>
                <p className="font-semibold mt-2">{step.title}</p>
                <p className="text-oasis-olive-200 text-sm mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COTIZADOR */}
      <section
        id="cotizar"
        className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-[1fr_1.3fr] gap-12"
      >
        <div>
          <SectionBadge>Cotizá tu evento</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3">
            Contanos qué tenés en mente
          </h2>
          <p className="mt-4 text-oasis-ink/70">
            Te respondemos por WhatsApp con una propuesta a la medida.
          </p>
        </div>

        <div className="bg-oasis-olive-50 rounded-3xl p-8 md:p-10 relative">
          <CateringQuoteForm />
        </div>
      </section>
    </div>
  );
};

export default Catering;
