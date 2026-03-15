import { useState } from 'react';
import { Clock, Truck, CheckCircle } from 'lucide-react';
import RecipeProductionCard from './RecipeProductionCard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildEffectiveIngredients = (overrides, baseIngredients) => {
  if (overrides && overrides.length > 0) {
    const result = { protein: [], carb: [], extra: [] };
    for (const o of overrides) {
      if (result[o.category]) result[o.category].push(o.name);
    }
    return { ingredients: result, isOverridden: true };
  }
  const result = { protein: [], carb: [], extra: [] };
  for (const ing of baseIngredients ?? []) {
    if (result[ing.category]) result[ing.category].push(ing.name);
  }
  return { ingredients: result, isOverridden: false };
};

const ingredientFingerprint = (ingredients) =>
  ['carb', 'extra', 'protein']
    .map((cat) => `${cat}:${[...(ingredients[cat] ?? [])].sort().join(',')}`)
    .join('|');

export const groupByRecipe = (orderDays) => {
  const grouped = {};

  for (const orderDay of orderDays) {
    if (!orderDay.orders?.clients) continue;

    const clientName     = orderDay.orders.clients.name;
    const classification = orderDay.orders.classification;

    for (const detail of orderDay.order_day_details ?? []) {
      const recipe    = detail.recipes;
      const recipeId  = recipe?.id_recipe;
      const recipeName = recipe?.name ?? '(sin nombre)';

      const { ingredients, isOverridden } = buildEffectiveIngredients(
        detail.order_day_recipe_overrides,
        recipe?.recipe_ingredients,
      );
      const fingerprint = ingredientFingerprint(ingredients);
      const variantKey  = `${recipeId}__${fingerprint}`;

      if (!grouped[variantKey]) {
        grouped[variantKey] = {
          recipe_name:          recipeName,
          isOverridden,
          effectiveIngredients: ingredients,
          totalUnits:           0,
          clients:              {},
        };
      }

      const g = grouped[variantKey];
      const qty = detail.quantity ?? 1;
      g.totalUnits += qty;

      if (!g.clients[clientName]) {
        g.clients[clientName] = { clientName, totalQuantity: 0, meals: {} };
      }

      const mealKey = classification;
      if (!g.clients[clientName].meals[mealKey]) {
        g.clients[clientName].meals[mealKey] = {
          classification,
          quantity:    0,
          orderDayIds: new Set(),
          protein:     detail.protein_value_applied,
          proteinUnit: detail.protein_unit_applied,
          carb:        detail.carb_value_applied,
          carbUnit:    detail.carb_unit_applied,
        };
      }

      const m = g.clients[clientName].meals[mealKey];
      m.quantity += qty;
      // Macros are per-unit — multiply by quantity
      const pVal = parseFloat(detail.protein_value_applied);
      const cVal = parseFloat(detail.carb_value_applied);
      if (!isNaN(pVal)) {
        g.totalProtein     = (g.totalProtein     ?? 0) + pVal * qty;
        g.totalProteinUnit = detail.protein_unit_applied ?? g.totalProteinUnit ?? 'g';
      }
      if (!isNaN(cVal)) {
        g.totalCarb     = (g.totalCarb     ?? 0) + cVal * qty;
        g.totalCarbUnit = detail.carb_unit_applied ?? g.totalCarbUnit ?? 'g';
      }
      m.orderDayIds.add(orderDay.id_order_day);
    }
  }

  // Serialise Sets → arrays, dicts → arrays
  for (const v of Object.values(grouped)) {
    v.clients = Object.values(v.clients).map((c) => ({
      ...c,
      totalQuantity: Object.values(c.meals).reduce((s, m) => s + m.quantity, 0),
      meals: Object.values(c.meals).map((m) => ({
        ...m,
        orderDayIds: [...m.orderDayIds],
      })),
    }));
  }

  return grouped;
};

// ── Component ─────────────────────────────────────────────────────────────────

const CocinaView = ({ orderDays, onPack, DAY_LABELS }) => {
  const [expandedRecipes, setExpandedRecipes] = useState({});

  const grouped       = groupByRecipe(orderDays);
  const totalPending  = orderDays.length;
  const totalUnitsAll = Object.values(grouped).reduce((s, r) => s + r.totalUnits, 0);

  const toggle = (key) => setExpandedRecipes((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Clock className="text-amber-500" size={20} />}    label="Pedidos pendientes" value={totalPending} />
        <StatCard icon={<Truck className="text-blue-500" size={20} />}     label="Total unidades"     value={totalUnitsAll} />
        <StatCard icon={<CheckCircle className="text-green-500" size={20} />} label="Recetas distintas" value={Object.keys(grouped).length} />
      </div>

      {/* Cards */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
          <p>Todo empacado para este día</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([variantKey, recipe]) => (
            <RecipeProductionCard
              key={variantKey}
              variantKey={variantKey}
              recipe={recipe}
              isExpanded={expandedRecipes[variantKey] ?? false}
              onToggle={toggle}
              onPack={onPack}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 flex items-center gap-4">
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

export default CocinaView;