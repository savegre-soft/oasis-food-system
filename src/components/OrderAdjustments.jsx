import { RefreshCw } from 'lucide-react';
import MacroPanel from './MacroPanel';
import RouteSelector from './RouteSelector';
import DayRecipeBlock from './DayRecipeBlock';
import { DAYS_ORDER } from './orderUtils';

// Shared "step 3" UI: route selector + base macros + per-day recipe blocks
// Used by both AddOrder (step 3) and EditOrder (single view)
const OrderAdjustments = ({
  // Client / menu context
  isFamilyClient,
  menuType,           // 'Lunch' | 'Dinner' | 'both' | 'Family'

  // Route
  resolvedRoute,
  allRoutes,
  onRouteChange,
  showRouteChange = true,

  // Base macros
  lunchMacros,
  dinnerMacros,
  onUpdateLunchMacro,
  onUpdateDinnerMacro,
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

  // Extras (AddOrder-specific)
  extraMealTypes       = {},
  onExtraMealTypeChange,
}) => {
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Ruta asignada</p>
          <p className="text-sm font-semibold text-slate-800">{resolvedRoute.name}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {(resolvedRoute.route_delivery_days ?? []).map((d, i) => (
              <span key={i} className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {d.day_of_week}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Base macros */}
      {!isFamilyClient && (lunchMacros || dinnerMacros) && (
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Macros del pedido</p>
              <p className="text-xs text-slate-400">Base por tipo de comida. Puedes sobreescribir por día.</p>
            </div>
            <button
              type="button"
              onClick={onResetAllDayMacros}
              className="text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition flex items-center gap-1"
            >
              <RefreshCw size={12} /> Resetear días
            </button>
          </div>

          <div className={`grid gap-3 ${menuType === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {lunchMacros && (menuType === 'Lunch' || menuType === 'both') && (
              <MacroPanel
                label="☀️ Almuerzo" colorClass="amber"
                macros={lunchMacros}
                onUpdate={onUpdateLunchMacro}
              />
            )}
            {dinnerMacros && (menuType === 'Dinner' || menuType === 'both') && (
              <MacroPanel
                label="🌙 Cena" colorClass="indigo"
                macros={dinnerMacros}
                onUpdate={onUpdateDinnerMacro}
              />
            )}
          </div>
        </div>
      )}

      {/* Per-day recipe blocks */}
      <div className="space-y-2">
        {DAYS_ORDER.map(day => (
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
            getEffectiveMacros={getEffectiveMacros}
            isDayOverridden={isDayOverridden}
            onUpdateDayMacro={onUpdateDayMacro}
            onResetDayMacro={onResetDayMacro}
            extraMealTypes={extraMealTypes}
            onExtraMealTypeChange={onExtraMealTypeChange}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderAdjustments;
