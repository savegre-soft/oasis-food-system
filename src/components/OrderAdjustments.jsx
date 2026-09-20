import { RefreshCw } from 'lucide-react';
import MacroPanel from './MacroPanel';
import RouteSelector from './RouteSelector';
import DayRecipeBlock from './DayRecipeBlock';
import { DAYS_ORDER, MACRO_UNIT, MEAL_META, STANDARD_MACRO, mealLabel, mealTypesOf } from './orderUtils';

// Clases completas (no interpoladas) para que Tailwind las detecte.
const STANDARD_ACTIVE = {
  Breakfast: 'bg-sky-500 text-white border-sky-500',
  Lunch: 'bg-amber-500 text-white border-amber-500',
  Dinner: 'bg-indigo-500 text-white border-indigo-500',
};
const STANDARD_IDLE = {
  Breakfast:
    'border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30',
  Lunch:
    'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30',
  Dinner:
    'border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
};

// Helper: are the current macros equal to standard values?
const isStandard = (m) =>
  m &&
  String(m.protein_value) === String(STANDARD_MACRO.protein_value) &&
  String(m.carb_value) === String(STANDARD_MACRO.carb_value);

// Shared "step 3" UI: route selector + base macros + per-day recipe blocks
// Used by both AddOrder (step 3) and EditOrder (single view)
const OrderAdjustments = ({
  // Client / menu context
  isFamilyClient,
  menuType, // 'Breakfast' | 'Lunch' | 'Dinner' | 'both' | 'Family'

  // Route
  resolvedRoute,
  allRoutes,
  onRouteChange,
  showRouteChange = true,

  // Base macros
  macrosByType, // { Breakfast, Lunch, Dinner } — macros base de cada tiempo de comida
  onUpdateMacro, // (type, field, value) => void
  onResetAllDayMacros,
  getEffectiveMacros,
  isDayOverridden,
  onUpdateDayMacro,
  onResetDayMacro,

  // Day recipes (from useDayRecipes hook)
  dayRecipes,
  allRecipes,
  recipeIngredients,
  ingredientOverrides,
  expandedDays,
  onAddRecipe,
  onUpdateRecipe,
  onRemoveRecipe,
  onOverrideChange,
  onToggleDay,

  // Macro quick-set helpers
  clientMacros, // { Breakfast, Lunch, Dinner } — perfiles crudos del cliente (botón "Del cliente")
  onApplyStandard, // (type) => void — macros estándar
  onApplyClient, // (type) => void — restaurar macros del perfil del cliente

  // Extras (AddOrder-specific)
  extraMealTypes = {},
  onExtraMealTypeChange,

  // Portal de clientes: días que ya pasaron el corte de edición (solo lectura),
  // si se muestra el editor de composición de ingredientes, y si se permite
  // editar macros (el cliente ve sus macros pero no los edita, RF-PC-02).
  closedDays,
  showIngredientEditor = true,
  hideMacroEditor = false,
}) => {
  const macroTypes = mealTypesOf(menuType).filter((t) => macrosByType?.[t]);

  return (
    <div className="space-y-5">
      {/* Route */}
      {showRouteChange && (
        <RouteSelector
          resolvedRoute={resolvedRoute}
          allRoutes={allRoutes}
          onChange={onRouteChange}
          readOnly={isFamilyClient}
        />
      )}

      {/* Resolved route info (read-only banner, shown when not editable) */}
      {!showRouteChange && resolvedRoute && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">
            Ruta asignada
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{resolvedRoute.name}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {(resolvedRoute.route_delivery_days ?? []).map((d, i) => (
              <span
                key={i}
                className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full"
              >
                {d.day_of_week}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Base macros */}
      {!hideMacroEditor && !isFamilyClient && macroTypes.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Macros del pedido</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Base por tipo de comida. Puedes sobreescribir por día.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetAllDayMacros}
              className="text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 transition flex items-center gap-1"
            >
              <RefreshCw size={12} /> Resetear días
            </button>
          </div>

          {/* Quick-set macro buttons per column */}
          <div className={`grid gap-3 ${macroTypes.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {macroTypes.map((type) => {
              const macros = macrosByType[type];
              const clientMacro = clientMacros?.[type];
              return (
                <div key={type} className="space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {clientMacro && onApplyClient && (
                      <button
                        type="button"
                        onClick={() => onApplyClient(type)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          !isStandard(macros) &&
                          String(macros?.protein_value) === String(clientMacro.protein_value) &&
                          String(macros?.carb_value) === String(clientMacro.carb_value)
                            ? 'bg-green-800 dark:bg-green-600 text-white border-green-800 dark:border-green-600'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        👤 Del cliente
                      </button>
                    )}
                    {onApplyStandard && (
                      <button
                        type="button"
                        onClick={() => onApplyStandard(type)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          isStandard(macros) ? STANDARD_ACTIVE[type] : STANDARD_IDLE[type]
                        }`}
                      >
                        ⭐ Estándar ({STANDARD_MACRO.protein_value}/{STANDARD_MACRO.carb_value}{' '}
                        {MACRO_UNIT})
                      </button>
                    )}
                  </div>
                  <MacroPanel
                    label={mealLabel(type)}
                    colorClass={MEAL_META[type].color}
                    macros={macros}
                    onUpdate={(field, value) => onUpdateMacro(type, field, value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-day recipe blocks */}
      <div className="space-y-2">
        {DAYS_ORDER.map((day) => (
          <DayRecipeBlock
            key={day}
            day={day}
            recipes={dayRecipes[day] ?? []}
            allRecipes={allRecipes}
            isExpanded={expandedDays[day] ?? false}
            onToggle={() => onToggleDay(day)}
            menuType={menuType}
            isFamilyClient={isFamilyClient}
            onAddRecipe={onAddRecipe}
            onUpdateRecipe={onUpdateRecipe}
            onRemoveRecipe={onRemoveRecipe}
            recipeIngredients={recipeIngredients}
            ingredientOverrides={ingredientOverrides}
            onOverrideChange={onOverrideChange}
            showIngredientEditor={showIngredientEditor}
            getEffectiveMacros={getEffectiveMacros}
            isDayOverridden={isDayOverridden}
            onUpdateDayMacro={onUpdateDayMacro}
            onResetDayMacro={onResetDayMacro}
            extraMealTypes={extraMealTypes}
            onExtraMealTypeChange={onExtraMealTypeChange}
            readOnly={closedDays?.has(day) ?? false}
            hideMacroEditor={hideMacroEditor}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderAdjustments;
