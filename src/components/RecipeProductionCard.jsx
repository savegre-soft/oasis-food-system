import { ChevronDown, ChevronUp, Archive } from 'lucide-react';

const CATEGORY_STYLE = {
  protein: { badge: 'bg-red-100 text-red-700' },
  carb:    { badge: 'bg-amber-100 text-amber-700' },
  extra:   { badge: 'bg-green-100 text-green-700' },
};

const IngredientBadges = ({ ingredients }) => {
  const hasAny = ['protein', 'carb', 'extra'].some((c) => (ingredients?.[c] ?? []).length > 0);
  if (!hasAny) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {['protein', 'carb', 'extra'].map((cat) =>
        (ingredients?.[cat] ?? []).map((item, i) => (
          <span key={`${cat}-${i}`} className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CATEGORY_STYLE[cat].badge}`}>
            {item}
          </span>
        ))
      )}
    </div>
  );
};

const RecipeProductionCard = ({ variantKey, recipe, isExpanded, onToggle, onPack }) => {
  const accentColor = recipe.isOverridden ? 'bg-blue-600' : 'bg-slate-800';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${recipe.isOverridden ? 'border-blue-200' : 'border-slate-100'}`}>

      {/* Header */}
      <button
        type="button"
        onClick={() => onToggle(variantKey)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`text-white rounded-xl px-3 py-1.5 text-sm font-bold min-w-[48px] text-center shrink-0 ${accentColor}`}>
            {recipe.totalUnits}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800">{recipe.recipe_name}</p>
              {recipe.isOverridden && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                  Variante modificada
                </span>
              )}
            </div>
            {recipe.effectiveIngredients && (
              <div className="mt-1.5">
                <IngredientBadges ingredients={recipe.effectiveIngredients} />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {(recipe.clients ?? []).length} cliente{(recipe.clients ?? []).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isExpanded
          ? <ChevronUp size={16} className="text-slate-400 shrink-0 ml-2" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
        }
      </button>

      {/* Clientes */}
      {isExpanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {(recipe.clients ?? []).map((client, index) => (
            <div key={index} className="px-5 py-3">

              {/* Nombre + total */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[36px] text-center shrink-0 ${accentColor}`}>
                    ×{client.totalQuantity}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{client.clientName}</p>
                </div>

                {/* Empacar todo el cliente de una vez si tiene solo una meal */}
                {client.meals?.length === 1 && (
                  <button
                    type="button"
                    onClick={() => (client.meals[0].orderDayIds ?? []).forEach((id) => onPack(id))}
                    className="flex items-center gap-1.5 text-xs text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition shrink-0 ml-4"
                  >
                    <Archive size={13} />
                    Empacar
                  </button>
                )}
              </div>

              {/* Meals */}
              <div className="ml-9 space-y-1.5">
                {(client.meals ?? []).map((meal, mIndex) => (
                  <div key={mIndex} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">×{meal.quantity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        meal.classification === 'Lunch' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {meal.classification === 'Lunch' ? '☀️ Almuerzo' : '🌙 Cena'}
                      </span>
                      {meal.protein && (
                        <span className="text-xs text-slate-400">
                          {meal.protein}{meal.proteinUnit} prot · {meal.carb}{meal.carbUnit} carbos
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => (meal.orderDayIds ?? []).forEach((id) => onPack(id))}
                      className="flex items-center gap-1.5 text-xs text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition shrink-0 ml-3"
                    >
                      <Archive size={13} />
                      Empacar
                    </button>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeProductionCard;