import { MACRO_UNITS } from './orderUtils';

// Reusable macro input panel (protein + carbs)
const MacroPanel = ({ label, colorClass = 'amber', macros, overridden, onUpdate, onReset }) => {
  const palette = {
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };
  const c = palette[colorClass] ?? palette.amber;
  const inp =
    'w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white';
  const sel =
    'px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white';

  return (
    <div className={`rounded-xl p-3 border ${c.border} ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold ${c.text}`}>{label}</p>
        {overridden && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
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
            <label className="text-xs text-slate-500 mb-1 block">{lbl}</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min="0"
                value={macros?.[`${key}_value`] ?? ''}
                onChange={(e) => onUpdate(`${key}_value`, e.target.value)}
                className={inp}
              />
              <select
                value={macros?.[`${key}_unit`] ?? 'g'}
                onChange={(e) => onUpdate(`${key}_unit`, e.target.value)}
                className={sel}
              >
                {MACRO_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroPanel;
