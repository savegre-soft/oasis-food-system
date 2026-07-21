import { useState } from 'react';

const DAY_LABELS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

// Displays current route + optional inline selector to change it
const RouteSelector = ({ resolvedRoute, allRoutes, onChange, readOnly = false }) => {
  const [open, setOpen] = useState(false);

  const days = resolvedRoute?.route_delivery_days ?? [];

  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">
        Ruta
      </p>

      {!open ? (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {resolvedRoute?.name ?? 'Sin ruta asignada'}
            </p>
            {days.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {days.map((d, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
                  >
                    {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                  </span>
                ))}
              </div>
            )}
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 transition shrink-0 ml-4"
            >
              Cambiar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">Selecciona una ruta:</p>
          {allRoutes.map((route) => {
            const active = resolvedRoute?.id_route === route.id_route;
            return (
              <button
                key={route.id_route}
                type="button"
                onClick={() => {
                  onChange(route);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${
                  active
                    ? 'bg-green-800 dark:bg-green-600 text-white border-green-800 dark:border-green-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <p className="font-medium">{route.name}</p>
                {route.route_delivery_days?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {route.route_delivery_days.map((d, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          active
                            ? 'bg-slate-600 dark:bg-indigo-500 text-slate-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteSelector;
