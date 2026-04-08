import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DAYS_ORDER } from './orderUtils';

// Manages dayRecipes, recipeIngredients, ingredientOverrides, extraMealTypes.
// Returns state + all mutating functions needed by DayRecipeEditor and submit logic.
const useOrderRecipes = () => {
  const { supabase } = useApp();

  // { [day]: [{ recipe_id, recipe_name, quantity, isExtra }] }
  const [dayRecipes, setDayRecipes] = useState(() => {
    const init = {};
    DAYS_ORDER.forEach((d) => {
      init[d] = [];
    });
    return init;
  });

  // { [recipeId]: { protein: [], carb: [], extra: [] } }
  const [recipeIngredients, setRecipeIngredients] = useState({});

  // { 'day-index': { protein: [], carb: [], extra: [] } | null }
  const [ingredientOverrides, setIngredientOverrides] = useState({});

  // { 'day-index': 'Lunch' | 'Dinner' } — for extra recipes in both-type orders
  const [extraMealTypes, setExtraMealTypes] = useState({});

  // ── Fetch ingredients from DB ───────────────────────────────────────────────

  const fetchRecipeIngredients = async (ids) => {
    const toFetch = ids.filter((id) => id && !recipeIngredients[id]);
    if (toFetch.length === 0) return;
    const { data } = await supabase
      .schema('operations')
      .from('recipe_ingredients')
      .select('id_recipe_ingredient, recipe_id, name, category')
      .in('recipe_id', toFetch);
    if (!data) return;
    const grouped = {};
    toFetch.forEach((id) => {
      grouped[id] = { protein: [], carb: [], extra: [] };
    });
    data.forEach((ing) => {
      grouped[ing.recipe_id]?.[ing.category]?.push(ing.name);
    });
    setRecipeIngredients((prev) => ({ ...prev, ...grouped }));
  };

  // ── Mutators ────────────────────────────────────────────────────────────────

  const setDayRecipesFromMap = (map) => {
    // map: { [day]: [...] } — used when pre-loading from DB or templates
    const full = {};
    DAYS_ORDER.forEach((d) => {
      full[d] = map[d] ?? [];
    });
    setDayRecipes(full);
  };

  const addRecipeToDay = (day, recipeId = '', recipeName = '') => {
    setDayRecipes((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
        { recipe_id: recipeId, recipe_name: recipeName, quantity: 1, isExtra: true },
      ],
    }));
  };

  const updateRecipeInDay = (day, index, field, value, allRecipes = []) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] ?? [])];
      if (field === 'recipe_id') {
        const found = allRecipes.find((r) => String(r.id_recipe) === String(value));
        updated[index] = { ...updated[index], recipe_id: value, recipe_name: found?.name ?? '' };
        if (value && !recipeIngredients[value]) fetchRecipeIngredients([value]);
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, [day]: updated };
    });
  };

  const removeRecipeFromDay = (day, index) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] ?? [])];
      const wasExtra = updated[index].isExtra;
      updated.splice(index, 1);
      return { ...prev, [day]: updated };
    });
  };

  const setIngredientOverride = (day, index, val) => {
    setIngredientOverrides((prev) => ({ ...prev, [`${day}-${index}`]: val }));
  };

  const setExtraMealType = (day, index, type) => {
    setExtraMealTypes((prev) => ({ ...prev, [`${day}-${index}`]: type }));
  };

  const resetAll = () => {
    const init = {};
    DAYS_ORDER.forEach((d) => {
      init[d] = [];
    });
    setDayRecipes(init);
    setIngredientOverrides({});
    setExtraMealTypes({});
  };

  // ── Build override rows for DB insert ──────────────────────────────────────

  const buildOverrideRows = (detailsData, day) => {
    const rows = [];
    (detailsData ?? []).forEach((det, i) => {
      const override = ingredientOverrides[`${day}-${i}`];
      if (!override) return;
      for (const cat of ['protein', 'carb', 'extra']) {
        for (const name of override[cat] ?? []) {
          rows.push({ order_day_detail_id: det.id_order_day_detail, name, category: cat });
        }
      }
    });
    return rows;
  };

  return {
    // state
    dayRecipes,
    recipeIngredients,
    ingredientOverrides,
    extraMealTypes,
    // setters
    setDayRecipesFromMap,
    addRecipeToDay,
    updateRecipeInDay,
    removeRecipeFromDay,
    setIngredientOverride,
    setExtraMealType,
    fetchRecipeIngredients,
    resetAll,
    buildOverrideRows,
  };
};

export default useOrderRecipes;
