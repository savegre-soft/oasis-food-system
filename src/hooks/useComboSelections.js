import { useState, useMemo, useCallback } from 'react';
import { isPooledCategory } from '../components/comboUtils';

// Estado y lógica de selección de ítems de combo, compartida entre
// AddComboOrder y EditComboOrder. Cada ítem tiene una cantidad (no un simple
// on/off), así que un mismo ítem puede elegirse varias veces. Además del pool
// de unidades (Arroz/Proteína/Acompañamiento/Extra comparten cupo; Plato
// Extra tiene el suyo), permite agregar unidades por encima del máximo de su
// categoría: cada una de esas unidades queda marcada como "extra" con su
// propio cobro adicional (extraCharge) en vez de bloquearse — se puede
// agregar más de una, y con precios distintos si hace falta.
const extraKey = (category, itemId) => `${category}:${itemId}`;

export const useComboSelections = (categories, initial) => {
  const [quantities, setQuantities] = useState(initial?.quantities ?? {}); // { [category]: { [itemId]: qty } }
  const [extraCharges, setExtraCharges] = useState(initial?.extraCharges ?? {}); // { "category:itemId": number[] }

  const poolTotal = useMemo(
    () =>
      categories
        .filter((c) => isPooledCategory(c.category))
        .reduce((sum, c) => sum + c.max_selections, 0),
    [categories]
  );

  // Total de unidades elegidas en las categorías del pool, extras incluidas
  // (para el contador "usadas / total" que se muestra en la UI).
  const pooledUsed = useMemo(
    () =>
      categories
        .filter((c) => isPooledCategory(c.category))
        .reduce(
          (sum, c) => sum + Object.values(quantities[c.category] ?? {}).reduce((s, q) => s + q, 0),
          0
        ),
    [categories, quantities]
  );

  // Unidades que siguen contando contra el cupo configurado (excluye las ya
  // marcadas como extra) dentro del alcance de una categoría: el pool
  // completo si es una categoría pooled, o solo esa categoría si no.
  const normalUsedInScope = useCallback(
    (category) => {
      const scopeCats = isPooledCategory(category)
        ? categories.filter((c) => isPooledCategory(c.category))
        : categories.filter((c) => c.category === category);
      let used = 0;
      for (const c of scopeCats) {
        const catQty = quantities[c.category] ?? {};
        for (const itemId of Object.keys(catQty)) {
          const extraN = (extraCharges[extraKey(c.category, itemId)] ?? []).length;
          used += Math.max(catQty[itemId] - extraN, 0);
        }
      }
      return used;
    },
    [categories, quantities, extraCharges]
  );

  // true si agregar UNA unidad más en esta categoría ya no cabe en el cupo
  // normal (pool o de la categoría) y por lo tanto debe tratarse como extra.
  const wouldExceedLimit = useCallback(
    (category, maxSelections) => {
      const capacity = isPooledCategory(category) ? poolTotal : maxSelections;
      return normalUsedInScope(category) >= capacity;
    },
    [poolTotal, normalUsedInScope]
  );

  const qtyOf = useCallback(
    (category, itemId) => quantities[category]?.[itemId] ?? 0,
    [quantities]
  );

  const extraCountOf = useCallback(
    (category, itemId) => (extraCharges[extraKey(category, itemId)] ?? []).length,
    [extraCharges]
  );

  const extraTotalOf = useCallback(
    (category, itemId) =>
      (extraCharges[extraKey(category, itemId)] ?? []).reduce((s, c) => s + (Number(c) || 0), 0),
    [extraCharges]
  );

  // Último precio de extra usado para este ítem, para precargar el modal si
  // se agrega otra unidad extra del mismo ítem.
  const lastExtraCharge = useCallback(
    (category, itemId) => {
      const list = extraCharges[extraKey(category, itemId)];
      return list && list.length ? list[list.length - 1] : null;
    },
    [extraCharges]
  );

  const addUnit = useCallback((category, itemId) => {
    setQuantities((prev) => ({
      ...prev,
      [category]: { ...(prev[category] ?? {}), [itemId]: (prev[category]?.[itemId] ?? 0) + 1 },
    }));
  }, []);

  const addExtraUnit = useCallback(
    (category, itemId, charge) => {
      addUnit(category, itemId);
      const key = extraKey(category, itemId);
      setExtraCharges((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), charge] }));
    },
    [addUnit]
  );

  // Quita una unidad del ítem. Si tiene unidades extra, se quita una de esas
  // primero (la última agregada) para que el costo baje antes que el cupo
  // normal se libere.
  const removeUnit = useCallback((category, itemId) => {
    setQuantities((prev) => {
      const current = prev[category]?.[itemId] ?? 0;
      if (current <= 0) return prev;
      const nextCat = { ...(prev[category] ?? {}) };
      if (current === 1) delete nextCat[itemId];
      else nextCat[itemId] = current - 1;
      return { ...prev, [category]: nextCat };
    });
    setExtraCharges((prev) => {
      const key = extraKey(category, itemId);
      const list = prev[key];
      if (!list || list.length === 0) return prev;
      const nextList = list.slice(0, -1);
      const next = { ...prev };
      if (nextList.length === 0) delete next[key];
      else next[key] = nextList;
      return next;
    });
  }, []);

  const resetSelections = useCallback(() => {
    setQuantities({});
    setExtraCharges({});
  }, []);

  return {
    quantities,
    extraCharges,
    poolTotal,
    pooledUsed,
    wouldExceedLimit,
    qtyOf,
    extraCountOf,
    extraTotalOf,
    lastExtraCharge,
    addUnit,
    addExtraUnit,
    removeUnit,
    resetSelections,
  };
};
