import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { sileo } from 'sileo';

const DAYS = [
  { value: 'Monday',    label: 'Lunes' },
  { value: 'Tuesday',   label: 'Martes' },
  { value: 'Wednesday', label: 'Miércoles' },
  { value: 'Thursday',  label: 'Jueves' },
  { value: 'Friday',    label: 'Viernes' },
  { value: 'Saturday',  label: 'Sábado' },
  { value: 'Sunday',    label: 'Domingo' },
];

const AddRoute = ({ onSuccess }) => {
  const { supabase } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    const { data: routeData, error: routeError } = await supabase
      .schema('operations')
      .from('routes')
      .insert([{ name, description, is_active: true, route_type: null }])
      .select('id_route')
      .single();

    if (routeError) {
      sileo.error('Error al guardar la ruta');
      console.error(routeError);
      setLoading(false);
      return;
    }

    if (selectedDays.length > 0) {
      const { error: daysError } = await supabase
        .schema('operations')
        .from('route_delivery_days')
        .insert(selectedDays.map((day) => ({ route_id: routeData.id_route, day_of_week: day })));

      if (daysError) {
        sileo.error('Ruta creada pero hubo un error al guardar los días');
        console.error(daysError);
        setLoading(false);
        return;
      }
    }

    sileo.success('Ruta agregada correctamente');
    setName('');
    setDescription('');
    setSelectedDays([]);
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm';
  const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

  return (
    <div className="bg-slate-50 p-8 flex justify-center">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Agregar Nueva Ruta</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nombre de la Ruta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ruta Norte"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la ruta..."
              rows="3"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Días de Entrega</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map((day) => {
                const active = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                      active
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">Opcional — puedes agregar días después</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
          >
            <Plus size={18} />
            {loading ? 'Guardando...' : 'Guardar Ruta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoute;