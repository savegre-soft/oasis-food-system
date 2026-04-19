import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { DAYS_ORDER } from './orderUtils';

/**
 * @typedef {Object} DayRecipe
 * @property {string|number} recipe_id - ID de la receta.
 * @property {string} recipe_name - Nombre de la receta.
 * @property {number} quantity - Cantidad asignada.
 * @property {boolean} isExtra - Indica si es una receta extra.
 */

/**
 * @typedef {Object.<string, DayRecipe[]>} DayRecipesMap
 * Mapa donde la clave es el día (ej: "monday") y el valor es un array de recetas.
 */

/**
 * @typedef {Object.<string, {protein: string[], carb: string[], extra: string[]}>} RecipeIngredientsMap
 * Mapa de ingredientes por receta agrupados por categoría.
 */

/**
 * @typedef {Object.<string, any>} IngredientOverridesMap
 * Overrides de ingredientes por clave compuesta `${day}-${index}`.
 */

/**
 * @typedef {Object.<string, boolean>} ExpandedDaysMap
 * Estado de expansión por día.
 */

/**
 * Hook personalizado para gestionar:
 * - Recetas por día
 * - Ingredientes por receta
 * - Overrides de ingredientes
 * - Estado de expansión de días
 *
 * Incluye operaciones CRUD y carga masiva desde órdenes existentes.
 *
 * @returns {Object} Estado y handlers del hook
 */
export const useDayRecipes = () => {
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

  /** @type {[ExpandedDaysMap, Function]} */
  const [expandedDays, setExpandedDays] = useState({});

  /**
   * Obtiene los ingredientes de una lista de recetas desde Supabase.
   * Solo consulta aquellos IDs que aún no están en caché.
   *
   * @param {Array<string|number>} ids - Lista de IDs de recetas
   * @returns {Promise<void>}
   */
  const fetchRecipeIngredients = useCallback(
    async (ids) => {
      const toFetch = ids.filter((id) => id && !recipeIngredients[String(id)]);
      if (toFetch.length === 0) return;

      const { data } = await supabase
        .schema('operations')
        .from('recipe_ingredients')
        .select('id_recipe_ingredient, recipe_id, name, category')
        .in('recipe_id', toFetch);

      if (!data) return;

      const grouped = {};
      toFetch.forEach((id) => {
        grouped[String(id)] = { protein: [], carb: [], extra: [] };
      });

      data.forEach((ing) => {
        const key = String(ing.recipe_id);
        if (grouped[key]) grouped[key][ing.category]?.push(ing.name);
      });

      setRecipeIngredients((prev) => ({ ...prev, ...grouped }));
    },
    [supabase, recipeIngredients]
  );

  /**
   * Agrega una receta a un día específico.
   *
   * @param {string} day - Día de la semana
   * @param {string|number} [recipeId=''] - ID de la receta
   * @param {string} [recipeName=''] - Nombre de la receta
   * @param {boolean} [isExtra=true] - Si es receta extra
   */
  const addRecipeToDay = useCallback((day, recipeId = '', recipeName = '', isExtra = true) => {
    setDayRecipes((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
        { recipe_id: recipeId, recipe_name: recipeName, quantity: 1, isExtra },
      ],
    }));
  }, []);

  /**
   * Actualiza un campo de una receta en un día específico.
   *
   * @param {string} day - Día de la semana
   * @param {number} index - Índice de la receta
   * @param {string} field - Campo a actualizar
   * @param {any} value - Nuevo valor
   * @param {Array<Object>} [allRecipes=[]] - Lista de recetas disponibles
   */
  const updateRecipeInDay = useCallback(
    (day, index, field, value, allRecipes = []) => {
      setDayRecipes((prev) => {
        const updated = [...(prev[day] ?? [])];

        if (field === 'recipe_id') {
          const found = allRecipes.find((r) => String(r.id_recipe) === String(value));
          updated[index] = {
            ...updated[index],
            recipe_id: value,
            recipe_name: found?.name ?? '',
          };

          if (value) fetchRecipeIngredients([value]);
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }

        return { ...prev, [day]: updated };
      });
    },
    [fetchRecipeIngredients]
  );

  /**
   * Elimina una receta de un día y limpia sus overrides asociados.
   *
   * @param {string} day - Día de la semana
   * @param {number} index - Índice de la receta
   */
  const removeRecipeFromDay = useCallback((day, index) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] ?? [])];
      updated.splice(index, 1);
      return { ...prev, [day]: updated };
    });

    setIngredientOverrides((prev) => {
      const next = { ...prev };
      delete next[`${day}-${index}`];
      return next;
    });
  }, []);

  /**
   * Define un override de ingredientes para una receta específica.
   *
   * @param {string} day - Día
   * @param {number} index - Índice de la receta
   * @param {any} value - Valor del override
   */
  const setOverride = useCallback((day, index, value) => {
    setIngredientOverrides((prev) => ({ ...prev, [`${day}-${index}`]: value }));
  }, []);

  /**
   * Alterna el estado expandido de un día.
   *
   * @param {string} day - Día de la semana
   */
  const toggleDay = useCallback((day) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  }, []);

  /**
   * Carga masiva de recetas desde una estructura de orderDays.
   * Utilizado para edición de órdenes existentes.
   *
   * @param {Array<Object>} orderDays - Datos de días de la orden
   * @param {Array<Object>} [allRecipes=[]] - Lista de recetas disponibles
   */
  const loadFromOrderDays = useCallback(
    (orderDays, allRecipes = []) => {
      const recipes = {};

      DAYS_ORDER.forEach((d) => {
        recipes[d] = [];
      });

      orderDays.forEach((od) => {
        recipes[od.day_of_week] = (od.order_day_details ?? []).map((det) => ({
          recipe_id: String(det.recipe_id ?? det.recipes?.id_recipe ?? ''),
          recipe_name: det.recipes?.name ?? '',
          quantity: det.quantity ?? 1,
          isExtra: true,
        }));
      });

      setDayRecipes(recipes);

      const ids = Object.values(recipes)
        .flat()
        .map((r) => r.recipe_id)
        .filter(Boolean);

      if (ids.length > 0) fetchRecipeIngredients(ids);
    },
    [fetchRecipeIngredients]
  );

  return {
    dayRecipes,
    setDayRecipes,
    recipeIngredients,
    ingredientOverrides,
    setIngredientOverrides,
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