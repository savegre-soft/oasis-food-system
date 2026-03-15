import { useState } from 'react';

const DAY_LABELS = { Monday:'Lunes', Tuesday:'Martes', Wednesday:'Miércoles', Thursday:'Jueves', Friday:'Viernes', Saturday:'Sábado', Sunday:'Domingo' };

// Displays current route + optional inline selector to change it
const RouteSelector = ({ resolvedRoute, allRoutes, onChange, readOnly = false }) => {
  const [open, setOpen] = useState(false);

  const days = resolvedRoute?.route_delivery_days ?? [];

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Ruta</p>

      {!open ? (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {resolvedRoute?.name ?? 'Sin ruta asignada'}
            </p>
            {days.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {days.map((d, i) => (
                  <span key={i} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
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
              className="text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition shrink-0 ml-4"
            >
              Cambiar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Selecciona una ruta:</p>
          {allRoutes.map((route) => {
            const active = resolvedRoute?.id_route === route.id_route;
            return (
              <button
                key={route.id_route}
                type="button"
                onClick={() => { onChange(route); setOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${
                  active
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                <p className="font-medium">{route.name}</p>
                {route.route_delivery_days?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {route.route_delivery_days.map((d, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          active ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-500'
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
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteSelector;
