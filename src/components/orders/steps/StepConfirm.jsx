import { Zap } from 'lucide-react';
import { DAYS_ORDER, DAY_LABELS, DAY_SHORT } from '../../orderUtils';

const StepConfirm = ({
  selectedClient,
  familyClient,
  isExpress,
  weekStart,
  weekEnd,
  menuType,
  expressType,
  selectedFamilyTemplate,
  resolvedRoute,
  expressMacros,
  lunchMacros,
  dinnerMacros,
  expressRecipes,
  dayRecipes,
  ingredientOverrides,
  recipeIngredients,
}) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
    {/* Client + tags */}
    <div className="flex items-center gap-2">
      <p className="font-semibold text-slate-800">{selectedClient?.name}</p>
      <span
        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
          familyClient ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
        }`}
      >
        {familyClient ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
      </span>
      {isExpress && (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
          <Zap size={10} /> Express
        </span>
      )}
    </div>

    {/* Week */}
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Semana</p>
      <p className="text-sm text-slate-700">
        {weekStart.toLocaleDateString('es-CR')} — {weekEnd.toLocaleDateString('es-CR')}
      </p>
    </div>

    {/* Menu */}
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Menú</p>
      <p className="text-sm text-slate-700">
        {isExpress
          ? expressType === 'Lunch'
            ? '☀️ Almuerzo Express'
            : '🌙 Cena Express'
          : familyClient
            ? selectedFamilyTemplate?.name
              ? `Familiar — ${selectedFamilyTemplate.name}`
              : 'Familiar'
            : menuType === 'both'
              ? 'Almuerzo + Cena'
              : menuType === 'Lunch'
                ? 'Solo Almuerzo'
                : 'Solo Cena'}
      </p>
    </div>

    {/* Express recipes */}
    {isExpress && expressRecipes.filter((r) => r.recipe_id).length > 0 && (
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Recetas</p>
        <div className="space-y-1">
          {expressRecipes
            .filter((r) => r.recipe_id)
            .map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  ×{r.quantity}
                </span>
                <span className="text-sm text-slate-700">{r.recipe_name || 'Receta'}</span>
              </div>
            ))}
        </div>
      </div>
    )}

    {/* Route */}
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Ruta</p>
      <p className="text-sm font-medium text-slate-800">
        {isExpress ? '⚡ Entrega hoy (sin ruta)' : (resolvedRoute?.name ?? 'Sin ruta')}
      </p>
      {resolvedRoute?.route_delivery_days?.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {resolvedRoute.route_delivery_days.map((d, i) => (
            <span key={i} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {DAY_LABELS[d.day_of_week]}
            </span>
          ))}
        </div>
      )}
    </div>

    {/* Express macros */}
    {isExpress && expressMacros?.protein_value && (
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Macros</p>
        <p className="text-sm text-slate-700">
          {expressType === 'Lunch' ? '☀️' : '🌙'} {expressMacros.protein_value}
          {expressMacros.protein_unit} prot · {expressMacros.carb_value}
          {expressMacros.carb_unit} carbos
        </p>
      </div>
    )}

    {/* Personal macros */}
    {!familyClient && !isExpress && (lunchMacros || dinnerMacros) && (
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Macros globales</p>
        <p className="text-sm text-slate-700">
          {(menuType === 'Lunch' || menuType === 'both') && lunchMacros && (
            <span>
              ☀️ {lunchMacros.protein_value}
              {lunchMacros.protein_unit} prot · {lunchMacros.carb_value}
              {lunchMacros.carb_unit} carbos
            </span>
          )}
          {(menuType === 'Dinner' || menuType === 'both') && dinnerMacros && (
            <span className={menuType === 'both' ? 'ml-2' : ''}>
              🌙 {dinnerMacros.protein_value}
              {dinnerMacros.protein_unit} prot · {dinnerMacros.carb_value}
              {dinnerMacros.carb_unit} carbos
            </span>
          )}
        </p>
      </div>
    )}

    {/* Days with recipes */}
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
        Días con recetas
      </p>
      <div className="space-y-2">
        {DAYS_ORDER.filter((d) => (dayRecipes[d] ?? []).some((r) => r.recipe_id)).map((day) => (
          <div key={day} className="flex items-start gap-2">
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium min-w-[48px] text-center shrink-0 mt-0.5">
              {DAY_SHORT[day]}
            </span>
            <div className="space-y-1.5 flex-1">
              {dayRecipes[day]
                .filter((r) => r.recipe_id)
                .map((r, idx) => {
                  const ov = ingredientOverrides[`${day}-${idx}`];
                  const base = recipeIngredients[String(r.recipe_id)] ?? {
                    protein: [],
                    carb: [],
                    extra: [],
                  };
                  const ings = ov ?? base;
                  const hasIngs = ['protein', 'carb', 'extra'].some(
                    (c) => (ings[c] ?? []).length > 0
                  );
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-slate-700">
                          {r.recipe_name || 'Receta'}
                        </span>
                        {r.quantity > 1 && (
                          <span className="text-xs text-slate-400">×{r.quantity}</span>
                        )}
                        {ov && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                            modificada
                          </span>
                        )}
                      </div>
                      {hasIngs && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(ings.protein ?? []).map((n, i) => (
                            <span key={'p' + i} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                              {n}
                            </span>
                          ))}
                          {(ings.carb ?? []).map((n, i) => (
                            <span key={'c' + i} className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                              {n}
                            </span>
                          ))}
                          {(ings.extra ?? []).map((n, i) => (
                            <span key={'e' + i} className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default StepConfirm;
