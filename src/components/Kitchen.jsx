import { useState, useMemo } from 'react';
import { Clock, Truck, CheckCircle, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import RecipeProductionCard from './RecipeProductionCard';
import { MACRO_UNIT } from './orderUtils';

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

      const mealKey = orderDay.id_order_day;
      if (!g.clients[clientName].meals[mealKey]) {
        g.clients[clientName].meals[mealKey] = {
          id_order_day: orderDay.id_order_day,
          id_order_day_detail: detail.id_order_day_detail,
          day_of_week: orderDay.day_of_week,
          classification,
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
const groupByOrder = (orderDays, { filterStatus = null } = {}) => {
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
        classification,
        isOverridden,
        ingredients,
      });
    }
  }

  return Object.values(grouped).sort((a, b) => a.clientName.localeCompare(b.clientName));
};

// ── ClassificationBadge ───────────────────────────────────────────────────────

const ClassificationBadge = ({ classification }) => {
  if (classification === 'Breakfast')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
        🌅 Desayuno
      </span>
    );
  if (classification === 'Lunch')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        ☀️ Almuerzo
      </span>
    );
  if (classification === 'Dinner')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
        🌙 Cena
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
      {classification === 'Family' ? '👨‍👩‍👧 Familiar' : classification}
    </span>
  );
};

// ── IngredientBadges ──────────────────────────────────────────────────────────

