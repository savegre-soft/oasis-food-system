import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const MealBadge = ({ classification }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
    classification === 'Lunch' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
  }`}>
    {classification === 'Lunch' ? '☀️ Almuerzo' : '🌙 Cena'}
  </span>
);

const RecipeProductionCard = ({ recipeId, recipe, isExpanded, onToggle, onDeliver }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Header receta */}
      <button
        type="button"
        onClick={() => onToggle(recipeId)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 text-white rounded-xl px-3 py-1.5 text-sm font-bold min-w-[48px] text-center">
            {recipe.totalUnits}
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800">{recipe.recipe_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {recipe.clients.length} cliente{recipe.clients.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isExpanded
          ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />
        }
      </button>

      {/* Desglose por cliente */}
      {isExpanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {recipe.clients.map((client, index) => (
            <div key={index} className="px-5 py-3">

              {/* Fila del cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[36px] text-center">
                    ×{client.totalQuantity}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{client.clientName}</p>
                </div>

                {/* Botón entregar — solo si todas las meals del cliente son del mismo orderDay */}
                {client.meals.length === 1 && (
                  <button
                    type="button"
                    onClick={() => onDeliver(client.meals[0].orderDayId)}
                    className="flex items-center gap-1.5 text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-xl hover:bg-green-100 transition shrink-0"
                  >
                    <CheckCircle size={13} />
                    Entregar
                  </button>
                )}
              </div>

              {/* Subfilas de meals */}
              <div className="mt-2 ml-9 space-y-1.5">
                {client.meals.map((meal, mIndex) => (
                  <div key={mIndex} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">×{meal.quantity}</span>
                      <MealBadge classification={meal.classification} />
                      {meal.protein && (
                        <span className="text-xs text-slate-400">
                          {meal.protein}{meal.proteinUnit} prot · {meal.carb}{meal.carbUnit} carbos
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeliver(meal.orderDayId)}
                      className="flex items-center gap-1.5 text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-xl hover:bg-green-100 transition shrink-0 ml-3"
                    >
                      <CheckCircle size={13} />
                      Entregar
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