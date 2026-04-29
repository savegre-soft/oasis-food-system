import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DAYS_ORDER } from './orderUtils';

/**
 * @typedef {'protein' | 'carb' | 'extra'} IngredientCategory
 */

/**
 * @typedef {Object} IngredientGroup
 * @property {string[]} protein
 * @property {string[]} carb
 * @property {string[]} extra
 */

/**
 * @typedef {Object} DayRecipe
 * @property {string|number} recipe_id - ID de la receta
 * @property {string} recipe_name - Nombre de la receta
 * @property {number} quantity - Cantidad asignada
 * @property {boolean} isExtra - Indica si es una receta extra
 */

/**
 * @typedef {Object.<string, DayRecipe[]>} DayRecipesMap
 */

/**
 * @typedef {Object.<string|number, IngredientGroup>} RecipeIngredientsMap
 */

/**
 * @typedef {Object.<string, IngredientGroup | null>} IngredientOverridesMap
 * Clave: `${day}-${index}`
 */

/**
 * @typedef {'Lunch' | 'Dinner'} MealType
 */

/**
 * @typedef {Object.<string, MealType>} ExtraMealTypesMap
 */

/**
 * @typedef {Object} OrderDayDetail
 * @property {number} id_order_day_detail
 */

/**
 * @typedef {Object} OverrideRow
 * @property {number} order_day_detail_id
 * @property {string} name
 * @property {IngredientCategory} category
 */

/**
 * Hook para gestionar recetas de una orden:
 * - Estado de recetas por día
 * - Cache de ingredientes por receta
 * - Overrides de ingredientes
 * - Tipo de comida en recetas extra
 *
 * Diseñado para integrarse con flujos de edición y persistencia en BD.
 *
 * @returns {{
 *  dayRecipes: DayRecipesMap,
 *  recipeIngredients: RecipeIngredientsMap,
 *  ingredientOverrides: IngredientOverridesMap,
 *  extraMealTypes: ExtraMealTypesMap,
 *  setDayRecipesFromMap: (map: DayRecipesMap) => void,
 *  addRecipeToDay: (day: string, recipeId?: string|number, recipeName?: string) => void,
 *  updateRecipeInDay: (day: string, index: number, field: string, value: any, allRecipes?: any[]) => void,
 *  removeRecipeFromDay: (day: string, index: number) => void,
 *  setIngredientOverride: (day: string, index: number, val: IngredientGroup | null) => void,
 *  setExtraMealType: (day: string, index: number, type: MealType) => void,
 *  fetchRecipeIngredients: (ids: Array<string|number>) => Promise<void>,
 *  resetAll: () => void,
 *  buildOverrideRows: (detailsData: OrderDayDetail[], day: string) => OverrideRow[]
 * }}
 */
const useOrderRecipes = () => {
  const { supabase } = useApp();

  /** @type {[DayRecipesMap, Function]} */
  const [dayRecipes, setDayRecipes] = useState(() => {
    const init = {};
    DAYS_ORDER.forEach((d) => {
      init[d] = [];
    });
    return init;
  });

  /** @type {[RecipeIngredientsMap, Function]} */
  const [recipeIngredients, setRecipeIngredients] = useState({});

  /** @type {[IngredientOverridesMap, Function]} */
  const [ingredientOverrides, setIngredientOverrides] = useState({});

  /** @type {[ExtraMealTypesMap, Function]} */
  const [extraMealTypes, setExtraMealTypes] = useState({});

  /**
   * Fetch de ingredientes por receta con cache en memoria.
   *
   * @param {Array<string|number>} ids
   * @returns {Promise<void>}
   */
  const fetchRecipeIngredients = async (ids) => {
    const toFetch = ids.filter((id) => id && !recipeIngredients[id]);
    if (toFetch.length === 0) return;

    const { data } = await supabase
      .schema('operations')
      .from('recipe_ingredients')
      .select('id_recipe_ingredient, recipe_id, name, category')
      .in('recipe_id', toFetch);

    if (!data) return;

    /** @type {RecipeIngredientsMap} */
    const grouped = {};

    toFetch.forEach((id) => {
      grouped[id] = { protein: [], carb: [], extra: [] };
    });

    data.forEach((ing) => {
      grouped[ing.recipe_id]?.[ing.category]?.push(ing.name);
    });

    setRecipeIngredients((prev) => ({ ...prev, ...grouped }));
  };

  /**
   * Normaliza y setea recetas por día.
   *
   * @param {DayRecipesMap} map
   */
  const setDayRecipesFromMap = (map) => {
    const full = {};
    DAYS_ORDER.forEach((d) => {
      full[d] = map[d] ?? [];
    });
    setDayRecipes(full);
  };

  /**
   * Agrega receta a un día.
   */
  const addRecipeToDay = (day, recipeId = '', recipeName = '') => {
    setDayRecipes((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
        { recipe_id: recipeId, recipe_name: recipeName, quantity: 1, isExtra: true },
      ],
    }));
  };

  /**
   * Actualiza receta en posición específica.
   */
  const updateRecipeInDay = (day, index, field, value, allRecipes = []) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] ?? [])];

      if (field === 'recipe_id') {
        const found = allRecipes.find(
          (r) => String(r.id_recipe) === String(value)
        );

        updated[index] = {
          ...updated[index],
          recipe_id: value,
          recipe_name: found?.name ?? '',
        };

        if (value && !recipeIngredients[value]) {
          fetchRecipeIngredients([value]);
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }

      return { ...prev, [day]: updated };
    });
  };

  /**
   * Elimina receta de un día.
   */
  const removeRecipeFromDay = (day, index) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] ?? [])];
      updated.splice(index, 1);
      return { ...prev, [day]: updated };
    });
  };

  /**
   * Setea override de ingredientes.
   */
  const setIngredientOverride = (day, index, val) => {
    setIngredientOverrides((prev) => ({
      ...prev,
      [`${day}-${index}`]: val,
    }));
  };

  /**
   * Setea tipo de comida en recetas extra.
   */
  const setExtraMealType = (day, index, type) => {
    setExtraMealTypes((prev) => ({
      ...prev,
      [`${day}-${index}`]: type,
    }));
  };

  /**
   * Resetea todo el estado.
   */
  const resetAll = () => {
    const init = {};
    DAYS_ORDER.forEach((d) => {
      init[d] = [];
    });

    setDayRecipes(init);
    setIngredientOverrides({});
    setExtraMealTypes({});
  };

  /**
   * Genera filas para insertar overrides en BD.
   *
   * @param {OrderDayDetail[]} detailsData
   * @param {string} day
   * @returns {OverrideRow[]}
   */
  const buildOverrideRows = (detailsData, day) => {
    /** @type {OverrideRow[]} */
    const rows = [];

    (detailsData ?? []).forEach((det, i) => {
      const override = ingredientOverrides[`${day}-${i}`];
      if (!override) return;

      for (const cat of /** @type {IngredientCategory[]} */ (['protein', 'carb', 'extra'])) {
        for (const name of override[cat] ?? []) {
          rows.push({
            order_day_detail_id: det.id_order_day_detail,
            name,
            category: cat,
          });
        }
      }
    });

    return rows;
  };

  return {
    dayRecipes,
    recipeIngredients,
    ingredientOverrides,
    extraMealTypes,
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