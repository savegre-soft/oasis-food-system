import { Calendar, Tag } from "lucide-react";

const ExpenseCard = ({ descripcion, categoria, fecha, monto }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-100 hover:shadow-md transition">
      
      <div>
        <h2 className="font-semibold text-slate-800">{descripcion}</h2>

        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
          <span className="flex items-center gap-2">
            <Tag size={14} />
            {categoria}
          </span>

          <span className="flex items-center gap-2">
            <Calendar size={14} />
            {fecha}
          </span>
        </div>
      </div>

      <div className="text-lg font-semibold text-red-500">
        ₡{Number(monto).toLocaleString()}
      </div>

    </div>
  );
};

export default ExpenseCard;