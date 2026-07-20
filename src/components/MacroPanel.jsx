import { MACRO_UNIT } from './orderUtils';

const PALETTE = {
  amber: {
    border: 'border-amber-200 dark:border-amber-800/50',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
  },
  indigo: {
    border: 'border-indigo-200 dark:border-indigo-800/50',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
};

/**
 * Panel de macros (proteína + carbohidratos), en unidades (no gramos).
 * Dos modos, según las props recibidas:
 * - Editable: pasar `macros` + `onUpdate` (y opcionalmente `overridden`/`onReset`)
 *   → inputs numéricos, usado en el asistente de pedidos.
 * - Solo lectura: pasar `macro` (sin `onUpdate`) → valores de texto,
 *   usado en el detalle de cliente.
 */
const MacroPanel = ({
  label,
  colorClass,
  accent,
  macros,
  macro,
  overridden,
  onUpdate,
  onReset,
}) => {
  const c = PALETTE[colorClass ?? accent] ?? PALETTE.amber;
  const readOnly = !onUpdate;
  const values = readOnly ? macro : macros;

  if (readOnly && !values) return null;

  const inp =
    'w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

  return (
    <div className={`rounded-xl p-3 border ${c.border} ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold ${c.text}`}>{label}</p>
        {!readOnly && overridden && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline"
          >
            Usar base
          </button>
        )}
      </div>
      <div className={readOnly ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
        {[
          { key: 'protein', label: 'Proteína' },
          { key: 'carb', label: 'Carbohidratos' },
        ].map(({ key, label: lbl }) =>
          readOnly ? (
            <div key={key}>
              <p className="text-xs text-slate-500 dark:text-slate-400">{lbl}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {values?.[`${key}_value`] ?? '—'} {MACRO_UNIT}
              </p>
            </div>
          ) : (
            <div key={key}>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{lbl}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={values?.[`${key}_value`] ?? ''}
                  onChange={(e) => onUpdate(`${key}_value`, e.target.value)}
                  className={inp}
                />
                <span className="text-xs text-slate-400 dark:text-slate-500">{MACRO_UNIT}</span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MacroPanel;
