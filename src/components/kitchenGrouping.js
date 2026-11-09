import { MACRO_UNIT } from './orderUtils';

// Agrupación de order_days para las vistas de cocina/producción. Separado de
// Kitchen.jsx (que solo exporta el componente CocinaView) porque mezclar
// exports de componente y de función rompe React Fast Refresh en ese archivo.

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

// filterStatus: when set, only details with that status are included (used by CocinaView
// to skip already-PACKED details of 'ambos' orders whose order_day is still PENDING).
export const groupByRecipe = (orderDays, { filterStatus = null } = {}) => {
  const grouped = {};

  for (const orderDay of orderDays) {
    if (!orderDay.orders?.clients) continue;

    const clientName = orderDay.orders.clients.name;
    const classification = orderDay.orders.classification;

    for (const detail of orderDay.order_day_details ?? []) {
      if (filterStatus && detail.status !== filterStatus) continue;
      const recipe = detail.recipes;
      const recipeId = recipe?.id_recipe;
      const recipeName = recipe?.name ?? '(sin nombre)';

      const { ingredients, isOverridden } = buildEffectiveIngredients(
        detail.order_day_recipe_overrides,
        recipe?.recipe_ingredients
      );
      const fingerprint = ingredientFingerprint(ingredients);
      const variantKey = `${recipeId}__${fingerprint}`;

      if (!grouped[variantKey]) {
        grouped[variantKey] = {
          recipe_name: recipeName,
          isOverridden,
          effectiveIngredients: ingredients,
          totalUnits: 0,
          totalProteinUnit: MACRO_UNIT,
          totalCarbUnit: MACRO_UNIT,
          clients: {},
        };
      }

      const g = grouped[variantKey];
      const qty = detail.quantity ?? 1;
      g.totalUnits += qty;

      if (!g.clients[clientName]) {
        g.clients[clientName] = { clientName, totalQuantity: 0, meals: {} };
      }

      // Clave por detail (no por order_day): un pedido con varios tiempos de
      // comida puede tener 2-3 detalles en el mismo día (ej. almuerzo + cena)
      // que antes se fusionaban en una sola "meal" si coincidían en receta,
      // perdiendo cuál era cuál.
      const mealKey = detail.id_order_day_detail;
      if (!g.clients[clientName].meals[mealKey]) {
        g.clients[clientName].meals[mealKey] = {
          id_order_day: orderDay.id_order_day,
          id_order_day_detail: detail.id_order_day_detail,
          day_of_week: orderDay.day_of_week,
          // meal_type es la fuente de verdad por plato (permite distinguir
          // almuerzo/cena/desayuno dentro de un mismo pedido); classification
          // de la orden completa solo sirve de respaldo para filas históricas
          // sin meal_type o pedidos de un solo tiempo de comida.
          classification: detail.meal_type ?? classification,
          quantity: 0,
          orderDayIds: new Set(),
          id_order: orderDay.orders?.id_order,
          protein: detail.protein_value_applied,
          proteinUnit: MACRO_UNIT,
          carb: detail.carb_value_applied,
          carbUnit: MACRO_UNIT,
        };
      }

      const m = g.clients[clientName].meals[mealKey];
      m.quantity += qty;
      // Macros are unit counts — multiply by quantity
      const pVal = parseFloat(detail.protein_value_applied);
      const cVal = parseFloat(detail.carb_value_applied);
      if (!isNaN(pVal)) {
        g.totalProtein = (g.totalProtein ?? 0) + pVal * qty;
      }
      if (!isNaN(cVal)) {
        g.totalCarb = (g.totalCarb ?? 0) + cVal * qty;
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

// Agrupación alternativa "por orden" (una tarjeta por pedido/cliente, con sus
// platos pendientes adentro) — mismo criterio que groupByOrder en Package.jsx,
// adaptado a la forma de datos de Cocina (solo detalles PENDING).
export const groupByOrder = (orderDays, { filterStatus = null } = {}) => {
  const grouped = {};

  for (const orderDay of orderDays) {
    if (!orderDay.orders?.clients) continue;

    const id_order = orderDay.orders.id_order;
    const clientName = orderDay.orders.clients.name;
    const classification = orderDay.orders.classification;

    for (const detail of orderDay.order_day_details ?? []) {
      if (filterStatus && detail.status !== filterStatus) continue;
      const recipe = detail.recipes;
      const recipeName = recipe?.name ?? '(sin nombre)';
      const qty = detail.quantity ?? 1;

      const { ingredients, isOverridden } = buildEffectiveIngredients(
        detail.order_day_recipe_overrides,
        recipe?.recipe_ingredients
      );

      if (!grouped[id_order]) {
        grouped[id_order] = {
          id_order,
          clientName,
          totalUnits: 0,
          dishes: [],
        };
      }

      const g = grouped[id_order];
      g.totalUnits += qty;
      g.dishes.push({
        id_order_day: orderDay.id_order_day,
        id_order_day_detail: detail.id_order_day_detail,
        day_of_week: orderDay.day_of_week,
        recipe_name: recipeName,
        quantity: qty,
        classification: detail.meal_type ?? classification,
        isOverridden,
        ingredients,
      });
    }
  }

  return Object.values(grouped).sort((a, b) => a.clientName.localeCompare(b.clientName));
};
