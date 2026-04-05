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
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-100 hover:shadow-md hover:border-slate-200 transition">

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-slate-800 truncate">{descripcion}</h2>

        <div className="flex flex-wrap gap-3 mt-2">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-600">
            <Tag size={11} />
            {categoria}
          </span>

          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar size={13} className="text-slate-400" />
            {formatDate(fecha)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-lg font-bold text-red-500">
          ₡{Number(monto).toLocaleString()}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-1 border-l border-slate-100 pl-3">
            {onEdit && (
              <button
                onClick={() => onEdit({ id, descripcion, categoria, fecha, monto })}
                title="Editar"
                className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition"
              >
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                title="Eliminar"
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
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
