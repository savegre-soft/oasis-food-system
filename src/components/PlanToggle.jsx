

const PlanToggle = ({ value, onChange, name }) => (
  <div className="flex rounded-xl overflow-hidden border border-slate-200 text-xs font-medium">
    {[
      { v: 'estandar',    label: '⭐ Estándar'   },
      { v: 'nutricional', label: '🥗 Nutricional' },
    ].map((opt) => (
      <label key={opt.v}
        className={`flex items-center px-3 py-1.5 cursor-pointer transition select-none ${
          value === opt.v
            ? 'bg-slate-800 text-white'
            : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
      >
        <input type="radio" name={name} value={opt.v} checked={value === opt.v}
          onChange={() => onChange(opt.v)} className="sr-only" />
        {opt.label}
      </label>
    ))}
  </div>
);


export default PlanToggle