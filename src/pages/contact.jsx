import { useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

// Antes era un componente puramente presentacional que dependía de un
// `onSubmit` por props — en App.jsx se renderiza sin esa prop, así que el
// formulario nunca persistía nada. Ahora guarda cada mensaje en `operations
// .leads` (source='contacto'), visible desde la bandeja interna "Prospectos"
// (RF-PUB-03, docs/v2/02_REQUERIMIENTOS_SITIO_PUBLICO.md).
const Contact = ({
  title = 'Contáctanos',
  description = '¿Tenés alguna duda? Escribinos y te respondemos a la brevedad.',
  location = '',
  phone = '',
  schedule = '',
}) => {
  const { supabase } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = name.trim() !== '' && message.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    if (honeypot) {
      setDone(true);
      return;
    }

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase
      .schema('operations')
      .from('leads')
      .insert([
        {
          name: name.trim(),
          email: email.trim() || null,
          message: message.trim(),
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
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {title && <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">{title}</h1>}

          {description && <p className="mt-4 text-slate-600">{description}</p>}
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white shadow-xl rounded-3xl p-8 md:p-12"
        >
          {done ? (
            <div className="text-center py-6">
              <h3 className="text-xl font-semibold text-emerald-700 mb-2">¡Mensaje enviado!</h3>
              <p className="text-slate-600">Te vamos a responder a la brevedad.</p>
            </div>
          ) : (
            <form className="grid gap-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="correo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mensaje</label>
                <textarea
                  rows="5"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                />
              </div>

              {/* Honeypot */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">Sitio web</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Extra Info */}
        {(location || phone || schedule) && (
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            {location && (
              <div className="bg-emerald-50 rounded-2xl p-6">
                <h3 className="font-semibold text-emerald-700 mb-2">📍 Ubicación</h3>
                <p className="text-sm text-slate-600">{location}</p>
              </div>
            )}

            {phone && (
              <div className="bg-emerald-50 rounded-2xl p-6">
                <h3 className="font-semibold text-emerald-700 mb-2">📞 Teléfono</h3>
                <p className="text-sm text-slate-600">{phone}</p>
              </div>
            )}

            {schedule && (
              <div className="bg-emerald-50 rounded-2xl p-6">
                <h3 className="font-semibold text-emerald-700 mb-2">⏰ Horario</h3>
                <p className="text-sm text-slate-600">{schedule}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
