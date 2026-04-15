import MacroPanel from '../../MacroPanel';
import RecipeIngredientEditor from '../../RecipeIngredientEditor';
import { MACRO_UNIT } from '../../orderUtils';

const STANDARD_MACRO = { protein_value: 1, carb_value: 1 };

const StepExpressRecipes = ({
  expressType,
  setExpressType,
  expressMacros,
  setExpressMacros,
  expressRecipes,
  setExpressRecipes,
  expressIngredientOverrides,
  setExpressIngredientOverrides,
  allRecipes,
  recipeIngredients,
  fetchRecipeIngredients,
  selectedClient,
}) => {
  const clientMacro =
    expressType === 'Lunch' ? selectedClient?.lunch_macro : selectedClient?.dinner_macro;

  const isClientActive =
    clientMacro &&
    String(expressMacros?.protein_value) === String(clientMacro.protein_value) &&
    String(expressMacros?.carb_value) === String(clientMacro.carb_value);

  const isStdActive =
    expressMacros &&
    String(expressMacros.protein_value) === '1' &&
    String(expressMacros.carb_value) === '1';

  const applyClientMacro = () => {
    const m = expressType === 'Dinner' ? selectedClient.dinner_macro : selectedClient.lunch_macro;
    setExpressMacros({
      protein_value: m.protein_value,
      carb_value: m.carb_value,
    });
  };

  return (
    <div className="space-y-5">
      {/* Lunch / Dinner toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de comida</label>
        <div className="flex gap-2">
          {[
            ['Lunch', '☀️ Almuerzo'],
            ['Dinner', '🌙 Cena'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setExpressType(val)}
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                expressType === val
                  ? val === 'Lunch'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-indigo-50 border-indigo-400 text-indigo-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Macros del pedido</p>
          <div className="flex gap-2">
            {clientMacro && (
              <button
                type="button"
                onClick={applyClientMacro}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  isClientActive
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                👤 Del cliente
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpressMacros({ ...STANDARD_MACRO })}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                isStdActive
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ⭐ Estándar (1 {MACRO_UNIT})
            </button>
          </div>
        </div>
        <MacroPanel
          label={expressType === 'Lunch' ? '☀️ Almuerzo' : '🌙 Cena'}
          colorClass={expressType === 'Lunch' ? 'amber' : 'indigo'}
          macros={expressMacros}
          onUpdate={(field, value) => setExpressMacros((prev) => ({ ...prev, [field]: value }))}
        />
      </div>

      {/* Recipe list */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Recetas para hoy</label>
        <div className="space-y-3">
          {expressRecipes.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <select
                  value={item.recipe_id || ''}
                  onChange={(e) => {
                    const found = allRecipes.find(
                      (r) => String(r.id_recipe) === String(e.target.value)
                    );
                    setExpressRecipes((prev) => {
                      const updated = [...prev];
                      updated[idx] = {
                        ...updated[idx],
                        recipe_id: e.target.value ? Number(e.target.value) : '',
                        recipe_name: found?.name ?? '',
                      };
                      return updated;
                    });
                    if (e.target.value) fetchRecipeIngredients([String(e.target.value)]);
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  <option value="">Seleccionar receta</option>
                  {allRecipes.map((r) => (
                    <option key={r.id_recipe} value={r.id_recipe}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    setExpressRecipes((prev) => {
                      const updated = [...prev];
                      updated[idx] = { ...updated[idx], quantity: e.target.value };
                      return updated;
                    })
                  }
                  className="w-16 px-2 py-2 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setExpressRecipes((prev) => prev.filter((_, i) => i !== idx));
                    setExpressIngredientOverrides((prev) => {
                      const next = { ...prev };
                      delete next[idx];
                      return next;
                    });
                  }}
                  className="text-red-400 hover:text-red-600 transition p-1"
                >
                  ✕
                </button>
              </div>
              {item.recipe_id && (
                <RecipeIngredientEditor
                  recipeName={item.recipe_name}
                  baseIngredients={
                    recipeIngredients[String(item.recipe_id)] ?? { protein: [], carb: [], extra: [] }
                  }
                  value={expressIngredientOverrides[idx] ?? null}
                  onChange={(val) =>
                    setExpressIngredientOverrides((prev) => ({ ...prev, [idx]: val }))
                  }
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setExpressRecipes((prev) => [
                ...prev,
                { recipe_id: '', recipe_name: '', quantity: 1 },
              ])
            }
            className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition"
          >
            + Agregar receta
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepExpressRecipes;
