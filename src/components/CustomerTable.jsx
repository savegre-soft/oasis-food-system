import { motion } from 'framer-motion';
import { MACRO_UNIT } from './orderUtils';

const CLIENT_TYPE = {
  personal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  family: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

export default function CustomerTable({ customers, onSelected }) {
  return (
    <div className="overflow-hidden border rounded-2xl shadow-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Header */}
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Cliente</th>
              <th className="px-6 py-4 text-left font-semibold">Tipo</th>
              <th className="px-6 py-4 text-left font-semibold">Macro Almuerzo</th>
              <th className="px-6 py-4 text-left font-semibold">Macro Cena</th>
              <th className="px-6 py-4 text-right font-semibold">Acción</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {customers.map((c, index) => (
              <motion.tr
                key={c.id_client}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
              >
                {/* Cliente */}
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{c.name}</td>

                {/* Tipo */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                      CLIENT_TYPE[c.client_type] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c.client_type}
                  </span>
                </td>

                {/* Macro Lunch */}
                <td className="px-6 py-4">
                  {c.lunch_macro ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium">
                        {c.lunch_macro.protein_value} {MACRO_UNIT} prot
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                        {c.lunch_macro.carb_value} {MACRO_UNIT} carb
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">—</span>
                  )}
                </td>

                {/* Macro Dinner */}
                <td className="px-6 py-4">
                  {c.dinner_macro ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium">
                        {c.dinner_macro.protein_value} {MACRO_UNIT} prot
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                        {c.dinner_macro.carb_value} {MACRO_UNIT} carb
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">—</span>
                  )}
                </td>

                {/* Acción */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onSelected(c)}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition"
                  >
                    Ver detalle
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
