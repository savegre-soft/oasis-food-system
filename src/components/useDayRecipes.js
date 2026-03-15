import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { DAYS_ORDER } from './orderUtils';

// Hook that manages per-day recipe lists, ingredient data, and overrides
export const useDayRecipes = () => {
  const { supabase } = useApp();

  const [dayRecipes,          setDayRecipes]          = useState(() => {
    const init = {};
    DAYS_ORDER.forEach(d => { init[d] = []; });
    return init;
  });
  const [recipeIngredients,   setRecipeIngredients]   = useState({});
  const [ingredientOverrides, setIngredientOverrides] = useState({});
  const [expandedDays,        setExpandedDays]        = useState({});

  // ── Fetch ingredients for a list of recipe IDs ───────────────────────────

  const fetchRecipeIngredients = useCallback(async (ids) => {
    const toFetch = ids.filter(id => id && !recipeIngredients[id]);
    if (toFetch.length === 0) return;
    const { data } = await supabase
      .schema('operations')
      .from('recipe_ingredients')
      .select('id_recipe_ingredient, recipe_id, name, category')
      .in('recipe_id', toFetch);
    if (!data) return;
    const grouped = {};
    toFetch.forEach(id => { grouped[id] = { protein: [], carb: [], extra: [] }; });
    data.forEach(ing => {
      if (grouped[ing.recipe_id]) grouped[ing.recipe_id][ing.category]?.push(ing.name);
    });
    setRecipeIngredients(prev => ({ ...prev, ...grouped }));
  }, [supabase, recipeIngredients]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addRecipeToDay = useCallback((day, recipeId = '', recipeName = '', isExtra = true) => {
    setDayRecipes(prev => ({
      ...prev,
      [day]: [...(prev[day] ?? []), { recipe_id: recipeId, recipe_name: recipeName, quantity: 1, isExtra }],
    }));
  }, []);

  const updateRecipeInDay = useCallback((day, index, field, value, allRecipes = []) => {
    setDayRecipes(prev => {
      const updated = [...(prev[day] ?? [])];
      if (field === 'recipe_id') {
        const found = allRecipes.find(r => String(r.id_recipe) === String(value));
        updated[index] = { ...updated[index], recipe_id: value, recipe_name: found?.name ?? '' };
        if (value) fetchRecipeIngredients([value]);
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, [day]: updated };
    });
  }, [fetchRecipeIngredients]);

  const removeRecipeFromDay = useCallback((day, index) => {
    setDayRecipes(prev => {
      const updated = [...(prev[day] ?? [])];
      updated.splice(index, 1);
      return { ...prev, [day]: updated };
    });
    setIngredientOverrides(prev => {
      const next = { ...prev };
      delete next[`${day}-${index}`];
      return next;
    });
  }, []);

  const setOverride = useCallback((day, index, value) => {
    setIngredientOverrides(prev => ({ ...prev, [`${day}-${index}`]: value }));
  }, []);

  const toggleDay = useCallback((day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  }, []);

  // ── Bulk load (used by EditOrder to pre-fill from existing order) ─────────

  const loadFromOrderDays = useCallback((orderDays, allRecipes = []) => {
    const recipes = {};
    DAYS_ORDER.forEach(d => { recipes[d] = []; });
    orderDays.forEach(od => {
      recipes[od.day_of_week] = (od.order_day_details ?? []).map(det => ({
        recipe_id:   String(det.recipe_id ?? det.recipes?.id_recipe ?? ''),
        recipe_name: det.recipes?.name ?? '',
        quantity:    det.quantity ?? 1,
        isExtra:     false,
      }));
    });
    setDayRecipes(recipes);
    // Pre-fetch ingredients for loaded recipes
    const ids = Object.values(recipes).flat().map(r => r.recipe_id).filter(Boolean);
    if (ids.length > 0) fetchRecipeIngredients(ids);
  }, [fetchRecipeIngredients]);

  return {
    dayRecipes,        setDayRecipes,
    recipeIngredients,
    ingredientOverrides,
    expandedDays,
    addRecipeToDay,
    updateRecipeInDay,
    removeRecipeFromDay,
    setOverride,
    toggleDay,
    loadFromOrderDays,
    fetchRecipeIngredients,
  };
};
