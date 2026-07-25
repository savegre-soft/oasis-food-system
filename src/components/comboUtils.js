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

// Todas las categorías salvo Plato Extra comparten un mismo "pool" de unidades:
// lo que el cliente no usa en una (ej. proteína) queda disponible para otra
// (ej. acompañamientos). Plato Extra queda fuera porque tiene costo aparte.
export const isPooledCategory = (category) => category !== 'plato_extra';

export const COMBO_ORDER_STATUS_LABEL = {
  PENDING: 'Pendiente',
  PACKED: 'Empacado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const CATEGORY_ORDER = Object.fromEntries(COMBO_CATEGORIES.map((c, i) => [c.key, i]));

export const compareByCategoryThenName = (a, b) =>
  (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99) ||
  a.name.localeCompare(b.name);

// Agrega las selecciones de un conjunto de pedidos de combo por ítem de
// catálogo (ej. "Arroz blanco: 3000 g"), ordenado por categoría y nombre.
// Usado por la vista "Por plato" y por el resumen de impresión.
export const aggregateComboSelections = (orders) => {
  const grouped = {};
  for (const order of orders ?? []) {
    for (const sel of order.combo_order_selections ?? []) {
      const item = sel.combo_items;
      if (!item) continue;
      const key = sel.combo_item_id;
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name,
          category: sel.category,
          portion_size_g: item.portion_size_g,
          count: 0,
        };
      }
      grouped[key].count += 1;
    }
  }
  return Object.values(grouped).sort(compareByCategoryThenName);
};

// Agrupa una lista ya ordenada por categoría (aggregateComboSelections) en
// bloques consecutivos, para secciones con encabezado por categoría.
export const groupByCategory = (aggregatedRows) => {
  const groups = [];
  for (const row of aggregatedRows) {
    const last = groups[groups.length - 1];
    if (last && last.category === row.category) {
      last.items.push(row);
    } else {
      groups.push({ category: row.category, items: [row] });
    }
  }
  return groups;
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
