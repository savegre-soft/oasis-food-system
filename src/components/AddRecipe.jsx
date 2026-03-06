import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { sileo } from 'sileo';

const AddRecipe = () => {
  const { supabase } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setSuccess(false);

    const { error } = await supabase
      .schema('operations')
      .from('recipes')
      .insert([{
        name,
        description,
        is_active: true,
      }]);

    if (error) {
      sileo.error('Error al guardar la receta');
      console.error(error);
      setLoading(false);
      return;
    }

    sileo.success('Receta agregada');
    setName('');
    setDescription('');
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="bg-slate-50 p-8 flex justify-center">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Agregar Nueva Receta</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre del Plato</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pollo a la plancha"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el plato..."
              rows="3"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition disabled:opacity-50"
          >
            <Plus size={18} />
            {loading ? 'Guardando...' : 'Guardar Receta'}
          </button>

          {success && (
            <p className="text-green-600 text-sm mt-2">✅ Receta guardada correctamente</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddRecipe;