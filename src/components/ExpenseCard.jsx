import { Calendar, Tag, Pencil, Trash2 } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ExpenseCard = ({ id, descripcion, categoria, fecha, monto, onEdit, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition">
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{descripcion}</h2>

        <div className="flex flex-wrap gap-3 mt-2">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Tag size={11} />
            {categoria}
          </span>

          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
            {formatDate(fecha)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-lg font-bold text-red-500 dark:text-red-400">₡{Number(monto).toLocaleString()}</div>

        {(onEdit || onDelete) && (
          <div className="flex gap-1 border-l border-slate-100 dark:border-slate-700 pl-3">
            {onEdit && (
              <button
                onClick={() => onEdit({ id, descripcion, categoria, fecha, monto })}
                title="Editar"
                className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition"
              >
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                title="Eliminar"
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
