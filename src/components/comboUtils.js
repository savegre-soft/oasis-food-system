// ── Shared constants & helpers for the Combos module ───────────────────────
// Única fuente de verdad para categorías de combo, unidades de medida y el
// cálculo de precio total (base + platos extra elegidos).

export const COMBO_CATEGORIES = [
  { key: 'arroz', label: 'Arroz', unit: 'g' },
  { key: 'proteina', label: 'Proteína', unit: 'g' },
  { key: 'acompanamiento', label: 'Acompañamientos', unit: 'unidades' },
  { key: 'extra', label: 'Extras', unit: 'unidades' },
  { key: 'plato_extra', label: 'Plato Extra', unit: 'unidades' },
];

export const COMBO_CATEGORY_LABEL = Object.fromEntries(
  COMBO_CATEGORIES.map((c) => [c.key, c.label])
);

export const COMBO_CATEGORY_UNIT = Object.fromEntries(
  COMBO_CATEGORIES.map((c) => [c.key, c.unit])
);

export const isGramCategory = (category) => category === 'arroz' || category === 'proteina';

export const COMBO_ORDER_STATUS_LABEL = {
  PENDING: 'Pendiente',
  PACKED: 'Empacado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

// selections: array de filas ya elegidas, cada una con { category, extra_price }
// (extra_price viene de combo_week_category_items, solo relevante en plato_extra)
export const computeComboPrice = (basePrice, selections) => {
  const extrasTotal = (selections ?? [])
    .filter((s) => s.category === 'plato_extra')
    .reduce((sum, s) => sum + (Number(s.extra_price) || 0), 0);
  return (Number(basePrice) || 0) + extrasTotal;
};

// Formatea la cantidad agregada de un ítem para la vista "por plato":
// gramos = count × portion_size_g; unidades = count.
export const formatComboQuantity = (category, count, portionSizeG) => {
  if (isGramCategory(category)) {
    const grams = count * (Number(portionSizeG) || 0);
    return `${grams.toLocaleString('es-CR')} g`;
  }
  return `${count} unidad${count === 1 ? '' : 'es'}`;
};
