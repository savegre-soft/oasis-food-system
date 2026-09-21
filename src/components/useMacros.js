import { useState, useCallback } from 'react';
import { MEAL_TYPES, primaryMealType } from './orderUtils';

/**
 * @typedef {Object} Macros
 * @property {number} [calories] - Calorías totales
 * @property {number} [protein] - Proteína en gramos
 * @property {number} [carbs] - Carbohidratos en gramos
 * @property {number} [fat] - Grasas en gramos
 * @property {number} [fiber] - Fibra en gramos
 */

/**
 * @typedef {Object.<string, Object.<string, Macros>>} DayMacrosMap
 * Estructura:
 * {
 *   monday: {
 *     Lunch: Macros,
 *     Dinner: Macros
 *   }
 * }
 */

/**
 * Hook para gestionar:
 * - Macros base (Breakfast / Lunch / Dinner)
 * - Overrides por día
 *
 * Permite modificar macros globales y específicos por día,
 * así como consultar el estado efectivo.
 *
 * @param {Macros|null} [initialLunch=null] - Macros iniciales para almuerzo
 * @param {Macros|null} [initialDinner=null] - Macros iniciales para cena
 * @param {Macros|null} [initialBreakfast=null] - Macros iniciales para desayuno
 *
 * @returns {Object} Estado y funciones utilitarias
 */
export const useMacros = (initialLunch = null, initialDinner = null, initialBreakfast = null) => {
  /** @type {[Macros|null, Function]} */
  const [lunchMacros, setLunchMacros] = useState(initialLunch);

  /** @type {[Macros|null, Function]} */
  const [dinnerMacros, setDinnerMacros] = useState(initialDinner);

  /** @type {[Macros|null, Function]} */
  const [breakfastMacros, setBreakfastMacros] = useState(initialBreakfast);

  /** @type {[DayMacrosMap, Function]} */
  const [dayMacros, setDayMacros] = useState({});

  /**
   * Obtiene los macros base según la clase (Lunch/Dinner)
   *
   * @param {string} cls - 'Breakfast' | 'Lunch' | 'Dinner'
   * @returns {Macros|null}
   */
  const getBaseMacros = useCallback(
    (cls) => {
      // Una clasificación combinada (ej. 'both', 'Breakfast+Lunch') usa el tiempo principal.
      const meal = MEAL_TYPES.includes(cls) ? cls : primaryMealType(cls);
      return meal === 'Dinner' ? dinnerMacros : meal === 'Breakfast' ? breakfastMacros : lunchMacros;
    },
    [lunchMacros, dinnerMacros, breakfastMacros]
  );

  /**
   * Actualiza un campo de macros de almuerzo
   *
   * @param {string} field - Campo a modificar
   * @param {number} value - Nuevo valor
   */
  const updateLunchMacro = useCallback(
    (field, value) => setLunchMacros((prev) => ({ ...prev, [field]: value })),
    []
  );

  /**
   * Actualiza un campo de macros de desayuno
   *
   * @param {string} field - Campo a modificar
   * @param {number} value - Nuevo valor
   */
  const updateBreakfastMacro = useCallback(
    (field, value) => setBreakfastMacros((prev) => ({ ...prev, [field]: value })),
    []
  );

  /**
   * Actualiza un campo de macros de cena
   *
   * @param {string} field - Campo a modificar
   * @param {number} value - Nuevo valor
   */
  const updateDinnerMacro = useCallback(
    (field, value) => setDinnerMacros((prev) => ({ ...prev, [field]: value })),
    []
  );

  /**
   * Actualiza o crea un override de macros para un día específico
   *
   * Si no existe override previo, se inicializa con los macros base.
   *
   * @param {string} day - Día (ej: 'monday')
   * @param {string} cls - 'Breakfast' | 'Lunch' | 'Dinner'
   * @param {string} field - Campo a modificar
   * @param {number} value - Nuevo valor
   */
  const updateDayMacro = useCallback(
    (day, cls, field, value) => {
      setDayMacros((prev) => {
        const base = getBaseMacros(cls) ?? {};
        const existing = prev?.[day]?.[cls] ?? { ...base };

        return {
          ...prev,
          [day]: {
            ...(prev[day] ?? {}),
            [cls]: { ...existing, [field]: value },
          },
        };
      });
    },
    [getBaseMacros]
  );

  /**
   * Elimina el override de macros para un día y clase específica
   *
   * @param {string} day - Día
   * @param {string} cls - 'Breakfast' | 'Lunch' | 'Dinner'
   */
  const resetDayMacro = useCallback((day, cls) => {
    setDayMacros((prev) => {
      const updated = { ...(prev[day] ?? {}) };
      delete updated[cls];

      return {
        ...prev,
        [day]: updated,
      };
    });
  }, []);

  /**
   * Limpia todos los overrides por día
   */
  const resetAllDayMacros = useCallback(() => setDayMacros({}), []);

  /**
   * Obtiene los macros efectivos (override si existe, si no base)
   *
   * @param {string} day - Día
   * @param {string} cls - 'Breakfast' | 'Lunch' | 'Dinner'
   * @returns {Macros|null}
   */
  const getEffectiveMacros = useCallback(
    (day, cls) =>
      dayMacros?.[day]?.[cls] ?? getBaseMacros(cls),
    [dayMacros, getBaseMacros]
  );

  /**
   * Indica si un día tiene override activo
   *
   * @param {string} day - Día
   * @param {string} cls - 'Breakfast' | 'Lunch' | 'Dinner'
   * @returns {boolean}
   */
  const isDayOverridden = useCallback(
    (day, cls) => dayMacros?.[day]?.[cls] != null,
    [dayMacros]
  );

  return {
    lunchMacros,
    setLunchMacros,
    dinnerMacros,
    setDinnerMacros,
    breakfastMacros,
    setBreakfastMacros,
    dayMacros,
    updateLunchMacro,
    updateBreakfastMacro,
    updateDinnerMacro,
    updateDayMacro,
    resetDayMacro,
    resetAllDayMacros,
    getBaseMacros,
    getEffectiveMacros,
    isDayOverridden,
  };
};