const StepMenu = ({
  menuType,
  setMenuType,
  lunchTemplates,
  dinnerTemplates,
  selectedLunchTemplate,
  setSelectedLunchTemplate,
  selectedDinnerTemplate,
  setSelectedDinnerTemplate,
}) => (
  <div className="space-y-5">
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de menú</label>
      <div className="flex gap-2">
        {[
          ['Lunch', '☀️ Almuerzo'],
          ['Dinner', '🌙 Cena'],
          ['both', '☀️🌙 Ambos'],
        ].map(([val, lbl]) => (
          <button
            key={val}
            type="button"
            onClick={() => setMenuType(val)}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
              menuType === val
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>

    {(menuType === 'Lunch' || menuType === 'both') && (
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Plantilla de Almuerzo
        </label>
        <div className="space-y-2">
          {lunchTemplates.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
          ) : (
            lunchTemplates.map((t) => (
              <button
                key={t.id_template}
                type="button"
                onClick={() => setSelectedLunchTemplate(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                  selectedLunchTemplate?.id_template === t.id_template
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      </div>
    )}

    {(menuType === 'Dinner' || menuType === 'both') && (
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Plantilla de Cena
        </label>
        <div className="space-y-2">
          {dinnerTemplates.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
          ) : (
            dinnerTemplates.map((t) => (
              <button
                key={t.id_template}
                type="button"
                onClick={() => setSelectedDinnerTemplate(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                  selectedDinnerTemplate?.id_template === t.id_template
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      </div>
    )}
  </div>
);

export default StepMenu;
