import { Plus, Trash2, Package } from 'lucide-react';
import { summarizeBatch } from '../bulkSalesUtils';

// batch: bulk_sale_batches con bulk_dishes(name, suggested_price) y
// bulk_sale_entries(clients(name)) anidados.
const BulkSaleBatchCard = ({ batch, onAddSale, onDeleteEntry, onDeleteBatch }) => {
  const { quantitySold, leftover } = summarizeBatch(batch);
  const entries = batch.bulk_sale_entries ?? [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{batch.bulk_dishes?.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {new Date(batch.batch_date + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
            {batch.notes && <span> · {batch.notes}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddSale(batch)}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-800 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 px-3 py-1.5 rounded-xl transition"
          >
            <Plus size={12} /> Registrar venta
          </button>
          {entries.length === 0 && (
            <button
              onClick={() => onDeleteBatch(batch)}
              className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
              title="Eliminar lote"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Cocinado" value={batch.quantity_cooked} />
        <Stat label="Vendido" value={quantitySold} />
        <Stat label="Sobrante" value={leftover} accent={leftover < 0 ? 'text-red-600' : undefined} />
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Package size={13} /> Sin ventas registradas todavía
        </p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div
              key={entry.id_bulk_sale_entry}
              className="group flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"
            >
              <span className="text-slate-600 dark:text-slate-300">
                {entry.clients?.name ?? 'Venta general'}
                <span className="text-slate-400 dark:text-slate-500"> · {entry.quantity} un.</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  ₡{Number(entry.amount).toLocaleString('es-CR')}
                </span>
                <button
                  onClick={() => onDeleteEntry(entry)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div>
    <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-sm font-semibold ${accent ?? 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
  </div>
);

export default BulkSaleBatchCard;
