import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

const AddExpenseEmployee = ({ onAdded, expense }) => {
  const { supabase, user } = useApp();
  const isEditing = !!expense;
  const today = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: expense?.Name ?? '',
    payment_type: expense?.payment_type ?? 'hours',
    units: expense?.Hours ?? '',
    amount: expense?.Amount ?? '',
    date: expense?.WorkDate ?? today,
  });

  const [deductions, setDeductions] = useState(
    (expense?.emp_cost_deductions ?? []).map((d) => ({
      description: d.description,
      amount: String(d.amount),
    }))
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addDeduction = () =>
    setDeductions((prev) => [...prev, { description: '', amount: '' }]);

  const updateDeduction = (idx, field, value) =>
    setDeductions((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );

  const removeDeduction = (idx) =>
    setDeductions((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setForm({ name: '', payment_type: 'hours', units: '', amount: '', date: today });
    setDeductions([]);
  };

  const grossAmount = Number(form.amount) || 0;
  const totalDeductions = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netAmount = grossAmount - totalDeductions;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.units || !form.amount || !form.date) {
      sileo.warning('Completa todos los campos obligatorios');
      return;
    }

    for (const d of deductions) {
      if (!d.description || !d.amount) {
        sileo.warning('Completa descripción y monto en todas las deducciones');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        Name: form.name,
        Hours: Number(form.units),
        Amount: grossAmount,
        WorkDate: form.date,
        payment_type: form.payment_type,
      };

      let recordId = expense?.id;

      if (isEditing) {
        const { error } = await supabase
          .schema('operations')
          .from('empCost')
          .update(payload)
          .eq('id', expense.id);
        if (error) throw error;

        // Delete old deductions and re-insert
        await supabase
          .schema('operations')
          .from('emp_cost_deductions')
          .delete()
          .eq('emp_cost_id', expense.id);
      } else {
        const { data, error } = await supabase
          .schema('operations')
          .from('empCost')
          .insert([{ ...payload, Created_By: user?.id ?? '1' }])
          .select('id')
          .single();
        if (error) throw error;
        recordId = data.id;
      }

      if (deductions.length > 0) {
        const { error: dedErr } = await supabase
          .schema('operations')
          .from('emp_cost_deductions')
          .insert(
            deductions.map((d) => ({
              emp_cost_id: recordId,
              description: d.description,
              amount: Number(d.amount),
            }))
          );
        if (dedErr) console.error('Error guardando deducciones:', dedErr);
      }

      sileo.success(isEditing ? 'Registro actualizado correctamente' : 'Pago registrado correctamente');
      if (!isEditing) resetForm();
      onAdded?.();
    } catch (err) {
      console.error(err);
      sileo.error(isEditing ? 'No se pudo actualizar el registro' : 'No se pudo guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 w-full max-w-xl space-y-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Editar Pago' : 'Registrar Pago'}
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

        {/* Tipo de pago */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Tipo de pago</label>
          <div className="flex bg-slate-100 rounded-xl overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, payment_type: 'hours' }))}
              className={`px-5 py-2 text-sm font-medium transition ${
                form.payment_type === 'hours'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Por horas
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, payment_type: 'days' }))}
              className={`px-5 py-2 text-sm font-medium transition ${
                form.payment_type === 'days'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Por días
            </button>
          </div>
        </div>

        {/* Cantidad (horas o días) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">
            {form.payment_type === 'hours' ? 'Horas trabajadas' : 'Días trabajados'}
          </label>
          <input
            type="number"
            name="units"
            min="0"
            step={form.payment_type === 'days' ? '0.5' : '1'}
            value={form.units}
            onChange={handleChange}
            placeholder={form.payment_type === 'hours' ? 'Ej: 8' : 'Ej: 3'}
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

        {/* Monto bruto */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Monto bruto</label>
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

        {/* Deducciones */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Deducciones</label>
            <button
              type="button"
              onClick={addDeduction}
              className="flex items-center gap-1 text-xs text-slate-600 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
            >
              <Plus size={13} />
              Agregar deducción
            </button>
          </div>

          {deductions.length === 0 && (
            <p className="text-xs text-slate-400 italic">Sin deducciones registradas</p>
          )}

          <div className="space-y-2">
            {deductions.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={d.description}
                  onChange={(e) => updateDeduction(idx, 'description', e.target.value)}
                  placeholder="Descripción (ej: CCSS)"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={d.amount}
                  onChange={(e) => updateDeduction(idx, 'amount', e.target.value)}
                  placeholder="₡0.00"
                  className="w-28 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <button
                  type="button"
                  onClick={() => removeDeduction(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen neto */}
        {form.amount && (
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Monto bruto</span>
              <span>₡{grossAmount.toLocaleString()}</span>
            </div>
            {deductions.length > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Total deducciones</span>
                <span>-₡{totalDeductions.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-2 mt-1">
              <span>Neto a pagar</span>
              <span>₡{netAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

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
