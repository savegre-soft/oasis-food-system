import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

const AddExpensive = ({ onAdded, expense }) => {
  const { supabase, user } = useApp();

  const isEditing = !!expense;
  const today = new Date().toISOString().split('T')[0];

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    descripcion: expense?.descripcion ?? '',
    categoria: expense?.category_id ?? '',
    fecha: expense?.fecha ?? today,
    monto: expense?.monto ?? '',
  });

  useEffect(() => {
    const GetCategories = async () => {
      try {
        const { data, error } = await supabase
          .schema('operations')
          .from('expense_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        setCategories(data || []);
      } catch (error) {
        console.error(error);
        sileo.error('Error cargando categorías');
      }
    };

    GetCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      descripcion: '',
      categoria: '',
      fecha: today,
      monto: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.descripcion || !form.categoria || !form.fecha || !form.monto) {
      sileo.warning('Completa todos los campos');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        description: form.descripcion,
        category_id: Number(form.categoria),
        expense_date: form.fecha,
        amount: Number(form.monto),
      };

      if (isEditing) {
        const { error } = await supabase
          .schema('operations')
          .from('expenses')
          .update(payload)
          .eq('id_expense', expense.id);

        if (error) throw error;
        sileo.success('Gasto actualizado correctamente');
      } else {
        const { error } = await supabase
          .schema('operations')
          .from('expenses')
          .insert([{ ...payload, created_by: user?.id ?? 1 }]);

        if (error) throw error;
        sileo.success('Gasto agregado correctamente');
        resetForm();
      }

      onAdded?.();
    } catch (error) {
      console.error(error);
      sileo.error(isEditing ? 'No se pudo actualizar el gasto' : 'No se pudo guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 w-full max-w-xl space-y-6 rounded-2xl shadow-sm"
      >
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Editar Gasto' : 'Agregar Gasto'}
        </h2>

        {/* Descripción */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Descripción</label>
          <input
            type="text"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Ej: Gasolina ruta oeste"
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Categoría</label>
          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((cat) => (
              <option key={cat.id_expense_category} value={cat.id_expense_category}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Monto</label>
          <input
            type="number"
            name="monto"
            step="0.01"
            min="0"
            value={form.monto}
            onChange={handleChange}
            placeholder="₡0.00"
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar Gasto' : 'Guardar Gasto'}
          </button>

          {!isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl hover:bg-slate-100 transition"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddExpensive;
