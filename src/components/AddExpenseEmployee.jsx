import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

const AddExpenseEmployee = ({ onAdded, expense }) => {
  const { supabase, user } = useApp();

  const isEditing = !!expense;
  const today = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: expense?.descripcion ?? '',
    hours: expense?.hours ?? '',
    amount: expense?.monto ?? '',
    date: expense?.fecha ?? today,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ name: '', hours: '', amount: '', date: today });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.hours || !form.amount || !form.date) {
      sileo.warning('Completa todos los campos');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        Name: form.name,
        Hours: Number(form.hours),
        Amount: Number(form.amount),
        WorkDate: form.date,
      };

      if (isEditing) {
        const { error } = await supabase
          .schema('operations')
          .from('empCost')
          .update(payload)
          .eq('id', expense.id);

        if (error) throw error;
        sileo.success('Registro actualizado correctamente');
      } else {
        const { error } = await supabase
          .schema('operations')
          .from('empCost')
          .insert([{ ...payload, Created_By: user?.id ?? '1' }]);

        if (error) throw error;
        sileo.success('Pago registrado correctamente');
        resetForm();
      }

      onAdded?.();
    } catch (error) {
      console.error(error);
      sileo.error(
        isEditing ? 'No se pudo actualizar el registro' : 'No se pudo guardar el registro'
      );
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
          {isEditing ? 'Editar Pago de Empleado' : 'Registrar Pago de Empleado'}
        </h2>

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Nombre del empleado</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej: Pedro Pérez"
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Horas */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Horas trabajadas</label>
          <input
            type="number"
            name="hours"
            min="0"
            value={form.hours}
            onChange={handleChange}
            placeholder="Ej: 8"
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Fecha de trabajo</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Pago */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Monto pagado</label>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            value={form.amount}
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
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
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

export default AddExpenseEmployee;
