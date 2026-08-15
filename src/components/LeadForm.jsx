import { useState } from 'react';
import { useApp } from '../context/AppContext';

// Formulario único de captura de interesados del sitio público (RF-PUB-04).
// No es un pedido real — eso vive exclusivamente en el portal de clientes
// (Fase 2/4 de la v2). Solo nombre + teléfono + comentario opcional.
const LeadForm = ({ initialComment = '', onSuccess }) => {
  const { supabase } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState(initialComment);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = name.trim() !== '' && phone.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    // Honeypot: si un bot completó este campo oculto, simulamos éxito sin
    // insertar nada — no le damos pistas de que fue detectado.
    if (honeypot) {
      setDone(true);
      if (onSuccess) onSuccess();
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
          phone: phone.trim(),
          message: comment.trim() || null,
          source: 'interesado',
        },
      ]);

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError('No se pudo enviar tu solicitud. Intentá de nuevo en un momento.');
      return;
    }

    setDone(true);
    if (onSuccess) onSuccess();
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-semibold text-emerald-700 mb-2">¡Gracias!</h3>
        <p className="text-slate-600">
          Recibimos tu información. Nuestro equipo te va a contactar pronto para coordinar tu suscripción.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
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
        <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
        <input
          type="tel"
          placeholder="Tu número de teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Comentario <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          rows="4"
          placeholder="Contanos qué te interesa..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
        />
      </div>

      {/* Honeypot — oculto para personas, visible para bots que completan todos los campos */}
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
        className="mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Enviando...' : 'Quiero ser cliente'}
      </button>
    </form>
  );
};

export default LeadForm;
