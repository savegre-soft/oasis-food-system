import { useState } from 'react';
import { useApp } from '../../context/AppContext';

// Fase 1 de "Cotizaciones de eventos": el formulario guarda la solicitud
// estructurada en operations.event_quotes (visible en el panel interno,
// pantalla "Cotizaciones") y dispara una notificación al staff (campanita).
// El envío de correo al staff es Fase 2 de este mismo feature.

const MEAL_TIME_OPTIONS = ['Desayuno', 'Almuerzo', 'Café', 'Cena', 'Snacks/Meriendas', 'Brunch'];

const EVENT_TYPE_OPTIONS = ['Baby shower', 'Té de cocina', 'Boda', 'Fiesta', 'Evento corporativo', 'Otro'];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-oasis-olive-200 bg-white focus:outline-none focus:ring-2 focus:ring-oasis-olive-500 transition';

const labelClass = 'block text-sm font-medium text-oasis-ink/70 mb-2';

const initialForm = {
  name: '',
  phone: '',
  eventDateTime: '',
  eventPlace: '',
  eventAddress: '',
  guestCount: '',
  mealTimes: [],
  hasBudget: '', // 'no' | 'yes' | ''
  budgetAmount: '',
  eventType: '',
  eventTypeOther: '',
  needsDishware: '', // 'yes' | 'no' | ''
};

const EventQuoteForm = () => {
  const { supabase } = useApp();

  const [form, setForm] = useState(initialForm);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = form.name.trim() !== '' && form.phone.trim() !== '';

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleMealTime = (option) =>
    setForm((f) => ({
      ...f,
      mealTimes: f.mealTimes.includes(option)
        ? f.mealTimes.filter((t) => t !== option)
        : [...f.mealTimes, option],
    }));

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
      .from('event_quotes')
      .insert([
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          event_datetime: form.eventDateTime || null,
          event_place: form.eventPlace.trim() || null,
          event_address: form.eventAddress.trim() || null,
          guest_count: form.guestCount ? Number(form.guestCount) : null,
          meal_times: form.mealTimes,
          has_budget: form.hasBudget === '' ? null : form.hasBudget === 'yes',
          budget_amount: form.hasBudget === 'yes' && form.budgetAmount ? Number(form.budgetAmount) : null,
          event_type: form.eventType || null,
          event_type_other: form.eventType === 'Otro' ? form.eventTypeOther.trim() || null : null,
          needs_dishware: form.needsDishware === '' ? null : form.needsDishware === 'yes',
        },
      ]);

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError('No se pudo enviar tu cotización. Intentá de nuevo en un momento.');
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <h3 className="font-display text-xl font-semibold text-oasis-ink mb-2">¡Gracias por tu solicitud!</h3>
        <p className="text-oasis-ink/60">Te respondemos por WhatsApp con una propuesta a la medida.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
      <div>
        <label htmlFor="quote-name" className={labelClass}>
          Nombre
        </label>
        <input
          id="quote-name"
          type="text"
          placeholder="Tu nombre"
          value={form.name}
          onChange={update('name')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="quote-phone" className={labelClass}>
          Número telefónico
        </label>
        <input
          id="quote-phone"
          type="tel"
          placeholder="8888-8888"
          value={form.phone}
          onChange={update('phone')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="quote-datetime" className={labelClass}>
          Fecha y hora del evento
        </label>
        <input
          id="quote-datetime"
          type="datetime-local"
          value={form.eventDateTime}
          onChange={update('eventDateTime')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="quote-guests" className={labelClass}>
          Cantidad de personas
        </label>
        <input
          id="quote-guests"
          type="number"
          min="1"
          placeholder="Ej. 50"
          value={form.guestCount}
          onChange={update('guestCount')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="quote-place" className={labelClass}>
          Lugar del evento
        </label>
        <input
          id="quote-place"
          type="text"
          placeholder="Salón, finca, casa..."
          value={form.eventPlace}
          onChange={update('eventPlace')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="quote-address" className={labelClass}>
          Dirección del evento
        </label>
        <input
          id="quote-address"
          type="text"
          placeholder="Dirección exacta"
          value={form.eventAddress}
          onChange={update('eventAddress')}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="quote-event-type" className={labelClass}>
          Tipo de evento
        </label>
        <select
          id="quote-event-type"
          value={form.eventType}
          onChange={update('eventType')}
          className={inputClass}
        >
          <option value="">Elegí el tipo de evento</option>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {form.eventType === 'Otro' && (
          <input
            type="text"
            placeholder="Especificá el tipo de evento"
            value={form.eventTypeOther}
            onChange={update('eventTypeOther')}
            className={`${inputClass} mt-3`}
          />
        )}
      </div>

      <div className="sm:col-span-2">
        <span className={labelClass}>Número de tiempos de alimentación</span>
        <div className="flex flex-wrap gap-2">
          {MEAL_TIME_OPTIONS.map((opt) => {
            const active = form.mealTimes.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleMealTime(opt)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  active
                    ? 'bg-oasis-olive-600 border-oasis-olive-600 text-white'
                    : 'bg-white border-oasis-olive-200 text-oasis-ink/70 hover:bg-oasis-olive-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className={labelClass}>Presupuesto</span>
        <div className="flex gap-2">
          {[
            ['no', 'Sin presupuesto'],
            ['yes', 'Con presupuesto'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setForm((f) => ({ ...f, hasBudget: val }))}
              aria-pressed={form.hasBudget === val}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                form.hasBudget === val
                  ? 'bg-oasis-olive-600 border-oasis-olive-600 text-white'
                  : 'bg-white border-oasis-olive-200 text-oasis-ink/70 hover:bg-oasis-olive-50'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        {form.hasBudget === 'yes' && (
          <input
            type="number"
            min="0"
            placeholder="¿De cuánto? (₡)"
            value={form.budgetAmount}
            onChange={update('budgetAmount')}
            className={`${inputClass} mt-3`}
          />
        )}
      </div>

      <div>
        <span className={labelClass}>Requiere vajilla</span>
        <div className="flex gap-2">
          {[
            ['yes', 'Sí'],
            ['no', 'No'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setForm((f) => ({ ...f, needsDishware: val }))}
              aria-pressed={form.needsDishware === val}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                form.needsDishware === val
                  ? 'bg-oasis-olive-600 border-oasis-olive-600 text-white'
                  : 'bg-white border-oasis-olive-200 text-oasis-ink/70 hover:bg-oasis-olive-50'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website-quote">Sitio web</label>
        <input
          type="text"
          id="website-quote"
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
        className="sm:col-span-2 mt-2 bg-oasis-olive-600 text-white py-3.5 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? 'Enviando...' : 'Enviar cotización'}
      </button>
    </form>
  );
};

export default EventQuoteForm;
