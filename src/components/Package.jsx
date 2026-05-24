import { useState, useMemo } from 'react';
import { Truck, Archive, CheckCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';

// ── Ingredient helpers ────────────────────────────────────────────────────────

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

// ── Group by recipe with status ───────────────────────────────────────────────

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

const groupByRecipeForPackage = (allDays) => {
  const grouped = {};

  for (const orderDay of allDays) {
    if (!orderDay.orders?.clients) continue;
    const clientName = orderDay.orders.clients.name;
    const classification = orderDay.orders.classification;
    const status = orderDay.status;

    for (const detail of orderDay.order_day_details ?? []) {
      const recipe = detail.recipes;
      const recipeId = recipe?.id_recipe;
      const recipeName = recipe?.name ?? '(sin nombre)';
      const qty = detail.quantity ?? 1;

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
          packedUnits: 0,
          pendingUnits: 0,
          clients: {},
        };
      }

      const g = grouped[variantKey];
      g.totalUnits += qty;
      if (status === 'PACKED') g.packedUnits += qty;
      else g.pendingUnits += qty;

      if (!g.clients[clientName]) {
        g.clients[clientName] = { clientName, entries: [] };
      }

      g.clients[clientName].entries.push({
        id_order_day: orderDay.id_order_day,
        status,
        classification,
        quantity: qty,
      });
    }
  }

  for (const v of Object.values(grouped)) {
    v.clients = Object.values(v.clients).sort((a, b) =>
      a.clientName.localeCompare(b.clientName)
    );
  }

  return grouped;
};

// ── Classification badge ──────────────────────────────────────────────────────

const ClassificationBadge = ({ classification }) => {
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
  if (classification === 'both')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
        ☀️🌙 Ambos
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
      👨‍👩‍👧 Familiar
    </span>
  );
};

// ── RecipePackageCard ─────────────────────────────────────────────────────────

