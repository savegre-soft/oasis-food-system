import { RefreshCw } from 'lucide-react';

const STANDARD_MACRO = { protein_value: 120, protein_unit: 'g', carb_value: 120, carb_unit: 'g' };

// Helper: are the current macros equal to standard values?
const isStandard = (m) => m && String(m.protein_value) === '120' && m.protein_unit === 'g' && String(m.carb_value) === '120' && m.carb_unit === 'g';
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

  // Macro quick-set helpers
  clientLunchMacro,     // raw macro profile from client (for "Del cliente" button)
  clientDinnerMacro,
  onApplyStandardLunch, // () => void  — set lunch macros to 120/120
  onApplyStandardDinner,
  onApplyClientLunch,   // () => void  — restore client profile macros
  onApplyClientDinner,

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
          <div className="flex items-center justify-between flex-wrap gap-2">
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

          {/* Quick-set macro buttons per column */}
          <div className={`grid gap-3 ${menuType === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Lunch quick-set */}
            {lunchMacros && (menuType === 'Lunch' || menuType === 'both') && (
              <div className="space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {clientLunchMacro && onApplyClientLunch && (
                    <button type="button" onClick={onApplyClientLunch}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        !isStandard(lunchMacros) && String(lunchMacros?.protein_value) === String(clientLunchMacro.protein_value)
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >👤 Del cliente</button>
                  )}
                  {onApplyStandardLunch && (
                    <button type="button" onClick={onApplyStandardLunch}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        isStandard(lunchMacros)
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >⭐ Estándar (120g)</button>
                  )}
                </div>
                <MacroPanel
                  label="☀️ Almuerzo" colorClass="amber"
                  macros={lunchMacros}
                  onUpdate={onUpdateLunchMacro}
                />
              </div>
            )}
            {/* Dinner quick-set */}
            {dinnerMacros && (menuType === 'Dinner' || menuType === 'both') && (
              <div className="space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {clientDinnerMacro && onApplyClientDinner && (
                    <button type="button" onClick={onApplyClientDinner}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        !isStandard(dinnerMacros) && String(dinnerMacros?.protein_value) === String(clientDinnerMacro.protein_value)
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >👤 Del cliente</button>
                  )}
                  {onApplyStandardDinner && (
                    <button type="button" onClick={onApplyStandardDinner}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        isStandard(dinnerMacros)
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >⭐ Estándar (120g)</button>
                  )}
                </div>
                <MacroPanel
                  label="🌙 Cena" colorClass="indigo"
                  macros={dinnerMacros}
                  onUpdate={onUpdateDinnerMacro}
                />
              </div>
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