const CATEGORY_STYLE = {
  protein: { badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  carb: { badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  extra: { badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
};

const IngredientBadges = ({ ingredients }) => {
  const hasAny = ['protein', 'carb', 'extra'].some((c) => (ingredients?.[c] ?? []).length > 0);
  if (!hasAny) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {['protein', 'carb', 'extra'].map((cat) =>
        (ingredients?.[cat] ?? []).map((item, i) => (
          <span
            key={`${cat}-${i}`}
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CATEGORY_STYLE[cat].badge}`}
          >
            {item}
          </span>
        ))
      )}
    </div>
  );
};

// ── OrderProductionCard ───────────────────────────────────────────────────────

const OrderProductionCard = ({ order, onPackDetail, selectedIds, onToggleId, onToggleIds, DAY_LABELS }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const orderAllIds = useMemo(() => order.dishes.map((d) => d.id_order_day_detail), [order.dishes]);
  const orderAllSelected =
    onToggleIds && orderAllIds.length > 0 && orderAllIds.every((id) => selectedIds?.has(id));
  const orderSomeSelected =
    onToggleIds && !orderAllSelected && orderAllIds.some((id) => selectedIds?.has(id));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        {onToggleIds && (
          <input
            type="checkbox"
            checked={orderAllSelected}
            ref={(el) => { if (el) el.indeterminate = orderSomeSelected; }}
            onChange={() => onToggleIds(orderAllIds)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-400 cursor-pointer shrink-0"
          />
        )}
        <button
          type="button"
          onClick={() => setIsExpanded((p) => !p)}
          className="flex items-center gap-4 flex-1 min-w-0 text-left"
        >
          <div className="text-white rounded-xl px-3 py-1.5 text-sm font-bold min-w-[48px] text-center shrink-0 bg-slate-800">
            {order.totalUnits}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{order.clientName}</p>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full">
                #{order.id_order}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {order.dishes.length} plato{order.dishes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {order.dishes.length > 1 && (
            <button
              type="button"
              onClick={() => onPackDetail(orderAllIds)}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-xl transition"
            >
              <Archive size={12} />
              Empacar todo
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((p) => !p)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition p-1"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Platos */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
          {order.dishes.map((dish, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {onToggleId && (
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(dish.id_order_day_detail) ?? false}
                      onChange={() => onToggleId([dish.id_order_day_detail])}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-400 cursor-pointer shrink-0"
                    />
                  )}
                  {dish.quantity > 1 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      ×{dish.quantity}
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {DAY_LABELS?.[dish.day_of_week] ?? dish.day_of_week}
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {dish.recipe_name}
                  </p>
                  {dish.isOverridden && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                      variante
                    </span>
                  )}
                  <ClassificationBadge classification={dish.classification} />
                </div>
                {dish.ingredients && (
                  <div className="mt-1.5 ml-0">
                    <IngredientBadges ingredients={dish.ingredients} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onPackDetail(dish.id_order_day_detail)}
                className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 px-3 py-1.5 rounded-xl transition shrink-0"
              >
                <Archive size={12} />
                Empacar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const CocinaView = ({ orderDays, onPack, onPackDetail, DAY_LABELS }) => {
  const [expandedRecipes, setExpandedRecipes] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('recipe'); // 'recipe' | 'order'

  const grouped = useMemo(() => groupByRecipe(orderDays, { filterStatus: 'PENDING' }), [orderDays]);
  const groupedByOrder = useMemo(
    () => groupByOrder(orderDays, { filterStatus: 'PENDING' }),
    [orderDays]
  );
  const totalPending = orderDays.length;
  const totalUnitsAll = Object.values(grouped).reduce((s, r) => s + r.totalUnits, 0);

  const toggle = (key) => setExpandedRecipes((p) => ({ ...p, [key]: !p[key] }));

  // Each detail is unique per recipe group, no deduplication needed
  const allMealIds = useMemo(
    () => Object.values(grouped).flatMap((r) =>
      r.clients.flatMap((c) => c.meals.map((m) => m.id_order_day_detail))
    ),
    [grouped]
  );
  const allSelected = allMealIds.length > 0 && allMealIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && allMealIds.some((id) => selectedIds.has(id));

  const toggleMeal = (ids) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allIn = ids.every((id) => next.has(id));
      ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
      return next;
    });

  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(allMealIds));
  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Clock className="text-amber-500 dark:text-amber-400" size={20} />}
          label="Pedidos pendientes"
          value={totalPending}
        />
        <StatCard
          icon={<Truck className="text-blue-500 dark:text-blue-400" size={20} />}
          label="Total unidades"
          value={totalUnitsAll}
        />
        <StatCard
          icon={<CheckCircle className="text-green-500 dark:text-green-400" size={20} />}
          label="Recetas distintas"
          value={Object.keys(grouped).length}
        />
      </div>

      {/* Cards */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
          <p>Todo empacado para este día</p>
        </div>
      ) : (
        <>
          {/* View toggle */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('recipe')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'recipe'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Por receta
            </button>
            <button
              type="button"
              onClick={() => setViewMode('order')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'order'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Por orden
            </button>
          </div>

          {/* Barra combinada: seleccionar todos / acciones masivas */}
          <div
            className={`rounded-2xl px-5 py-3 flex items-center gap-3 transition-colors ${
              selectedIds.size > 0
                ? 'bg-slate-800 dark:bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-400 cursor-pointer"
              />
              <span className="text-sm font-medium">
                {selectedIds.size > 0
                  ? `${selectedIds.size} seleccionado${selectedIds.size !== 1 ? 's' : ''}`
                  : 'Seleccionar todos'}
              </span>
            </label>
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => { onPackDetail([...selectedIds]); clearSelection(); }}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition ml-auto"
                >
                  <Archive size={13} />
                  Empacar seleccionados
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-white/60 hover:text-white transition text-lg leading-none px-1"
                >
                  ✕
                </button>
              </>
            )}
          </div>

          {viewMode === 'recipe' ? (
            <div className="space-y-4">
              {Object.entries(grouped)
                .sort(([, a], [, b]) => a.recipe_name.localeCompare(b.recipe_name))
                .map(([variantKey, recipe]) => (
                  <RecipeProductionCard
                    key={variantKey}
                    variantKey={variantKey}
                    recipe={recipe}
                    isExpanded={expandedRecipes[variantKey] ?? false}
                    onToggle={toggle}
                    onPack={onPack}
                    onPackDetail={onPackDetail}
                    selectedIds={selectedIds}
                    onToggleMeal={toggleMeal}
                  />
                ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByOrder.map((order) => (
                <OrderProductionCard
                  key={order.id_order}
                  order={order}
                  onPackDetail={onPackDetail}
                  selectedIds={selectedIds}
                  onToggleId={toggleMeal}
                  onToggleIds={toggleMeal}
                  DAY_LABELS={DAY_LABELS}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

export default CocinaView;
