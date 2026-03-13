import { Calendar, Tag } from "lucide-react";

const ExpenseTable = ({ gastos }) => {
 
  if (!gastos || gastos.length === 0) {
    return (
      <div className="text-center text-slate-500 mt-12">
        No se encontraron gastos.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      
      <table className="w-full text-left">
        
        <thead className="bg-slate-50 border-b">
          <tr className="text-sm text-slate-600">
            <th className="p-4">Descripción</th>
            <th className="p-4">Categoría</th>
            <th className="p-4">Fecha</th>
            <th className="p-4 text-right">Monto</th>
          </tr>
        </thead>

        <tbody>
          {gastos.map((gasto) => (
            <tr key={gasto.id} className="border-b last:border-none hover:bg-slate-50">

              <td className="p-4 font-medium text-slate-800">
                {gasto.descripcion}
              </td>

              <td className="p-4 text-slate-600 flex items-center gap-2">
                <Tag size={14} />
                {gasto.categoria}
              </td>

              <td className="p-4 text-slate-600 flex items-center gap-2">
                <Calendar size={14} />
                {gasto.fecha}
              </td>

              <td className="p-4 text-right font-semibold text-red-500">
                ₡{Number(gasto.monto).toLocaleString()}
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
};

export default ExpenseTable;