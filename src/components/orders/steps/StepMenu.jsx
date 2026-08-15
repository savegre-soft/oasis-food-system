const StepMenu = ({
  menuType,
  setMenuType,
  lunchTemplates,
  dinnerTemplates,
  selectedLunchTemplate,
  setSelectedLunchTemplate,
  selectedDinnerTemplate,
  setSelectedDinnerTemplate,
  weekTemplateIds = { lunch: null, dinner: null },
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
        <p className="text-xs text-slate-400 mb-2">
          Se preselecciona la plantilla de la semana en curso — elegí otra si hace falta para este
          pedido puntual.
        </p>
        <div className="space-y-2">
          {lunchTemplates.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
          ) : (
            lunchTemplates.map((t) => (
              <button
                key={t.id_template}
                type="button"
                onClick={() => setSelectedLunchTemplate(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition flex items-center justify-between gap-2 ${
                  selectedLunchTemplate?.id_template === t.id_template
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {t.name}
                {weekTemplateIds.lunch === t.id_template && (
                  <span className="text-[10px] font-medium bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0">
                    Semana actual
                  </span>
                )}
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
        <p className="text-xs text-slate-400 mb-2">
          Se preselecciona la plantilla de la semana en curso — elegí otra si hace falta para este
          pedido puntual.
        </p>
        <div className="space-y-2">
          {dinnerTemplates.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
          ) : (
            dinnerTemplates.map((t) => (
              <button
                key={t.id_template}
                type="button"
                onClick={() => setSelectedDinnerTemplate(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition flex items-center justify-between gap-2 ${
                  selectedDinnerTemplate?.id_template === t.id_template
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {t.name}
                {weekTemplateIds.dinner === t.id_template && (
                  <span className="text-[10px] font-medium bg-indigo-500 text-white px-2 py-0.5 rounded-full shrink-0">
                    Semana actual
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    )}
  </div>
);

export default StepMenu;
