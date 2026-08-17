import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useApp } from '../context/AppContext';

// dish: fila de bulk_dishes (id_bulk_dish, name)
const BulkDishPriceHistory = ({ dish }) => {
  const { supabase } = useApp();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('bulk_dish_price_history')
        .select('id_bulk_dish_price_history, price, changed_at')
        .eq('bulk_dish_id', dish.id_bulk_dish)
        .order('changed_at', { ascending: false });
      if (error) console.error(error);
      setHistory(data ?? []);
      setLoading(false);
    };
    run();
  }, [supabase, dish.id_bulk_dish]);

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Historial de precios</h2>
      <p className="text-sm text-slate-500 mb-6">{dish.name}</p>

      {loading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <History size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin cambios de precio registrados todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id_bulk_dish_price_history}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm"
            >
              <span className="text-slate-500">
                {new Date(entry.changed_at).toLocaleDateString('es-CR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="font-semibold text-slate-800">
                ₡{Number(entry.price).toLocaleString('es-CR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkDishPriceHistory;
