import { useState, useCallback } from 'react';

// Hook that manages lunch/dinner base macros + per-day overrides
export const useMacros = (initialLunch = null, initialDinner = null) => {
  const [lunchMacros, setLunchMacros] = useState(initialLunch);
  const [dinnerMacros, setDinnerMacros] = useState(initialDinner);
  const [dayMacros, setDayMacros] = useState({});

  const getBaseMacros = useCallback(
    (cls) => (cls === 'Dinner' ? dinnerMacros : lunchMacros),
    [lunchMacros, dinnerMacros]
  );

  const updateLunchMacro = useCallback(
    (field, value) => setLunchMacros((prev) => ({ ...prev, [field]: value })),
    []
  );
  const updateDinnerMacro = useCallback(
    (field, value) => setDinnerMacros((prev) => ({ ...prev, [field]: value })),
    []
  );

  const updateDayMacro = useCallback(
    (day, cls, field, value) => {
      setDayMacros((prev) => {
        const base = (cls === 'Dinner' ? dinnerMacros : lunchMacros) ?? {};
        const existing = prev?.[day]?.[cls] ?? { ...base };
        return { ...prev, [day]: { ...(prev[day] ?? {}), [cls]: { ...existing, [field]: value } } };
      });
    },
    [lunchMacros, dinnerMacros]
  );

  const resetDayMacro = useCallback((day, cls) => {
    setDayMacros((prev) => {
      const updated = { ...(prev[day] ?? {}) };
      delete updated[cls];
      return { ...prev, [day]: updated };
    });
  }, []);

  const resetAllDayMacros = useCallback(() => setDayMacros({}), []);

  const getEffectiveMacros = useCallback(
    (day, cls) => dayMacros?.[day]?.[cls] ?? (cls === 'Dinner' ? dinnerMacros : lunchMacros),
    [dayMacros, lunchMacros, dinnerMacros]
  );

  const isDayOverridden = useCallback((day, cls) => dayMacros?.[day]?.[cls] != null, [dayMacros]);

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
