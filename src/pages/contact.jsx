import { useState } from 'react';
import { ChevronDown, Instagram, MessageCircle, Truck, Clock3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionBadge from '../components/public/SectionBadge';
import Seo from '../components/public/Seo';
import {
  DELIVERY_ZONES,
  INSTAGRAM_OASIS,
  INSTAGRAM_WELLSHOT,
  ORDER_CUTOFF,
  WHATSAPP_LINK,
} from '../lib/siteContent';

const FAQS = [
  {
    q: '¿Hasta cuándo puedo hacer mi pedido?',
    a: 'Cerramos pedidos los viernes a medianoche para la semana siguiente.',
  },
  {
    q: '¿A qué zonas entregan?',
    a: `Entregamos en ${DELIVERY_ZONES.join(', ')}.`,
  },
  {
    q: '¿Tengo que suscribirme?',
    a: 'No. Podés pedir por semana, sin suscripciones ni compromisos.',
  },
  {
    q: '¿Cómo pago?',
    a: 'Coordinamos el método de pago por WhatsApp al confirmar tu pedido.',
  },
];

const INFO_CARDS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: 'wa.me/message/ZYFLIBTMILUPK1',
    href: WHATSAPP_LINK,
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: `${INSTAGRAM_OASIS.handle} · ${INSTAGRAM_WELLSHOT.handle}`,
    href: INSTAGRAM_OASIS.url,
  },
  { icon: Truck, label: 'Entregas', value: DELIVERY_ZONES.join(' · ') },
  { icon: Clock3, label: 'Pedidos', value: ORDER_CUTOFF },
];

const FaqItem = ({ item, open, onToggle }) => (
  <div className="border-b border-oasis-olive-200 py-5">
    <button onClick={onToggle} className="w-full flex items-center justify-between text-left gap-4">
      <span className="font-semibold text-oasis-ink">{item.q}</span>
      <ChevronDown
        size={18}
        className={`flex-none text-oasis-olive-600 transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
    {open && <p className="mt-3 text-sm text-oasis-ink/60">{item.a}</p>}
  </div>
);

const Contact = () => {
  const { supabase } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const canSubmit = name.trim() !== '' && phone.trim() !== '';

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
      zone && `Zona de entrega: ${zone}`,
      interest && `Le interesa: ${interest}`,
      message && `Mensaje: ${message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const { error: insertError } = await supabase
      .schema('operations')
      .from('leads')
      .insert([
        {
          name: name.trim(),
          phone: phone.trim(),
          message: details || null,
          source: 'contacto',
        },
      ]);

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError('No se pudo enviar tu mensaje. Intentá de nuevo en un momento.');
      return;
    }

    setDone(true);
  };

  return (
    <div>
      <Seo
        title="Contacto"
        description="Contactá a Oasis para pedir comida saludable preparada o cotizar catering en la Zona Norte de Costa Rica. Respondemos por WhatsApp."
        path="/contacto"
        keywords={['contacto Oasis', 'pedidos WhatsApp', 'comida saludable Costa Rica']}
      />

      {/* Header + form */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 grid lg:grid-cols-2 gap-12">
        <div>
          <SectionBadge>Contacto</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Hablemos de tu próximo pedido
          </h1>
          <p className="mt-4 text-oasis-ink/70 max-w-md">
            La forma más rápida de pedir es por WhatsApp. También podés dejarnos tus datos y te
            escribimos.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {INFO_CARDS.map((card) => {
              const content = (
                <div className="bg-white rounded-2xl border border-oasis-olive-100 p-5 flex items-start gap-3 h-full">
                  <span className="flex-none w-9 h-9 rounded-full bg-oasis-olive-100 text-oasis-olive-700 flex items-center justify-center">
                    <card.icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide uppercase text-oasis-ink/70">
                      {card.label}
                    </p>
                    <p className="text-sm text-oasis-ink mt-1 break-words">{card.value}</p>
                  </div>
                </div>
              );

              return card.href ? (
                <a
                  key={card.label}
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:shadow-md transition rounded-2xl"
                >
                  {content}
                </a>
              ) : (
                <div key={card.label}>{content}</div>
              );
            })}
          </div>
        </div>

        <div className="bg-oasis-olive-50 rounded-3xl p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-1">
            Quiero ser cliente
          </h2>
          <p className="text-sm text-oasis-ink/60 mb-6">Dejanos tus datos y te contactamos.</p>

          {done ? (
            <div className="text-center py-10">
              <h3 className="font-semibold text-oasis-ink mb-2">¡Mensaje enviado!</h3>
              <p className="text-oasis-ink/60 text-sm">Te vamos a responder a la brevedad.</p>
            </div>
          ) : (
            <form className="grid sm:grid-cols-2 gap-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Nombre
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Teléfono
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="8888-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-zone"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Zona de entrega
                </label>
                <select
                  id="contact-zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                >
                  <option value="">Elegí tu zona</option>
                  {DELIVERY_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-interest"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Me interesa
                </label>
                <input
                  id="contact-interest"
                  type="text"
                  placeholder="Almuerzos, Well Shot, catering…"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-oasis-ink/70 mb-2"
                >
                  Mensaje
                </label>
                <textarea
                  id="contact-message"
                  rows="4"
                  placeholder="¿Alguna preferencia o alergia?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition resize-none"
                />
              </div>

              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">Sitio web</label>
                <input
                  type="text"
                  id="website"
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
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-oasis-olive-50 py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <SectionBadge>FAQ</SectionBadge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-oasis-ink mt-3 mb-8">
            Preguntas frecuentes
          </h2>

          <div>
            {FAQS.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
