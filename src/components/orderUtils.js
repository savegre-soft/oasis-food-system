// ── Shared constants & date utilities for order management ────────────────────

export const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export const DAY_LABELS = {
  Monday:'Lunes', Tuesday:'Martes', Wednesday:'Miércoles',
  Thursday:'Jueves', Friday:'Viernes', Saturday:'Sábado', Sunday:'Domingo',
};

export const DAY_SHORT = {
  Monday:'Lun', Tuesday:'Mar', Wednesday:'Mié',
  Thursday:'Jue', Friday:'Vie', Saturday:'Sáb', Sunday:'Dom',
};

export const MACRO_UNITS = ['g','oz','kg'];

export const isFamily = (client) => client?.client_type === 'family';

export const toDateString = (date) => date.toISOString().split('T')[0];

// Next week's Monday/Sunday (orders placed this week, delivered next week)
export const getWeekRange = () => {
  const today = new Date();
  const diff  = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStart: monday, weekEnd: sunday };
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
export const cycleIdx = (d) => d === 'Sunday' ? -1 : DAYS_ORDER.indexOf(d);

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
  const mealSlot   = DAYS_ORDER.indexOf(dayOfWeek);
  const candidates = sorted.filter(d => cycleIdx(d) < mealSlot);  // strict <: meal day belongs to the PRECEDING slot
  if (candidates.length > 0) {
    return toDateString(getAbsoluteDate(candidates[candidates.length - 1], weekStart));
  }
  const prev = new Date(getAbsoluteDate(sorted[sorted.length - 1], weekStart));
  prev.setDate(prev.getDate() - 7);
  return toDateString(prev);
};