const RecipePackageCard = ({ variantKey, recipe, isExpanded, onToggle, onPack, onDeliver }) => {
  const accentColor = recipe.isOverridden ? 'bg-blue-600' : 'bg-slate-800';
  const hasPending = recipe.pendingUnits > 0;
  const hasPacked = recipe.packedUnits > 0;

  const allPackedIds = (recipe.clients ?? []).flatMap((c) =>
    c.entries.filter((e) => e.status === 'PACKED').map((e) => e.id_order_day)
  );

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden ${
        recipe.isOverridden
          ? 'border-blue-200 dark:border-blue-800'
          : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => onToggle(variantKey)}
          className="flex items-center gap-4 flex-1 min-w-0 text-left"
        >
          <div
            className={`text-white rounded-xl px-3 py-1.5 text-sm font-bold min-w-[48px] text-center shrink-0 ${accentColor}`}
          >
            {recipe.totalUnits}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{recipe.recipe_name}</p>
              {recipe.isOverridden && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                  Variante modificada
                </span>
              )}
            </div>
            {recipe.effectiveIngredients && (
              <div className="mt-1.5">
                <IngredientBadges ingredients={recipe.effectiveIngredients} />
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {(recipe.clients ?? []).length} cliente
                {(recipe.clients ?? []).length !== 1 ? 's' : ''}
              </p>
              {hasPending && (
                <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  {recipe.pendingUnits} por empacar
                </span>
              )}
              {hasPacked && (
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                  {recipe.packedUnits} empacado{recipe.packedUnits !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {hasPacked && (
            <button
              type="button"
              onClick={() => allPackedIds.forEach((id) => onDeliver(id))}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl transition"
            >
              <Truck size={12} />
              Entregar todo
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggle(variantKey)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition p-1"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Client summary */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
          {(recipe.clients ?? []).map((client, idx) => {
            const clientPackedIds = client.entries
              .filter((e) => e.status === 'PACKED')
              .map((e) => e.id_order_day);
            const clientHasPacked = clientPackedIds.length > 0;

            return (
              <div key={idx} className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0">
                      {client.clientName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {client.clientName}
                    </p>
                  </div>
                  {clientHasPacked && client.entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => clientPackedIds.forEach((id) => onDeliver(id))}
                      className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-2.5 py-1 rounded-xl transition shrink-0"
                    >
                      <Truck size={11} />
                      Entregar todo
                    </button>
                  )}
                </div>

                <div className="ml-9 space-y-1.5">
                  {client.entries.map((entry, eIdx) => (
                    <div
                      key={eIdx}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                        entry.status === 'PACKED'
                          ? 'bg-slate-50 dark:bg-slate-800'
                          : 'bg-amber-50/50 dark:bg-amber-900/10 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.quantity > 1 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            ×{entry.quantity}
                          </span>
                        )}
                        <ClassificationBadge classification={entry.classification} />
                        {entry.status === 'PENDING' && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Archive size={11} />
                            Por empacar
                          </span>
                        )}
                      </div>
                      {entry.status === 'PACKED' && (
                        <button
                          type="button"
                          onClick={() => onDeliver(entry.id_order_day)}
                          className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-1.5 rounded-xl transition shrink-0 ml-3"
                        >
                          <Truck size={12} />
                          Entregar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

// ── EmpaqueView ───────────────────────────────────────────────────────────────

const EmpaqueView = ({ pendingDays, packedDays, onPack, onDeliver }) => {
  const [expandedRecipes, setExpandedRecipes] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const allDays = useMemo(
    () => [...(pendingDays ?? []), ...(packedDays ?? [])],
    [pendingDays, packedDays]
  );

  const grouped = useMemo(() => groupByRecipeForPackage(allDays), [allDays]);

  const totalRecipes = Object.keys(grouped).length;
  const totalPacked = Object.values(grouped).reduce((s, r) => s + r.packedUnits, 0);
  const totalPending = Object.values(grouped).reduce((s, r) => s + r.pendingUnits, 0);

  const allPackedIds = useMemo(
    () =>
      Object.values(grouped).flatMap((r) =>
        r.clients.flatMap((c) =>
          c.entries.filter((e) => e.status === 'PACKED').map((e) => e.id_order_day)
        )
      ),
    [grouped]
  );

  const toggle = (key) => setExpandedRecipes((p) => ({ ...p, [key]: !p[key] }));

  const handleDeliverAll = () => {
    allPackedIds.forEach((id) => onDeliver(id));
    setShowConfirm(false);
  };

  if (totalRecipes === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-600">
        <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos activos para empacar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Package className="text-orange-500 dark:text-orange-400" size={20} />}
          label="Recetas distintas"
          value={totalRecipes}
        />
        <StatCard
          icon={<Archive className="text-amber-500 dark:text-amber-400" size={20} />}
          label="Por empacar"
          value={totalPending}
        />
        <StatCard
          icon={<Truck className="text-green-500 dark:text-green-400" size={20} />}
          label="Empacados"
          value={totalPacked}
        />
      </div>

      {/* Global deliver all button */}
      {totalPacked > 0 && (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold text-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
        >
          <Truck size={15} />
          Entregar todo ({totalPacked} pedido{totalPacked !== 1 ? 's' : ''})
        </button>
      )}

      {/* Recipe cards */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([, a], [, b]) => a.recipe_name.localeCompare(b.recipe_name))
          .map(([variantKey, recipe]) => (
            <RecipePackageCard
              key={variantKey}
              variantKey={variantKey}
              recipe={recipe}
              isExpanded={expandedRecipes[variantKey] ?? false}
              onToggle={toggle}
              onPack={onPack}
              onDeliver={onDeliver}
            />
          ))}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
              <Truck size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                ¿Entregar todos los pedidos?
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Se marcarán como entregados{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {totalPacked} pedido{totalPacked !== 1 ? 's' : ''}
                </span>{' '}
                empacados. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:border-slate-400 dark:hover:border-slate-500 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeliverAll}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
              >
                Sí, entregar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpaqueView;
