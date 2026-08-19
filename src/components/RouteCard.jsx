import { Trash2, ShieldCheck, Pencil } from 'lucide-react';

const DAY_LABELS = {
  Monday: 'Lun',
  Tuesday: 'Mar',
  Wednesday: 'Mié',
  Thursday: 'Jue',
  Friday: 'Vie',
  Saturday: 'Sáb',
  Sunday: 'Dom',
};

const ROUTE_TYPE_LABELS = {
  complete: { label: 'Almuerzo + Cena', className: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
  individual: { label: 'Solo Almuerzo o Cena', className: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
};

const RouteCard = ({ route, onDelete, onEdit }) => {
  const isSystem = route.route_type !== null && route.route_type !== undefined;
  const typeLabel = ROUTE_TYPE_LABELS[route.route_type];

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
      <div className="flex flex-col gap-1">
        {/* Nombre + badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{route.name}</p>
          {isSystem && typeLabel && (
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${typeLabel.className}`}
            >
              {typeLabel.label}
            </span>
          )}
        </div>

        {/* Descripción */}
        {route.description && <p className="text-sm text-slate-500 dark:text-slate-400">{route.description}</p>}

        {/* Días de entrega */}
        {route.route_delivery_days?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {route.route_delivery_days.map((d) => (
              <span
                key={d.id_delivery_day}
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full"
              >
                {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(route)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition"
          >
            <Pencil size={14} />
          </button>
        )}
        {isSystem ? (
          <ShieldCheck size={18} className="text-slate-300 dark:text-slate-600" />
        ) : (
          <button
            onClick={() => onDelete(route.id_route)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-red-400 dark:text-red-500/80 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500 transition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteCard;
