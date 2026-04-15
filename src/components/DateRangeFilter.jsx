import { CHART_PRESETS } from '../utils/chartUtils';

const ACCENT = {
  emerald: { active: 'bg-emerald-600 text-white border-emerald-600', ring: 'focus:ring-emerald-300' },
  orange:  { active: 'bg-orange-500  text-white border-orange-500',  ring: 'focus:ring-orange-300'  },
  blue:    { active: 'bg-blue-600    text-white border-blue-600',    ring: 'focus:ring-blue-300'    },
};

const DateRangeFilter = ({ dateRange, setDateRange, accent = 'emerald' }) => {
  const { active: activeClass, ring: ringClass } = ACCENT[accent] ?? ACCENT.emerald;

  const isPreset = (fn) => {
    const p = fn();
    return p.from === dateRange.from && p.to === dateRange.to;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-slate-500 shrink-0">Período</span>

      <div className="flex flex-wrap gap-2">
        {CHART_PRESETS.map(({ label, fn }) => (
          <button
            key={label}
            type="button"
            onClick={() => setDateRange(fn())}
            className={`text-xs px-3 py-1.5 rounded-xl border transition ${
              isPreset(fn) ? activeClass : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="text-slate-200 hidden sm:block">|</span>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.from}
          max={dateRange.to}
          onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          className={`text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 ${ringClass}`}
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date"
          value={dateRange.to}
          min={dateRange.from}
          onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          className={`text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 ${ringClass}`}
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;
