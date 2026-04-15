import { MACRO_UNIT } from '../orderUtils';

// ── Sub-components ─────────────────────────────────────────────────────────────

const MacroPanel = ({ label, accent, macro }) => {
  if (!macro) return null;
  const colors = {
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };
  const c = colors[accent];
  return (
    <div className={'rounded-xl  p-4 ' + c.border + ' ' + c.bg}>
      <p className={'text-xs font-semibold mb-3 ' + c.text}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Proteína</p>
          <p className="text-sm font-semibold text-slate-800">
            {macro.protein_value} {MACRO_UNIT}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Carbohidratos</p>
          <p className="text-sm font-semibold text-slate-800">
            {macro.carb_value} {MACRO_UNIT}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MacroPanel;
