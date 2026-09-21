// ── Shared constants & date utilities for order management ────────────────────

/** Unidad de medida estandarizada para macros (proteína y carbohidratos).
 *  Cambiar este valor actualiza toda la UI y los reportes automáticamente. */
export const MACRO_UNIT = 'ud.';

/** Valores de macro que definen el plan "estándar" (por oposición a "nutricional").
 *  Única fuente de verdad: usar esta constante en cualquier lugar que necesite
 *  el valor estándar (alta de cliente, asistente de pedidos, express, etc.). */
export const STANDARD_MACRO = { protein_value: 4, carb_value: 2 };

/** Tiempos de comida individuales que puede tener un pedido personal. Un pedido
 *  puede incluir 1, 2 o los 3. Única fuente de verdad de etiquetas/emoji/color. */
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

export const MEAL_META = {
  Breakfast: { label: 'Desayuno', emoji: '🌅', color: 'sky' },
  Lunch: { label: 'Almuerzo', emoji: '☀️', color: 'amber' },
  Dinner: { label: 'Cena', emoji: '🌙', color: 'indigo' },
};

/** Tiempos de comida (y por ende plantillas/macros) que involucra una clasificación.
 *  Codificación de `orders.classification`: un tiempo → 'Breakfast'|'Lunch'|'Dinner';
 *  Almuerzo + Cena → 'both' (legado, se conserva); cualquier otra combinación →
 *  tiempos en orden canónico unidos por '+' (ej. 'Breakfast+Lunch').
 *  'Family' no tiene tiempos de comida individuales. */
export const mealTypesOf = (classification) => {
  if (!classification) return [];
  if (classification === 'both') return ['Lunch', 'Dinner'];
  return MEAL_TYPES.filter((t) => classification.split('+').includes(t));
};

/** Inverso de mealTypesOf: lista de tiempos de comida → clasificación (null si vacía). */
export const classificationOf = (types) => {
  const ordered = MEAL_TYPES.filter((t) => types.includes(t));
  if (ordered.length === 0) return null;
  if (ordered.length === 2 && ordered[0] === 'Lunch') return 'both';
  return ordered.join('+');
};

/** Primer tiempo de comida de una clasificación (define el snapshot de macros del pedido). */
export const primaryMealType = (classification) => mealTypesOf(classification)[0] ?? 'Lunch';

/** '🌅 Desayuno' / '☀️🌙 Almuerzo + Cena' — etiqueta con emoji de una clasificación. */
export const mealLabel = (classification) => {
  const types = mealTypesOf(classification);
  if (types.length === 1) return `${MEAL_META[types[0]].emoji} ${MEAL_META[types[0]].label}`;
  if (types.length > 1)
    return `${types.map((t) => MEAL_META[t].emoji).join('')} ${types.map((t) => MEAL_META[t].label).join(' + ')}`;
  return classification === 'Family' ? '👨‍👩‍👧 Familiar' : classification;
};

/** Texto plano de una clasificación de pedido (sin emoji). */
export const classificationLabel = (c) => {
  const types = mealTypesOf(c);
  if (types.length) return types.map((t) => MEAL_META[t].label).join(' + ');
  return c === 'Family' ? 'Familiar' : c;
};

/** Clases Tailwind del badge de una clasificación (con dark mode). Un tiempo usa su
 *  color; combinaciones → teal; familiar → púrpura. Clases completas para Tailwind. */
export const classificationBadge = (c) => {
  const types = mealTypesOf(c);
  if (types.length === 1) {
    return {
      Breakfast: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
      Lunch: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      Dinner: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    }[types[0]];
  }
  if (types.length > 1) return 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400';
  if (c === 'Family') return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
};

/** Emoji del tiempo de comida principal de un pedido. */
export const classificationEmoji = (c) => MEAL_META[primaryMealType(c)]?.emoji ?? '☀️';

/** Nombre de la columna de perfil de macros del cliente para un tiempo de comida. */
export const clientMacroKey = (type) =>
  type === 'Breakfast' ? 'breakfast_macro' : type === 'Dinner' ? 'dinner_macro' : 'lunch_macro';

export const DAYS_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DAY_LABELS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

export const DAY_SHORT = {
  Monday: 'Lun',
  Tuesday: 'Mar',
  Wednesday: 'Mié',
  Thursday: 'Jue',
  Friday: 'Vie',
  Saturday: 'Sáb',
  Sunday: 'Dom',
};

export const isFamily = (client) => client?.client_type === 'family';

export const toDateString = (date) => date.toISOString().split('T')[0];

// Semana del mes (1-4) a la que corresponde el lunes de una semana de pedido
// — mismo bucket calendario que usa operations.portal_get_menu_options en
// Supabase (día 1-7 = Semana 1, 8-14 = Semana 2, 15-21 = Semana 3, 22-28 =
// Semana 4, 29-31 = 5to lunes del mes, vuelve a la Semana 1). Única fuente
// de verdad en el frontend, usada tanto por el portal de clientes como por
// el asistente interno (AddOrder.jsx) para preseleccionar la plantilla.
export const getWeekOfMonth = (monday) => {
  const day = monday.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 1;
};

// Returns the active week range for a new order.
// Mon / Tue → current week (delivery forced to Tuesday of that week).
// Any other day → next week (existing behaviour).
export const getWeekRange = () => {
  const today    = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, 2=Tue, …
  const isEarlyWeek = dayOfWeek === 1 || dayOfWeek === 2; // Mon or Tue

  const diff   = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // offset to reach Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (isEarlyWeek ? 0 : 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // For Mon/Tue registrations: all order_days get this fixed delivery date.
  const tuesdayDelivery = isEarlyWeek ? new Date(monday) : null;
  if (tuesdayDelivery) tuesdayDelivery.setDate(monday.getDate() + 1);

  return { weekStart: monday, weekEnd: sunday, tuesdayDelivery };
};

// Absolute Date of a named day within the week starting on weekStart (Monday)
export const getAbsoluteDate = (dayOfWeek, weekStart) => {
  const date = new Date(weekStart);
  if (dayOfWeek === 'Sunday') {
    date.setDate(weekStart.getDate() - 1); // Sunday precedes Monday
  } else {
    date.setDate(weekStart.getDate() + DAYS_ORDER.indexOf(dayOfWeek));
  }
  return date;
};

// Cycle index: Sunday = -1 (start of delivery cycle), Mon=0 … Sat=5
export const cycleIdx = (d) => (d === 'Sunday' ? -1 : DAYS_ORDER.indexOf(d));

// Given a meal day and route delivery days, find the correct delivery_date
export const getDateForDay = (dayOfWeek, weekStart, routeDeliveryDays) => {
  if (!routeDeliveryDays?.length) {
    return toDateString(getAbsoluteDate(dayOfWeek, weekStart));
  }
  const sorted = [...routeDeliveryDays].sort((a, b) => cycleIdx(a) - cycleIdx(b));
  if (dayOfWeek === 'Sunday') {
    const best = sorted.includes('Sunday') ? 'Sunday' : sorted[sorted.length - 1];
    return toDateString(getAbsoluteDate(best, weekStart));
  }
  const mealSlot = DAYS_ORDER.indexOf(dayOfWeek);
  const candidates = sorted.filter((d) => cycleIdx(d) < mealSlot); // strict <: meal day belongs to the PRECEDING delivery slot
  if (candidates.length > 0) {
    return toDateString(getAbsoluteDate(candidates[candidates.length - 1], weekStart));
  }
  const prev = new Date(getAbsoluteDate(sorted[sorted.length - 1], weekStart));
  prev.setDate(prev.getDate() - 7);
  return toDateString(prev);
};
