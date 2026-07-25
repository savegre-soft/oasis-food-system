import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { toDateString } from '../orderUtils';

// dishes: catálogo activo de bulk_dishes (id_bulk_dish, name, suggested_price)
const AddBulkSaleBatch = ({ dishes, onSuccess }) => {
  const { supabase } = useApp();

  const [dishId, setDishId] = useState(dishes[0]?.id_bulk_dish ?? '');
  const [quantityCooked, setQuantityCooked] = useState('');
  const [batchDate, setBatchDate] = useState(toDateString(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dishId) {
      sileo.error('Selecciona un plato del catálogo');
      return;
    }
    if (quantityCooked === '' || Number(quantityCooked) <= 0) {
      sileo.error('Ingresa cuántas unidades se cocinaron');
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .schema('operations')
      .from('bulk_sale_batches')
      .insert([
        {
          bulk_dish_id: Number(dishId),
          batch_date: batchDate,
          quantity_cooked: Number(quantityCooked),
          notes: notes || null,
        },
      ]);

    if (error) {
      sileo.error('Error al registrar el lote');
      console.error(error);
      setLoading(false);
      return;
    }

    sileo.success('Lote registrado');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Nuevo lote</h2>
      <p className="text-sm text-slate-500 mb-6">
        Registra cuánto se cocinó de un plato para venta masiva
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Plato</label>
          {dishes.length === 0 ? (
            <p className="text-xs text-slate-400">
              Sin platos en el catálogo —{' '}
              <a href="/platos-venta-masiva" className="underline">
                crear uno
              </a>
            </p>
          ) : (
            <select
              value={dishId}
              onChange={(e) => setDishId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm bg-white"
            >
              {dishes.map((d) => (
                <option key={d.id_bulk_dish} value={d.id_bulk_dish}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Cantidad cocinada</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantityCooked}
              onChange={(e) => setQuantityCooked(e.target.value)}
              placeholder="Ej: 50"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Notas <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || dishes.length === 0}
          className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Guardando...' : 'Registrar lote'}
        </button>
      </form>
    </div>
  );
};

export default AddBulkSaleBatch;
