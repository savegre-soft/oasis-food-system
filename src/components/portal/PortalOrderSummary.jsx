import { CheckCircle2, Pencil } from 'lucide-react';
import { DAYS_ORDER, DAY_LABELS, DAY_SHORT, MACRO_UNIT } from '../orderUtils';

const CLASSIFICATION_LABEL = {
  Lunch: 'Solo Almuerzo',
  Dinner: 'Solo Cena',
  both: 'Almuerzo + Cena',
  Family: 'Familiar',
};

// Resumen de confirmación del portal — mismo formato que StepConfirm.jsx
// (usado internamente por el staff en AddOrder.jsx), sin las secciones de
// Express/pago que no aplican al portal.
const PortalOrderSummary = ({
  client,
  classification,
  isFamilyClient,
  resolvedRoute,
  lunchMacros,
  dinnerMacros,
  dayRecipes,
  weekStart,
  weekEnd,
  appliedDays = [],
  skippedDays = [],
  onEditAgain,
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 space-y-5">
    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 size={20} />
      <h2 className="font-semibold">¡Pedido confirmado!</h2>
    </div>

    {skippedDays.length > 0 && (
      <p className="text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-2.5">
        Estos días ya no se pudieron modificar por estar fuera del horario de edición:{' '}
        {skippedDays.map((d) => DAY_LABELS[d] ?? d).join(', ')}.
      </p>
    )}

    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{client?.name}</p>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            isFamilyClient
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
          }`}
        >
          {isFamilyClient ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
        </span>
      </div>

      {weekStart && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Semana</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {weekStart} — {weekEnd}
          </p>
        </div>
      )}

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Menú</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {CLASSIFICATION_LABEL[classification] ?? classification}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">Ruta</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {resolvedRoute?.name ?? 'Sin ruta'}
        </p>
        {resolvedRoute?.route_delivery_days?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {resolvedRoute.route_delivery_days.map((d, i) => (
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

      {!isFamilyClient && (lunchMacros || dinnerMacros) && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Macros</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {(classification === 'Lunch' || classification === 'both') && lunchMacros && (
              <span>
                ☀️ {lunchMacros.protein_value} {MACRO_UNIT} prot · {lunchMacros.carb_value} {MACRO_UNIT} carbos
              </span>
            )}
            {(classification === 'Dinner' || classification === 'both') && dinnerMacros && (
              <span className={classification === 'both' ? 'ml-2' : ''}>
                🌙 {dinnerMacros.protein_value} {MACRO_UNIT} prot · {dinnerMacros.carb_value} {MACRO_UNIT} carbos
              </span>
            )}
          </p>
        </div>
      )}

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-2">
          Días con recetas
        </p>
        <div className="space-y-2">
          {DAYS_ORDER.filter((d) => (dayRecipes[d] ?? []).some((r) => r.recipe_id)).map((day) => (
            <div key={day} className="flex items-start gap-2">
              <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium min-w-[48px] text-center shrink-0 mt-0.5">
                {DAY_SHORT[day]}
                {skippedDays.includes(day) && ' ⚠️'}
              </span>
              <div className="space-y-1 flex-1">
                {dayRecipes[day]
                  .filter((r) => r.recipe_id)
                  .map((r, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {r.recipe_name || 'Receta'}
                      </span>
                      {r.quantity > 1 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">×{r.quantity}</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {appliedDays.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin días confirmados.</p>
          )}
        </div>
      </div>
    </div>

    {onEditAgain && (
      <button
        onClick={onEditAgain}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition mx-auto"
      >
        <Pencil size={14} /> Editar de nuevo
      </button>
    )}
  </div>
);

export default PortalOrderSummary;
