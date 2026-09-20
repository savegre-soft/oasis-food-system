import { MEAL_META, mealLabel, mealTypesOf } from '../../orderUtils';

// Clases completas (no interpoladas) para que Tailwind las detecte.
const SELECTED_STYLES = {
  Breakfast: 'bg-sky-50 border-sky-400 text-sky-900',
  Lunch: 'bg-amber-50 border-amber-400 text-amber-900',
  Dinner: 'bg-indigo-50 border-indigo-400 text-indigo-900',
};
const BADGE_STYLES = {
  Breakfast: 'bg-sky-500',
  Lunch: 'bg-amber-500',
  Dinner: 'bg-indigo-500',
};

const StepMenu = ({
  menuType,
  setMenuType,
  templatesByType,
  selectedTemplates,
  onSelectTemplate,
  weekTemplateIds,
}) => (
  <div className="space-y-5">
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de menú</label>
      <div className="flex gap-2">
        {[
          ['Breakfast', mealLabel('Breakfast')],
          ['Lunch', mealLabel('Lunch')],
          ['Dinner', mealLabel('Dinner')],
          ['both', '☀️🌙 Almuerzo + Cena'],
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

    {mealTypesOf(menuType).map((type) => (
      <div key={type}>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Plantilla de {MEAL_META[type].label}
        </label>
        <p className="text-xs text-slate-400 mb-2">
          Se preselecciona la plantilla de la semana en curso — elegí otra si hace falta para este
          pedido puntual.
        </p>
        <div className="space-y-2">
          {(templatesByType[type] ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
          ) : (
            templatesByType[type].map((t) => (
              <button
                key={t.id_template}
                type="button"
                onClick={() => onSelectTemplate(type, t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition flex items-center justify-between gap-2 ${
                  selectedTemplates[type]?.id_template === t.id_template
                    ? SELECTED_STYLES[type]
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {t.name}
                {weekTemplateIds[type] === t.id_template && (
                  <span
                    className={`text-[10px] font-medium ${BADGE_STYLES[type]} text-white px-2 py-0.5 rounded-full shrink-0`}
                  >
                    Semana actual
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    ))}
  </div>
);

export default StepMenu;
