import { ChevronDown, ChevronUp } from 'lucide-react';
import MacroPanel from './MacroPanel';
import RecipeIngredientEditor from './RecipeIngredientEditor';
import { DAY_LABELS } from './orderUtils';

// A collapsible day block: recipe list + per-day macro overrides
const DayRecipeBlock = ({
  day,
  recipes       = [],
  allRecipes    = [],
  isExpanded    = false,
  onToggle,
  menuType,          // 'Lunch' | 'Dinner' | 'Family'
  isFamilyClient,
  // recipe editing
  onAddRecipe,
  onUpdateRecipe,
  onRemoveRecipe,
  // ingredient overrides
  recipeIngredients  = {},
  ingredientOverrides = {},
  onOverrideChange,
  // macro overrides
  getEffectiveMacros,
  isDayOverridden,
  onUpdateDayMacro,
  onResetDayMacro,
  // extras (personal orders)
  extraMealTypes     = {},
  onExtraMealTypeChange,
}) => {
  const hasRecipes    = recipes.some(r => r.recipe_id);
  const macroClasses  = menuType === 'both'
    ? ['Lunch', 'Dinner']
    : menuType === 'Family' ? [] : [menuType];

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 text-sm">{DAY_LABELS[day]}</span>
          {day === 'Friday' && isFamilyClient && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Día de entrega
            </span>
          )}
          {hasRecipes && (
            <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded-full font-medium">
              {recipes.filter(r => r.recipe_id).length} receta{recipes.filter(r => r.recipe_id).length !== 1 ? 's' : ''}
            </span>
          )}
          {!isFamilyClient && macroClasses.some(cls => isDayOverridden?.(day, cls)) && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Macros modificados
            </span>
          )}
        </div>
        {isExpanded
          ? <ChevronUp  size={16} className="text-slate-400" />
          : <ChevronDown size={16} className="text-slate-400" />
        }
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Recipe list */}
          <div className="space-y-2">
            {recipes.map((item, index) => (
              <div key={`${day}-${index}`} className="space-y-1">
                <div className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">

                  {/* Recipe selector or static label */}
                  {isFamilyClient || item.isExtra || !item.recipe_name ? (
                    <select
                      value={item.recipe_id || ''}
                      onChange={(e) => onUpdateRecipe(day, index, 'recipe_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                    >
                      <option value="">Seleccionar receta</option>
                      {allRecipes.map(r => (
                        <option key={r.id_recipe} value={r.id_recipe}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="flex-1 text-sm text-slate-700 px-3 py-2">{item.recipe_name}</span>
                  )}

                  {/* Lunch/Dinner toggle for extras on 'both' menu */}
                  {!isFamilyClient && item.isExtra && menuType === 'both' && onExtraMealTypeChange && (
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 shrink-0 text-xs font-medium">
                      {['Lunch','Dinner'].map(cls => {
                        const current = extraMealTypes[`${day}-${index}`] ?? 'Lunch';
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => onExtraMealTypeChange(`${day}-${index}`, cls)}
                            className={`px-2 py-1.5 transition ${
                              current === cls
                                ? cls === 'Lunch' ? 'bg-amber-400 text-white' : 'bg-indigo-500 text-white'
                                : 'bg-white text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {cls === 'Lunch' ? '☀️' : '🌙'}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Quantity */}
                  <input
                    type="number" min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateRecipe(day, index, 'quantity', e.target.value)}
                    className="w-16 px-2 py-1.5 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => onRemoveRecipe(day, index)}
                    className="text-red-400 hover:text-red-600 transition p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Ingredient override editor */}
                {item.recipe_id && (
                  <RecipeIngredientEditor
                    recipeName={item.recipe_name}
                    baseIngredients={recipeIngredients[item.recipe_id] ?? { protein: [], carb: [], extra: [] }}
                    value={ingredientOverrides[`${day}-${index}`] ?? null}
                    onChange={(val) => onOverrideChange(day, index, val)}
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => onAddRecipe(day)}
              className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition mt-1"
            >
              + {isFamilyClient ? 'Agregar receta' : 'Agregar receta extra'}
            </button>
          </div>

          {/* Per-day macro overrides (personal only) */}
          {!isFamilyClient && macroClasses.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <div className={`grid gap-3 ${macroClasses.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {macroClasses.map(cls => (
                  <MacroPanel
                    key={cls}
                    label={cls === 'Lunch' ? '☀️ Almuerzo' : '🌙 Cena'}
                    colorClass={cls === 'Lunch' ? 'amber' : 'indigo'}
                    macros={getEffectiveMacros(day, cls)}
                    overridden={isDayOverridden?.(day, cls)}
                    onUpdate={(field, value) => onUpdateDayMacro(day, cls, field, value)}
                    onReset={() => onResetDayMacro(day, cls)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DayRecipeBlock;
