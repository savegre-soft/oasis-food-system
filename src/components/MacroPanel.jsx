import { MACRO_UNIT } from './orderUtils';

// Reusable macro input panel (protein + carbs) — values are unit counts, not grams
const MacroPanel = ({ label, colorClass = 'amber', macros, overridden, onUpdate, onReset }) => {
  const palette = {
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
  const c = palette[colorClass] ?? palette.amber;
  const inp =
    'w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

  return (
    <div className={`rounded-xl p-3 border ${c.border} ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold ${c.text}`}>{label}</p>
        {overridden && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline"
          >
            Usar base
          </button>
        )}
      </div>
      <div className="space-y-2">
        {[
          { key: 'protein', label: 'Proteína' },
          { key: 'carb', label: 'Carbohidratos' },
        ].map(({ key, label: lbl }) => (
          <div key={key}>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{lbl}</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="1"
                value={macros?.[`${key}_value`] ?? ''}
                onChange={(e) => onUpdate(`${key}_value`, e.target.value)}
                className={inp}
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">{MACRO_UNIT}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroPanel;
