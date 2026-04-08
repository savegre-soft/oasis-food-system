import { Calendar, Tag, Pencil, Trash2, ReceiptText } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ExpenseTable = ({
  gastos,
  onEdit,
  onDelete,
  emptyMessage = 'No se encontraron registros.',
}) => {
  if (!gastos || gastos.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 gap-3">
        <ReceiptText size={40} className="text-slate-300" />
        <p className="text-slate-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
              <th className="px-5 py-4 font-semibold w-12">#</th>
              <th className="px-5 py-4 font-semibold">Descripción</th>
              <th className="px-5 py-4 font-semibold">Categoría</th>
              <th className="px-5 py-4 font-semibold">Fecha</th>
              <th className="px-5 py-4 font-semibold text-right">Monto</th>
              {(onEdit || onDelete) && (
                <th className="px-5 py-4 font-semibold text-center">Acciones</th>
              )}
            </tr>
          </thead>

          <tbody>
            {gastos.map((gasto, idx) => (
              <tr
                key={gasto.id}
                className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{idx + 1}</td>

                <td className="px-5 py-3.5 font-medium text-slate-800">{gasto.descripcion}</td>

                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
                    <Tag size={11} />
                    {gasto.categoria}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    {formatDate(gasto.fecha)}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-right font-semibold text-red-500 whitespace-nowrap">
                  ₡{Number(gasto.monto).toLocaleString()}
                </td>

                {(onEdit || onDelete) && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(gasto)}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(gasto.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td
                colSpan={onEdit || onDelete ? 4 : 3}
                className="px-5 py-3.5 text-slate-500 text-xs font-medium"
              >
                {gastos.length} {gastos.length === 1 ? 'registro' : 'registros'}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-red-600 whitespace-nowrap">
                ₡{total.toLocaleString()}
              </td>
              {(onEdit || onDelete) && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;
