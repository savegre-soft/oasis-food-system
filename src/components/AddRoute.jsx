import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { sileo } from 'sileo';

const DAYS = [
  { value: 'Monday', label: 'Lunes' },
  { value: 'Tuesday', label: 'Martes' },
  { value: 'Wednesday', label: 'Miércoles' },
  { value: 'Thursday', label: 'Jueves' },
  { value: 'Friday', label: 'Viernes' },
  { value: 'Saturday', label: 'Sábado' },
  { value: 'Sunday', label: 'Domingo' },
];

const AddRoute = ({ onSuccess, initialData }) => {
  const { supabase } = useApp();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [selectedDays, setSelectedDays] = useState(
    initialData?.route_delivery_days?.map((d) => d.day_of_week) ?? []
  );
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

    let routeId;
    if (isEdit) {
      const { error } = await supabase
        .schema('operations')
        .from('routes')
        .update({ name, description })
        .eq('id_route', initialData.id_route);
      if (error) {
        sileo.error('Error al actualizar la ruta');
        console.error(error);
        setLoading(false);
        return;
      }
      // Replace delivery days
      await supabase
        .schema('operations')
        .from('route_delivery_days')
        .delete()
        .eq('route_id', initialData.id_route);
      routeId = initialData.id_route;
    } else {
      const { data, error } = await supabase
        .schema('operations')
        .from('routes')
        .insert([{ name, description, is_active: true, route_type: null }])
        .select('id_route')
        .single();
      if (error) {
        sileo.error('Error al guardar la ruta');
        console.error(error);
        setLoading(false);
        return;
      }
      routeId = data.id_route;
    }

    if (selectedDays.length > 0) {
      const { error } = await supabase
        .schema('operations')
        .from('route_delivery_days')
        .insert(selectedDays.map((day) => ({ route_id: routeId, day_of_week: day })));
      if (error) {
        sileo.error('Error al guardar los días');
        console.error(error);
        setLoading(false);
        return;
      }
    }

    sileo.success(isEdit ? 'Ruta actualizada correctamente' : 'Ruta agregada correctamente');
    if (!isEdit) {
      setName('');
      setDescription('');
      setSelectedDays([]);
    }
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm';
  const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

  return (
    <div className="bg-slate-50 p-8 flex justify-center">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {isEdit ? 'Editar Ruta' : 'Agregar Nueva Ruta'}
        </h1>

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
            {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Guardar Ruta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoute;
