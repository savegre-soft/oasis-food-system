import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import MacroPanel from './MacroPanel';
import RecipeIngredientEditor from './RecipeIngredientEditor';
import { DAY_LABELS, MEAL_META, mealLabel, mealTypesOf } from './orderUtils';

// Clases completas (no interpoladas) para que Tailwind las detecte.
const EXTRA_ACTIVE = {
  Breakfast: 'bg-sky-400 text-white',
  Lunch: 'bg-amber-400 text-white',
  Dinner: 'bg-indigo-500 text-white',
};

// A collapsible day block: recipe list + per-day macro overrides
const DayRecipeBlock = ({
  day,
  recipes = [],
  allRecipes = [],
  isExpanded = false,
  onToggle,
  menuType, // 'Breakfast' | 'Lunch' | 'Dinner' | 'both' | 'Family'
  isFamilyClient,
  // recipe editing
  onAddRecipe,
  onUpdateRecipe,
  onRemoveRecipe,
  // ingredient overrides
  recipeIngredients = {},
  ingredientOverrides = {},
  onOverrideChange,
  showIngredientEditor = true,
  // macro overrides
  getEffectiveMacros,
  isDayOverridden,
  onUpdateDayMacro,
  onResetDayMacro,
  // extras (personal orders)
  extraMealTypes = {},
  onExtraMealTypeChange,
  // solo lectura (ej. portal de clientes, día ya fuera del corte de edición)
  readOnly = false,
  hideMacroEditor = false,
}) => {
  const [expandedOverrides, setExpandedOverrides] = useState({});
  const [confirmPending, setConfirmPending] = useState({});
  const hasRecipes = recipes.some((r) => r.recipe_id);
  const macroClasses = mealTypesOf(menuType);

  const toggleOverride = (key) =>
    setExpandedOverrides((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleEditClick = (key, quantity) => {
    if (expandedOverrides[key]) {
      toggleOverride(key);
      return;
    }
    if (Number(quantity) > 1) {
      setConfirmPending((prev) => ({ ...prev, [key]: true }));
    } else {
      toggleOverride(key);
    }
  };

  const cancelConfirm = (key) => setConfirmPending((prev) => ({ ...prev, [key]: false }));

  const confirmEdit = (key) => {
    setConfirmPending((prev) => ({ ...prev, [key]: false }));
    toggleOverride(key);
  };

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 pl-4 pr-7 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            {DAY_LABELS[day]}
          </span>
          {day === 'Friday' && isFamilyClient && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
              Día de entrega
            </span>
          )}
          {readOnly && (
            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
              Cerrado
            </span>
          )}
          {hasRecipes && (
            <span className="text-xs bg-slate-800 dark:bg-slate-700 text-white px-2 py-0.5 rounded-full font-medium">
              {recipes.filter((r) => r.recipe_id).length} receta
              {recipes.filter((r) => r.recipe_id).length !== 1 ? 's' : ''}
            </span>
          )}
          {!isFamilyClient && macroClasses.some((cls) => isDayOverridden?.(day, cls)) && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Macros modificados
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
        )}
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white dark:bg-slate-900">
          {/* Recipe list */}
          <div className="space-y-2">
            {recipes.map((item, index) => (
              <div key={`${day}-${index}`} className="space-y-1">
                <div className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  {/* Recipe selector or static label */}
                  {readOnly ? (
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-700 dark:text-slate-300 px-3 py-2">
                      {item.recipe_name || 'Receta'}
                    </span>
                  ) : isFamilyClient || item.isExtra || !item.recipe_name ? (
                    <select
                      value={item.recipe_id || ''}
                      onChange={(e) => onUpdateRecipe(day, index, 'recipe_id', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-600"
                    >
                      <option value="">Seleccionar receta</option>
                      {allRecipes.map((r) => (
                        <option key={r.id_recipe} value={r.id_recipe}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-700 dark:text-slate-300 px-3 py-2">
                      {item.recipe_name}
                    </span>
                  )}

                  {/* Toggle de tiempo de comida para extras cuando el menú tiene más de uno */}
                  {!readOnly &&
                    !isFamilyClient &&
                    item.isExtra &&
                    macroClasses.length > 1 &&
                    onExtraMealTypeChange && (
                      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 text-xs font-medium">
                        {macroClasses.map((cls) => {
                          const current = extraMealTypes[`${day}-${index}`] ?? item.mealType ?? macroClasses[0];
                          return (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => onExtraMealTypeChange(`${day}-${index}`, cls)}
                              className={`px-2 py-1.5 transition ${
                                current === cls
                                  ? EXTRA_ACTIVE[cls]
                                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {MEAL_META[cls].emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Quantity */}
                  {readOnly ? (
                    <span className="w-16 shrink-0 text-sm text-center text-slate-500 dark:text-slate-400">
                      ×{item.quantity}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateRecipe(day, index, 'quantity', e.target.value)}
                      className="w-16 shrink-0 px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-center bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-600"
                    />
                  )}

                  {/* Edit ingredient options */}
                  {!readOnly && showIngredientEditor && item.recipe_id && (
                    <button
                      type="button"
                      onClick={() => handleEditClick(`${day}-${index}`, item.quantity)}
                      title="Editar ingredientes"
                      className={`shrink-0 p-1.5 rounded-lg transition ${
                        expandedOverrides[`${day}-${index}`] || ingredientOverrides[`${day}-${index}`]
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  {/* Remove */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onRemoveRecipe(day, index)}
                      className="shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Aviso: editar ingredientes afecta a todas las unidades de esta línea.
                    Se muestra tanto antes de abrir el editor (con confirmación) como mientras
                    está abierto si la cantidad es o pasa a ser mayor a 1 (p. ej. la suben
                    después de ya estar editando), para que no se les escape ese caso. */}
                {!readOnly &&
                  showIngredientEditor &&
                  item.recipe_id &&
                  Number(item.quantity) > 1 &&
                  (confirmPending[`${day}-${index}`] || expandedOverrides[`${day}-${index}`]) && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
                      <p className="flex-1">
                        Esta línea tiene {item.quantity} unidades de "{item.recipe_name}".{' '}
                        {expandedOverrides[`${day}-${index}`]
                          ? 'Los cambios de ingredientes se aplican a las'
                          : 'Editar los ingredientes aplicará el cambio a las'}{' '}
                        {item.quantity} recetas. Si querés editar solo 1 de {item.quantity},
                        agregala como una receta aparte (
                        {isFamilyClient ? '"+ Agregar receta"' : '"+ Agregar receta extra"'}) y
                        editá esa.
                      </p>
                      {!expandedOverrides[`${day}-${index}`] && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => cancelConfirm(`${day}-${index}`)}
                            className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmEdit(`${day}-${index}`)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500 transition"
                          >
                            Editar las {item.quantity}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                {/* Ingredient override editor */}
                {!readOnly &&
                  showIngredientEditor &&
                  item.recipe_id &&
                  expandedOverrides[`${day}-${index}`] && (
                    <RecipeIngredientEditor
                      recipeName={item.recipe_name}
                      baseIngredients={
                        recipeIngredients[item.recipe_id] ?? { protein: [], carb: [], extra: [] }
                      }
                      value={ingredientOverrides[`${day}-${index}`] ?? null}
                      onChange={(val) => onOverrideChange(day, index, val)}
                    />
                  )}
              </div>
            ))}

            {!readOnly && (
              <button
                type="button"
                onClick={() => onAddRecipe(day)}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 transition mt-1"
              >
                + {isFamilyClient ? 'Agregar receta' : 'Agregar receta extra'}
              </button>
            )}
          </div>

          {/* Per-day macro overrides (personal only) */}
          {!hideMacroEditor && !readOnly && !isFamilyClient && macroClasses.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <div
                className={`grid gap-3 ${macroClasses.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
              >
                {macroClasses.map((cls) => (
                  <MacroPanel
                    key={cls}
                    label={mealLabel(cls)}
                    colorClass={MEAL_META[cls].color}
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
