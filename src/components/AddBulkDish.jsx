import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

const AddBulkDish = ({ initialData, onSuccess }) => {
  const { supabase } = useApp();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name ?? '');
  const [suggestedPrice, setSuggestedPrice] = useState(initialData?.suggested_price ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const newPrice = suggestedPrice === '' ? null : Number(suggestedPrice);
    const priceChanged = isEdit ? newPrice !== (initialData?.suggested_price ?? null) : newPrice != null;

    const payload = {
      name: name.trim(),
      suggested_price: newPrice,
    };

    const { data: dishData, error } = isEdit
      ? await supabase
          .schema('operations')
          .from('bulk_dishes')
          .update(payload)
          .eq('id_bulk_dish', initialData.id_bulk_dish)
          .select('id_bulk_dish')
          .single()
      : await supabase.schema('operations').from('bulk_dishes').insert([payload]).select('id_bulk_dish').single();

    if (error) {
      sileo.error(isEdit ? 'Error al actualizar el plato' : 'Error al guardar el plato');
      console.error(error);
      setLoading(false);
      return;
    }

    if (priceChanged && newPrice != null) {
      const { error: historyError } = await supabase
        .schema('operations')
        .from('bulk_dish_price_history')
        .insert([{ bulk_dish_id: dishData.id_bulk_dish, price: newPrice }]);
      if (historyError) console.error(historyError);
    }

    sileo.success(isEdit ? 'Plato actualizado' : 'Plato guardado');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1">{isEdit ? 'Editar plato' : 'Nuevo plato'}</h2>
      <p className="text-sm text-slate-500 mb-6">Catálogo de platos para venta masiva (ej. arroz con pollo)</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Arroz con pollo"
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Precio sugerido por unidad <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={suggestedPrice}
            onChange={(e) => setSuggestedPrice(e.target.value)}
            placeholder="₡"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">
            Se usa para precargar el monto al registrar una venta — se puede ajustar cada vez.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar plato'}
        </button>
      </form>
    </div>
  );
};

export default AddBulkDish;
