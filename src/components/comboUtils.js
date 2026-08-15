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

export const COMBO_CATEGORY_UNIT = Object.fromEntries(COMBO_CATEGORIES.map((c) => [c.key, c.unit]));

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

// selections: array de filas, UNA POR UNIDAD elegida (un ítem con cantidad 3
// aparece como 3 filas — mismo criterio que ya usa aggregateComboSelections
// para contar producción), cada una con { category, is_extra, unit_price }.
// unit_price viene del precio propio del ítem (combo_items.price) y se cobra
// en dos casos: cada unidad de Plato Extra (siempre tiene costo aparte del
// combo), o cada unidad que excede el cupo configurado de su categoría
// (marcada is_extra — ver useComboSelections). El resto de unidades (dentro
// del cupo normal, categorías que no son Plato Extra) no suman nada, ya
// están incluidas en basePrice.
export const computeComboPrice = (basePrice, selections) => {
  const extrasTotal = (selections ?? []).reduce((sum, s) => {
    if (s.is_extra || s.category === 'plato_extra') return sum + (Number(s.unit_price) || 0);
    return sum;
  }, 0);
  return (Number(basePrice) || 0) + extrasTotal;
};

// Agrupa filas por-unidad (ver computeComboPrice) de vuelta por ítem de
// catálogo, para mostrarlas como "Ensalada ×3" en vez de 3 líneas repetidas.
// Usado en el resumen de confirmación del pedido y en ComboOrderCard.
// `row.extra_charge` se acepta como respaldo de `row.unit_price` para leer
// pedidos guardados antes de que existiera el precio por ítem.
export const groupSelectionsByItem = (rows) => {
  const map = new Map();
  for (const row of rows ?? []) {
    const key = row.combo_item_id;
    const unitPrice = row.unit_price ?? row.extra_charge ?? null;
    if (!map.has(key)) {
      map.set(key, {
        combo_item_id: key,
        category: row.category,
        combo_items: row.combo_items,
        unitPrice,
        qty: 0,
        extraQty: 0,
        extraTotal: 0,
      });
    }
    const g = map.get(key);
    g.qty += 1;
    if (unitPrice != null && g.unitPrice == null) g.unitPrice = unitPrice;
    if (row.is_extra) {
      g.extraQty += 1;
      g.extraTotal += Number(unitPrice) || 0;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99) ||
      (a.combo_items?.name ?? '').localeCompare(b.combo_items?.name ?? '')
  );
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
