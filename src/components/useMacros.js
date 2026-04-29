import { useState, useCallback } from 'react';

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
 * - Macros base (Lunch / Dinner)
 * - Overrides por día
 *
 * Permite modificar macros globales y específicos por día,
 * así como consultar el estado efectivo.
 *
 * @param {Macros|null} [initialLunch=null] - Macros iniciales para almuerzo
 * @param {Macros|null} [initialDinner=null] - Macros iniciales para cena
 *
 * @returns {Object} Estado y funciones utilitarias
 */
export const useMacros = (initialLunch = null, initialDinner = null) => {
  /** @type {[Macros|null, Function]} */
  const [lunchMacros, setLunchMacros] = useState(initialLunch);

  /** @type {[Macros|null, Function]} */
  const [dinnerMacros, setDinnerMacros] = useState(initialDinner);

  /** @type {[DayMacrosMap, Function]} */
  const [dayMacros, setDayMacros] = useState({});

  /**
   * Obtiene los macros base según la clase (Lunch/Dinner)
   *
   * @param {string} cls - 'Lunch' | 'Dinner'
   * @returns {Macros|null}
   */
  const getBaseMacros = useCallback(
    (cls) => (cls === 'Dinner' ? dinnerMacros : lunchMacros),
    [lunchMacros, dinnerMacros]
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
   * @param {string} cls - 'Lunch' | 'Dinner'
   * @param {string} field - Campo a modificar
   * @param {number} value - Nuevo valor
   */
  const updateDayMacro = useCallback(
    (day, cls, field, value) => {
      setDayMacros((prev) => {
        const base = (cls === 'Dinner' ? dinnerMacros : lunchMacros) ?? {};
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
    [lunchMacros, dinnerMacros]
  );

  /**
   * Elimina el override de macros para un día y clase específica
   *
   * @param {string} day - Día
   * @param {string} cls - 'Lunch' | 'Dinner'
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
   * @param {string} cls - 'Lunch' | 'Dinner'
   * @returns {Macros|null}
   */
  const getEffectiveMacros = useCallback(
    (day, cls) =>
      dayMacros?.[day]?.[cls] ??
      (cls === 'Dinner' ? dinnerMacros : lunchMacros),
    [dayMacros, lunchMacros, dinnerMacros]
  );

  /**
   * Indica si un día tiene override activo
   *
   * @param {string} day - Día
   * @param {string} cls - 'Lunch' | 'Dinner'
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
    dayMacros,
    updateLunchMacro,
    updateDinnerMacro,
    updateDayMacro,
    resetDayMacro,
    resetAllDayMacros,
    getBaseMacros,
    getEffectiveMacros,
    isDayOverridden,
  };
};