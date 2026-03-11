import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronLeft, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { sileo } from 'sileo';
import RecipeIngredientEditor from './RecipeIngredientEditor';

// ── Constantes ──
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_LABELS = {
  Monday:    'Lunes',
  Tuesday:   'Martes',
  Wednesday: 'Miércoles',
  Thursday:  'Jueves',
  Friday:    'Viernes',
  Saturday:  'Sábado',
  Sunday:    'Domingo',
};

const MACRO_UNITS = ['g', 'oz', 'kg'];
const STEP_LABELS = ['Cliente', 'Menú', 'Ajustes', 'Confirmar'];

// ── Utilidades de fecha ──
const getWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStart: monday, weekEnd: sunday };
};

const toDateString = (date) => date.toISOString().split('T')[0];

// Returns the Date object of `dayOfWeek` within the week starting on `weekStart`
const getAbsoluteDate = (dayOfWeek, weekStart) => {
  const idx = DAYS_ORDER.indexOf(dayOfWeek);
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + idx);
  return date;
};

// Assigns each meal-day its delivery date = the next route delivery day >= that day.
// routeDeliveryDays: string[] e.g. ['Sunday', 'Wednesday']
// Falls back to the meal-day's own date if no route is provided.
// Given a meal's day-of-week, find the delivery date:
// The delivery happens on the LAST route day <= meal day (i.e. the most recent
// delivery day that is on or before the meal day).
// Example: route Sun+Wed, meal=Monday → delivery=Sunday (same week)
//          route Sun+Wed, meal=Thursday → delivery=Wednesday (same week)
//          route Sun+Wed, meal=Sunday → delivery=Sunday (same week)
// If no route day falls on or before the meal day (shouldn't happen with Sun),
// fall back to the last delivery day of the previous week.
// Delivery slot logic:
// The week runs Mon(0)…Sat(5), with Sun(6) treated as the START of the slot
// cycle (idx = -1 relative to Monday). A Sunday delivery covers Mon→next-slot.
//
// Algorithm: for a meal on dayOfWeek, find the latest route delivery day
// whose "slot index" is <= meal's slot index, where Sunday maps to -1.
//
// Example route Sun+Wed (slotIdx: Sun=-1, Wed=2):
//   Mon(0) → last delivery with slotIdx ≤ 0 → Sun(-1) → Sunday ✓
//   Tue(1) → Sun(-1) ✓
//   Wed(2) → Wed(2) ✓  (Wednesday covers itself)
//   Thu(3) → Wed(2) ✓
//   Fri(4) → Wed(2) ✓
//   Sat(5) → Wed(2) ✓
//   Sun(6) → Sun(-1)... but Sun's own slot covers the NEXT week cycle,
//             so map Sun meal → same-week Sunday delivery ✓
const getDateForDay = (dayOfWeek, weekStart, routeDeliveryDays) => {
  if (!routeDeliveryDays || routeDeliveryDays.length === 0) {
    return toDateString(getAbsoluteDate(dayOfWeek, weekStart));
  }

  // Slot index: Sunday = -1 (start of week), Mon=0 … Sat=5, Sun as meal = 6
  const slotIdx = (d) => d === 'Sunday' ? -1 : DAYS_ORDER.indexOf(d);
  const mealSlot = DAYS_ORDER.indexOf(dayOfWeek); // Mon=0…Sun=6

  const sorted = [...routeDeliveryDays].sort((a, b) => slotIdx(a) - slotIdx(b));

  // Find latest delivery whose slotIdx <= mealSlot
  // Special case: Sunday meal (idx 6) should map to the Sunday delivery of same week
  if (dayOfWeek === 'Sunday') {
    const hasSunday = sorted.includes('Sunday');
    if (hasSunday) return toDateString(getAbsoluteDate('Sunday', weekStart));
    // No Sunday delivery → last delivery day of this week
    const last = sorted[sorted.length - 1];
    return toDateString(getAbsoluteDate(last, weekStart));
  }

  // For Mon–Sat: find latest delivery slotIdx <= mealSlot
  const candidates = sorted.filter((d) => slotIdx(d) <= mealSlot);
  if (candidates.length > 0) {
    const best = candidates[candidates.length - 1];
    return toDateString(getAbsoluteDate(best, weekStart));
  }

  // No delivery precedes this meal day → shouldn't happen with a Sunday route,
  // but fall back to last delivery day of previous week
  const prev = new Date(getAbsoluteDate(sorted[sorted.length - 1], weekStart));
  prev.setDate(prev.getDate() - 7);
  return toDateString(prev);
};

const isFamily = (client) => client?.client_type === 'family';

// ── MacroPanel: reusable macro display/edit block ──
const MacroPanel = ({ label, colorClass, macros, overridden, onUpdate, onReset, macroInputClass, macroSelectClass }) => {
  const colors = {
    amber:  { border: 'border-amber-200', bg: 'bg-amber-50',  text: 'text-amber-700'  },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };
  const c = colors[colorClass] ?? colors.amber;
  return (
    <div className={`rounded-xl p-3 border ${c.border} ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold ${c.text}`}>{label}</p>
        {overridden && onReset && (
          <button type="button" onClick={onReset} className="text-xs text-slate-400 hover:text-slate-600 underline">
            Usar base
          </button>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Proteína</label>
          <div className="flex gap-1.5">
            <input type="number" min="0" value={macros?.protein_value ?? ''} onChange={(e) => onUpdate('protein_value', e.target.value)} className={macroInputClass ?? 'w-20 px-2 py-1.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800'} />
            <select value={macros?.protein_unit ?? 'g'} onChange={(e) => onUpdate('protein_unit', e.target.value)} className={macroSelectClass ?? 'px-2 py-1.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800'}>
              {['g','oz','kg'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Carbohidratos</label>
          <div className="flex gap-1.5">
            <input type="number" min="0" value={macros?.carb_value ?? ''} onChange={(e) => onUpdate('carb_value', e.target.value)} className={macroInputClass ?? 'w-20 px-2 py-1.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800'} />
            <select value={macros?.carb_unit ?? 'g'} onChange={(e) => onUpdate('carb_unit', e.target.value)} className={macroSelectClass ?? 'px-2 py-1.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800'}>
              {['g','oz','kg'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddOrder = ({ onSuccess }) => {
  const { supabase } = useApp();
  const { weekStart, weekEnd } = getWeekRange();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Paso 1: Cliente ──
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');

  // ── Paso 2: Menú ──
  const [menuType, setMenuType] = useState(null);
  // Personal
  const [lunchTemplates, setLunchTemplates] = useState([]);
  const [dinnerTemplates, setDinnerTemplates] = useState([]);
  const [selectedLunchTemplate, setSelectedLunchTemplate] = useState(null);
  const [selectedDinnerTemplate, setSelectedDinnerTemplate] = useState(null);
  // Familiar
  const [familyTemplates, setFamilyTemplates] = useState([]);
  const [selectedFamilyTemplate, setSelectedFamilyTemplate] = useState(null);
  const [familyRecipes, setFamilyRecipes] = useState([]); // recetas disponibles de la plantilla
  const [allRecipes, setAllRecipes] = useState([]); // todas las recetas del sistema

  const [extraRecipes, setExtraRecipes] = useState(0);
  const [resolvedRoute, setResolvedRoute] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [routeManuallyChanged, setRouteManuallyChanged] = useState(false);

  // ── Paso 3: Ajustes por día ──
  const [dayRecipes, setDayRecipes] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [lunchMacros, setLunchMacros] = useState(null);   // macros base almuerzo
  const [dinnerMacros, setDinnerMacros] = useState(null); // macros base cena
  const [dayMacros, setDayMacros] = useState({});          // overrides por día

  // recipeIngredients: { recipeId: { protein: [], carb: [], extra: [] } } — base desde BD
  const [recipeIngredients, setRecipeIngredients] = useState({});
  // ingredientOverrides: { 'day-recipeIndex': { protein: [], carb: [], extra: [] } | null }
  const [ingredientOverrides, setIngredientOverrides] = useState({});
  // extraMealTypes: { 'day-recipeIndex': 'Lunch' | 'Dinner' } — tipo de comida para platos extra
  const [extraMealTypes, setExtraMealTypes] = useState({});

  // ── Cargar clientes ──
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('clients')
        .select(`
          id_client, name, client_type,
          lunch_macro_profile_id, dinner_macro_profile_id,
          lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
            id_macro_profile, protein_value, protein_unit, carb_value, carb_unit
          ),
          dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
            id_macro_profile, protein_value, protein_unit, carb_value, carb_unit
          )
        `)
        .eq('is_active', true)
        .order('name');
      if (data) setClients(data);
    };
    fetch();
  }, []);

  // ── Inicializar macros globales al seleccionar cliente ──
  useEffect(() => {
    const lm = selectedClient?.lunch_macro;
    const dm = selectedClient?.dinner_macro;
    if (lm) setLunchMacros({ protein_value: lm.protein_value, protein_unit: lm.protein_unit, carb_value: lm.carb_value, carb_unit: lm.carb_unit, modified: false });
    if (dm) setDinnerMacros({ protein_value: dm.protein_value, protein_unit: dm.protein_unit, carb_value: dm.carb_value, carb_unit: dm.carb_unit, modified: false });
  }, [selectedClient]);

  // ── Cargar todas las recetas del sistema ──
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('recipes')
        .select('id_recipe, name')
        .eq('is_active', true)
        .order('name');
      if (data) setAllRecipes(data);
    };
    fetch();
  }, []);

  // ── Cargar plantillas según tipo de cliente ──
  useEffect(() => {
    if (!selectedClient) return;

    if (isFamily(selectedClient)) {
      // Plantillas familiares: meal_type = 'Family', sin días, solo lista de recetas
      const fetch = async () => {
        const { data } = await supabase
          .schema('operations')
          .from('order_templates')
          .select(`
            id_template, name, meal_type,
            order_template_details (
              id_template_detail, quantity,
              recipes ( id_recipe, name )
            )
          `)
          .eq('is_active', true)
          .eq('meal_type', 'Family')
          .order('id_template', { ascending: false });
        setFamilyTemplates(data ?? []);
      };
      fetch();
    }
  }, [selectedClient]);

  // ── Cargar plantillas personales según menuType ──
  useEffect(() => {
    if (!menuType || isFamily(selectedClient)) return;
    const fetchTemplates = async () => {
      const types = menuType === 'both' ? ['Lunch', 'Dinner'] : [menuType];
      for (const type of types) {
        const { data } = await supabase
          .schema('operations')
          .from('order_templates')
          .select(`
            id_template, name, meal_type,
            order_template_days (
              id_template_day, day_of_week,
              order_template_details (
                id_template_detail, quantity,
                recipes ( id_recipe, name )
              )
            )
          `)
          .eq('is_active', true)
          .eq('meal_type', type)
          .order('id_template', { ascending: false });
        if (type === 'Lunch') setLunchTemplates(data ?? []);
        else setDinnerTemplates(data ?? []);
      }
    };
    fetchTemplates();
  }, [menuType, selectedClient]);

  // ── Cargar todas las rutas activas ──
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('is_active', true)
        .order('id_route');
      if (data) setAllRoutes(data);
    };
    fetch();
  }, []);

  // ── Resolver ruta personal ──
  const resolveRoute = async (type, extras) => {
    const needsComplete = type === 'both' || extras > 3;
    const { data } = await supabase
      .schema('operations')
      .from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('route_type', needsComplete ? 'complete' : 'individual')
      .eq('is_active', true)
      .maybeSingle();
    setResolvedRoute(data ?? null);
    return data;
  };

  // ── Resolver ruta familiar (siempre family) ──
  const resolveFamilyRoute = async () => {
    const { data } = await supabase
      .schema('operations')
      .from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('route_type', 'family')
      .eq('is_active', true)
      .maybeSingle();
    // If no dedicated family route exists, try to find any route with Friday delivery
    if (data) { setResolvedRoute(data); return; }
    const { data: fallback } = await supabase
      .schema('operations')
      .from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('is_active', true)
      .limit(10);
    const fridayRoute = (fallback ?? []).find((r) =>
      r.route_delivery_days?.some((d) => d.day_of_week === 'Friday')
    );
    setResolvedRoute(fridayRoute ?? null);
  };

  // ── Re-evaluar ruta personal cuando cambian extras (solo personal) ──
  useEffect(() => {
    if (step !== 3 || !menuType || isFamily(selectedClient)) return;
    resolveRoute(menuType, extraRecipes);
  }, [extraRecipes, step]);

  // ── Construir dayRecipes para cliente personal desde plantillas ──
  const buildDayRecipesFromTemplates = (lunchTpl, dinnerTpl) => {
    const result = {};
    const addFromTemplate = (tpl) => {
      if (!tpl) return;
      for (const day of tpl.order_template_days ?? []) {
        if (!result[day.day_of_week]) result[day.day_of_week] = [];
        for (const detail of day.order_template_details ?? []) {
          result[day.day_of_week].push({ recipe_id: detail.recipes.id_recipe, recipe_name: detail.recipes.name, quantity: detail.quantity, isExtra: false });
        }
      }
    };
    addFromTemplate(lunchTpl);
    addFromTemplate(dinnerTpl);
    setDayRecipes(result);
    const macros = {};
    Object.keys(result).forEach((d) => { macros[d] = null; });
    setDayMacros(macros);
    const expanded = {};
    Object.keys(result).forEach((d) => { expanded[d] = true; });
    setExpandedDays(expanded);
    setIngredientOverrides({});
    // Cargar ingredientes base de todas las recetas
    const ids = Object.values(result).flat().map((r) => r.recipe_id).filter(Boolean);
    fetchRecipeIngredients(ids);
  };

  // ── Construir dayRecipes para cliente familiar: 7 días vacíos ──
  const buildFamilyDayRecipes = (template) => {
    // Guardar lista de recetas disponibles de la plantilla
    const recipes = (template?.order_template_details ?? []).map((d) => ({
      id_recipe: d.recipes.id_recipe,
      name: d.recipes.name,
    }));
    setFamilyRecipes(recipes);

    // 7 días vacíos
    const result = {};
    DAYS_ORDER.forEach((d) => { result[d] = []; });
    setDayRecipes(result);
    const macros = {};
    DAYS_ORDER.forEach((d) => { macros[d] = null; });
    setDayMacros(macros);
    // Solo viernes expandido por defecto
    const expanded = {};
    DAYS_ORDER.forEach((d) => { expanded[d] = d === 'Friday'; });
    setExpandedDays(expanded);
  };

  // ── Cargar ingredientes base de recetas ──
  const fetchRecipeIngredients = async (recipeIds) => {
    if (!recipeIds || recipeIds.length === 0) return;
    const unique = [...new Set(recipeIds.filter(Boolean))];
    const { data, error } = await supabase
      .schema('operations')
      .from('recipe_ingredients')
      .select('recipe_id, name, category')
      .in('recipe_id', unique);

    if (error) { console.error(error); return; }

    const grouped = {};
    for (const row of data ?? []) {
      if (!grouped[row.recipe_id]) grouped[row.recipe_id] = { protein: [], carb: [], extra: [] };
      if (grouped[row.recipe_id][row.category]) grouped[row.recipe_id][row.category].push(row.name);
    }
    setRecipeIngredients((prev) => ({ ...prev, ...grouped }));
  };

  // ── Helpers recetas ──
  const addRecipeToDay = (day, recipeId, recipeName) => {
    setDayRecipes((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { recipe_id: recipeId || '', recipe_name: recipeName || '', quantity: 1, isExtra: !isFamily(selectedClient) }],
    }));
    if (!isFamily(selectedClient)) setExtraRecipes((n) => n + 1);
  };

  const updateRecipeInDay = (day, index, field, value) => {
    if (field === 'recipe_id') {
      const id = Number(value);
      const found = allRecipes.find((r) => r.id_recipe === id);
      setDayRecipes((prev) => {
        const updated = [...(prev[day] || [])];
        updated[index] = { ...updated[index], recipe_id: id, recipe_name: found?.name || '' };
        return { ...prev, [day]: updated };
      });
      // Load base ingredients if not already cached
      if (id && !recipeIngredients[id]) fetchRecipeIngredients([id]);
    } else {
      setDayRecipes((prev) => {
        const updated = [...(prev[day] || [])];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, [day]: updated };
      });
    }
  };

  const removeRecipeFromDay = (day, index) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] || [])];
      const wasExtra = updated[index].isExtra;
      updated.splice(index, 1);
      if (wasExtra) setExtraRecipes((n) => Math.max(0, n - 1));
      return { ...prev, [day]: updated };
    });
  };

  // ── Helpers macros ──
  // Devuelve los macros base según clasificación del pedido
  const getBaseMacros = (classification) => classification === 'Dinner' ? dinnerMacros : lunchMacros;

  // Editar macros base por tipo
  const updateLunchMacro = (field, value) => setLunchMacros((prev) => ({ ...prev, [field]: value, modified: true }));
  const updateDinnerMacro = (field, value) => setDinnerMacros((prev) => ({ ...prev, [field]: value, modified: true }));

  // Override por día — cuando se guarda, usa los macros base del tipo de ese día como punto de partida
  const updateDayMacro = (day, classification, field, value) => {
    setDayMacros((prev) => {
      const base = getBaseMacros(classification);
      const existing = prev?.[day]?.[classification] || { ...base };
      return { ...prev, [day]: { ...(prev[day] || {}), [classification]: { ...existing, [field]: value, modified: true } } };
    });
  };
  const resetDayMacros = (day, classification) => {
    if (classification) {
      setDayMacros((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), [classification]: null } }));
    } else {
      setDayMacros((prev) => ({ ...prev, [day]: null }));
    }
  };

  // Macros efectivos de un día: override > base por clasificación
  const getEffectiveMacros = (day, classification) => dayMacros?.[day]?.[classification] ?? getBaseMacros(classification);

  // Resetear macros base a todos los días
  const applyBaseToAllDays = () => {
    const newDayMacros = {};
    Object.keys(dayRecipes).forEach((d) => { newDayMacros[d] = null; });
    setDayMacros(newDayMacros);
    sileo.success('Macros base aplicados a todos los días');
  };

  // ── Navegación ──
  const canGoNext = () => {
    if (step === 1) return selectedClient !== null;
    if (step === 2) {
      if (isFamily(selectedClient)) return true; // never reached, but safe fallback
      if (!menuType) return false;
      if (menuType === 'Lunch') return selectedLunchTemplate !== null;
      if (menuType === 'Dinner') return selectedDinnerTemplate !== null;
      if (menuType === 'both') return selectedLunchTemplate !== null && selectedDinnerTemplate !== null;
    }
    return true;
  };

  const goNext = async () => {
    if (step === 1 && isFamily(selectedClient)) {
      // Familia: saltar paso 2, inicializar días vacíos y resolver ruta
      await resolveFamilyRoute();
      buildFamilyDayRecipes(null); // días vacíos, sin plantilla
      setStep(3);
      return;
    }
    if (step === 2) {
      if (isFamily(selectedClient)) {
        await resolveFamilyRoute();
        buildFamilyDayRecipes(selectedFamilyTemplate);
      } else {
        await resolveRoute(menuType, extraRecipes);
        buildDayRecipesFromTemplates(
          menuType !== 'Dinner' ? selectedLunchTemplate : null,
          menuType !== 'Lunch' ? selectedDinnerTemplate : null,
        );
      }
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 3 && isFamily(selectedClient)) {
      setStep(1); // skip step 2 for family clients
      return;
    }
    setStep((s) => s - 1);
  };

  // ── Guardar ──
  const handleSubmit = async () => {
    setLoading(true);
    const weekStartStr = toDateString(weekStart);
    const weekEndStr = toDateString(weekEnd);
    const activeDays = Object.keys(dayRecipes).filter((d) => (dayRecipes[d] || []).some((r) => r.recipe_id));
    const menuTypes = isFamily(selectedClient) ? ['Family'] : (menuType === 'both' ? ['Lunch', 'Dinner'] : [menuType]);
    // Route delivery days for delivery_date calculation
    const routeDeliveryDays = (resolvedRoute?.route_delivery_days ?? []).map((d) => d.day_of_week);

    for (const type of menuTypes) {
      const templateId = type === 'Lunch' ? selectedLunchTemplate?.id_template
        : type === 'Dinner' ? selectedDinnerTemplate?.id_template
        : selectedFamilyTemplate?.id_template;

      const { data: orderData, error: orderError } = await supabase
        .schema('operations')
        .from('orders')
        .insert([{
          client_id: selectedClient.id_client,
          template_id: templateId,
          week_start_date: weekStartStr,
          week_end_date: weekEndStr,
          route_id: resolvedRoute?.id_route ?? null,
          classification: type,
          status: 'PENDING',
          macro_profile_snapshot_id: (type === 'Dinner' ? selectedClient?.dinner_macro_profile_id : selectedClient?.lunch_macro_profile_id) ?? null,
          protein_snapshot: (type === 'Dinner' ? dinnerMacros?.protein_value : lunchMacros?.protein_value) ?? null,
          protein_unit_snapshot: (type === 'Dinner' ? dinnerMacros?.protein_unit : lunchMacros?.protein_unit) ?? null,
          carb_snapshot: (type === 'Dinner' ? dinnerMacros?.carb_value : lunchMacros?.carb_value) ?? null,
          carb_unit_snapshot: (type === 'Dinner' ? dinnerMacros?.carb_unit : lunchMacros?.carb_unit) ?? null,
        }])
        .select('id_order')
        .single();

      if (orderError) { sileo.error('Error al crear el pedido'); console.error(orderError); setLoading(false); return; }

      const orderId = orderData.id_order;

      for (const day of activeDays) {
        const { data: dayData, error: dayError } = await supabase
          .schema('operations')
          .from('order_days')
          .insert([{ order_id: orderId, day_of_week: day, delivery_date: getDateForDay(day, weekStart, routeDeliveryDays), status: 'PENDING' }])
          .select('id_order_day')
          .single();

        if (dayError) { sileo.error(`Error al crear el día ${DAY_LABELS[day]}`); console.error(dayError); setLoading(false); return; }

        const details = (dayRecipes[day] || []).filter((r) => r.recipe_id);
        if (details.length > 0) {
          const { data: detailsData, error: detailsError } = await supabase
            .schema('operations')
            .from('order_day_details')
            .insert(details.map((r, i) => {
              // Extras can override which macro profile to use (Lunch/Dinner)
              const effectiveType = r.isExtra
                ? (extraMealTypes[`${day}-${i}`] ?? type)
                : type;
              const eff = getEffectiveMacros(day, effectiveType);
              return {
                order_day_id: dayData.id_order_day,
                recipe_id: r.recipe_id,
                quantity: Number(r.quantity) || 1,
                protein_value_applied: eff?.protein_value ?? null,
                protein_unit_applied: eff?.protein_unit ?? null,
                carb_value_applied: eff?.carb_value ?? null,
                carb_unit_applied: eff?.carb_unit ?? null,
              };
            }))
            .select('id_order_day_detail');
          if (detailsError) { sileo.error(`Error al guardar recetas del día ${DAY_LABELS[day]}`); console.error(detailsError); setLoading(false); return; }

          // Guardar overrides de ingredientes si los hay
          const overrideRows = [];
          (detailsData ?? []).forEach((detail, i) => {
            const key = `${day}-${i}`;
            const override = ingredientOverrides[key];
            if (!override) return;
            for (const category of ['protein', 'carb', 'extra']) {
              for (const ingName of override[category] ?? []) {
                overrideRows.push({ order_day_detail_id: detail.id_order_day_detail, name: ingName, category });
              }
            }
          });
          if (overrideRows.length > 0) {
            const { error: overrideError } = await supabase
              .schema('operations')
              .from('order_day_recipe_overrides')
              .insert(overrideRows);
            if (overrideError) { console.error('Error al guardar overrides:', overrideError); }
          }
        }
      }
    }

    sileo.success('Pedido registrado correctamente');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  // ── Estilos ──
  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm';
  const labelClass = 'block text-sm font-medium text-slate-600 mb-1';
  const macroInputClass = 'px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 w-24';
  const macroSelectClass = 'px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white';

  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const familyClient = isFamily(selectedClient);

  return (
    <div className="bg-slate-50 p-8 flex justify-center" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Nuevo Pedido</h1>
        <p className="text-sm text-slate-500 mb-6">
          Semana: {weekStart.toLocaleDateString('es-CR', { day: '2-digit', month: 'long' })} — {weekEnd.toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {/* Stepper — familia omite paso 2 */}
        <div className="flex items-center mb-8">
          {(isFamily(selectedClient)
            ? [{ label: 'Cliente', real: 1 }, { label: 'Ajustes', real: 3 }, { label: 'Confirmar', real: 4 }]
            : STEP_LABELS.map((label, i) => ({ label, real: i + 1 }))
          ).map(({ label, real }, i, arr) => {
            const isActive = step === real;
            const isDone   = step > real;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {isDone ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > real ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── PASO 1: Cliente ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Buscar cliente</label>
              <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Escribe el nombre..." spellCheck="false" autoComplete="off" className={inputClass} autoFocus />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredClients.map((c) => (
                <button key={c.id_client} type="button" onClick={() => setSelectedClient(c)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${selectedClient?.id_client === c.id_client ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.client_type === 'family'
                        ? selectedClient?.id_client === c.id_client ? 'bg-purple-700 text-purple-100' : 'bg-purple-50 text-purple-700'
                        : selectedClient?.id_client === c.id_client ? 'bg-blue-700 text-blue-100' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {c.client_type === 'family' ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
                    </span>
                  </div>
                  {c.lunch_macro && (
                    <p className={`text-xs mt-0.5 ${selectedClient?.id_client === c.id_client ? 'text-slate-300' : 'text-slate-400'}`}>
                      ☀️ {c.lunch_macro.protein_value}{c.lunch_macro.protein_unit} · {c.lunch_macro.carb_value}{c.lunch_macro.carb_unit}
                      {c.dinner_macro && <span className="ml-2">🌙 {c.dinner_macro.protein_value}{c.dinner_macro.protein_unit} · {c.dinner_macro.carb_value}{c.dinner_macro.carb_unit}</span>}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PASO 2: Menú ── */}
        {step === 2 && (
          <div className="space-y-6">

            {/* FAMILIAR */}
            {familyClient ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded-full">👨‍👩‍👧 Cliente Familiar</span>
                  <span className="text-xs text-slate-400">Entrega automática los Viernes</span>
                </div>
                <label className={labelClass}>Plantilla familiar</label>
                <div className="space-y-2 mt-1">
                  {familyTemplates.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay plantillas familiares disponibles</p>
                  ) : familyTemplates.map((t) => {
                    const selected = selectedFamilyTemplate?.id_template === t.id_template;
                    return (
                      <button key={t.id_template} type="button" onClick={() => setSelectedFamilyTemplate(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${selected ? 'bg-purple-50 border-purple-400 text-purple-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}
                      >
                        <p className="font-medium">{t.name}</p>
                        {selected && (
                          <p className="text-xs mt-1 text-purple-600">
                            {(t.order_template_details ?? []).length} recetas disponibles
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Preview recetas de la plantilla seleccionada */}
                {selectedFamilyTemplate && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">Recetas disponibles para asignar por día:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedFamilyTemplate.order_template_details ?? []).map((d) => (
                        <span key={d.id_template_detail} className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                          {d.recipes.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* PERSONAL */
              <>
                <div>
                  <label className={labelClass}>Tipo de menú</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { value: 'Lunch',  label: '☀️ Solo Almuerzo' },
                      { value: 'Dinner', label: '🌙 Solo Cena' },
                      { value: 'both',   label: '✨ Ambos' },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setMenuType(opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${menuType === opt.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {(menuType === 'Lunch' || menuType === 'both') && (
                  <div>
                    <label className={labelClass}>Plantilla de Almuerzo</label>
                    <div className="space-y-2 mt-1">
                      {lunchTemplates.length === 0 ? <p className="text-xs text-slate-400 italic">No hay plantillas de almuerzo disponibles</p>
                        : lunchTemplates.map((t) => (
                          <button key={t.id_template} type="button" onClick={() => setSelectedLunchTemplate(t)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${selectedLunchTemplate?.id_template === t.id_template ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}
                          >{t.name}</button>
                        ))}
                    </div>
                  </div>
                )}

                {(menuType === 'Dinner' || menuType === 'both') && (
                  <div>
                    <label className={labelClass}>Plantilla de Cena</label>
                    <div className="space-y-2 mt-1">
                      {dinnerTemplates.length === 0 ? <p className="text-xs text-slate-400 italic">No hay plantillas de cena disponibles</p>
                        : dinnerTemplates.map((t) => (
                          <button key={t.id_template} type="button" onClick={() => setSelectedDinnerTemplate(t)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${selectedDinnerTemplate?.id_template === t.id_template ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}
                          >{t.name}</button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PASO 3: Ajustes ── */}
        {step === 3 && (
          <div className="space-y-5">

            {/* Ruta resuelta */}
            {resolvedRoute && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Ruta asignada automáticamente</p>
                <p className="text-sm font-semibold text-slate-800">{resolvedRoute.name}</p>
                <div className="flex gap-1 mt-1">
                  {resolvedRoute.route_delivery_days?.map((d, i) => (
                    <span key={i} className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                      {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Macros base — Almuerzo y/o Cena */}
            {!familyClient && (lunchMacros || dinnerMacros) && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Macros del pedido</p>
                    <p className="text-xs text-slate-400">Base por tipo de comida. Puedes sobreescribir por día.</p>
                  </div>
                  <button type="button" onClick={applyBaseToAllDays} className="text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition flex items-center gap-1">
                    <RefreshCw size={12} /> Resetear días
                  </button>
                </div>

                <div className={`grid gap-3 ${menuType === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {lunchMacros && (menuType === 'Lunch' || menuType === 'both') && (
                    <MacroPanel
                      label="☀️ Almuerzo" colorClass="amber"
                      macros={lunchMacros}
                      onUpdate={updateLunchMacro}
                      macroInputClass={macroInputClass} macroSelectClass={macroSelectClass}
                    />
                  )}
                  {dinnerMacros && (menuType === 'Dinner' || menuType === 'both') && (
                    <MacroPanel
                      label="🌙 Cena" colorClass="indigo"
                      macros={dinnerMacros}
                      onUpdate={updateDinnerMacro}
                      macroInputClass={macroInputClass} macroSelectClass={macroSelectClass}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Días */}
            {DAYS_ORDER.map((day) => {
              const recipes = dayRecipes[day] ?? [];
              // Para personal: solo mostrar días con recetas
              // Para familiar: mostrar todos los 7 días
              // Siempre mostrar el día — permite agregar recetas aunque esté vacío


              const isExpanded = expandedDays[day] ?? false;

              return (
                <div key={day} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setExpandedDays((p) => ({ ...p, [day]: !p[day] }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 text-sm">{DAY_LABELS[day]}</span>
                      {day === 'Friday' && familyClient && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Día de entrega</span>
                      )}
                      {dayMacros?.[day] && Object.values(dayMacros[day]).some(Boolean) && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Macros modificados</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {recipes.length} receta{recipes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {/* Recetas — lista única, sin distinción de tipo */}
                      <div className="space-y-2">
                        {recipes.map((item, index) => (
                          <div key={`${day}-${index}`} className="space-y-1">
                            <div className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                              {familyClient ? (
                                <select value={item.recipe_id || ''}
                                  onChange={(e) => updateRecipeInDay(day, index, 'recipe_id', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                                >
                                  <option value="">Seleccionar receta</option>
                                  {allRecipes.map((r) => <option key={r.id_recipe} value={r.id_recipe}>{r.name}</option>)}
                                </select>
                              ) : item.isExtra ? (
                                <>
                                  <select value={item.recipe_id || ''}
                                    onChange={(e) => updateRecipeInDay(day, index, 'recipe_id', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                                  >
                                    <option value="">Seleccionar receta</option>
                                    {allRecipes.map((r) => <option key={r.id_recipe} value={r.id_recipe}>{r.name}</option>)}
                                  </select>
                                  {menuType === 'both' && (
                                    <div className="flex rounded-xl overflow-hidden border border-slate-200 shrink-0 text-xs font-medium">
                                      {['Lunch', 'Dinner'].map((cls) => (
                                        <button key={cls} type="button"
                                          onClick={() => setExtraMealTypes((prev) => ({ ...prev, [`${day}-${index}`]: cls }))}
                                          className={`px-2 py-1.5 transition ${
                                            (extraMealTypes[`${day}-${index}`] ?? 'Lunch') === cls
                                              ? cls === 'Lunch' ? 'bg-amber-400 text-white' : 'bg-indigo-500 text-white'
                                              : 'bg-white text-slate-400 hover:bg-slate-50'
                                          }`}
                                        >
                                          {cls === 'Lunch' ? '☀️' : '🌙'}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="flex-1 text-sm text-slate-700 px-3 py-2">{item.recipe_name}</span>
                              )}
                              <input type="number" min="1" value={item.quantity}
                                onChange={(e) => updateRecipeInDay(day, index, 'quantity', e.target.value)}
                                className="w-16 px-2 py-1.5 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
                              />
                              <button type="button" onClick={() => removeRecipeFromDay(day, index)} className="text-red-400 hover:text-red-600 transition">✕</button>
                            </div>
                            {item.recipe_id ? (
                              <RecipeIngredientEditor
                                recipeName={item.recipe_name}
                                baseIngredients={recipeIngredients[item.recipe_id] ?? { protein: [], carb: [], extra: [] }}
                                value={ingredientOverrides[`${day}-${index}`] ?? null}
                                onChange={(val) => setIngredientOverrides((prev) => ({ ...prev, [`${day}-${index}`]: val }))}
                              />
                            ) : null}
                          </div>
                        ))}
                        <button type="button" onClick={() => addRecipeToDay(day)}
                          className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition mt-1"
                        >
                          + {familyClient ? 'Agregar receta' : 'Agregar receta extra'}
                        </button>
                      </div>

                      {/* Macros por día — columnas según menuType */}
                      {!familyClient && (
                        <div className="border-t border-slate-100 pt-3">
                          <div className={`grid gap-3 ${menuType === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {['Lunch', 'Dinner'].filter((cls) => menuType === 'both' || menuType === cls).map((cls) => {
                              const dayOverride = dayMacros?.[day]?.[cls];
                              const hasCls = dayOverride !== null && dayOverride !== undefined;
                              const effCls = hasCls ? dayOverride : getBaseMacros(cls);
                              return (
                                <MacroPanel
                                  key={cls}
                                  label={cls === 'Lunch' ? '☀️ Almuerzo' : '🌙 Cena'}
                                  colorClass={cls === 'Lunch' ? 'amber' : 'indigo'}
                                  macros={effCls}
                                  overridden={hasCls}
                                  onUpdate={(field, value) => updateDayMacro(day, cls, field, value)}
                                  onReset={() => resetDayMacros(day, cls)}
                                  macroInputClass={macroInputClass} macroSelectClass={macroSelectClass}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PASO 4: Confirmar ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">

              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800">{selectedClient?.name}</p>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${familyClient ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                  {familyClient ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Semana</p>
                <p className="text-sm text-slate-700">{weekStart.toLocaleDateString('es-CR')} — {weekEnd.toLocaleDateString('es-CR')}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Menú</p>
                <p className="text-sm text-slate-700">
                  {familyClient ? (selectedFamilyTemplate?.name ? `Familiar — ${selectedFamilyTemplate.name}` : 'Familiar')
                    : menuType === 'both' ? 'Almuerzo + Cena'
                    : menuType === 'Lunch' ? 'Solo Almuerzo' : 'Solo Cena'}
                </p>
              </div>

              {/* Ruta con opción de cambio manual */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Ruta</p>
                {!showRouteSelector ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {resolvedRoute?.name ?? (familyClient ? 'Sin ruta familiar configurada' : 'Sin ruta')}
                      </p>
                      {resolvedRoute?.route_delivery_days?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {resolvedRoute.route_delivery_days.map((d, i) => (
                            <span key={i} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                              {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {routeManuallyChanged ? 'Asignada manualmente' : 'Asignada automáticamente'}
                      </p>
                    </div>
                    {!familyClient && (
                      <button type="button" onClick={() => setShowRouteSelector(true)}
                        className="text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition shrink-0 ml-4"
                      >
                        Cambiar ruta
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Selecciona una ruta:</p>
                    {allRoutes.map((route) => (
                      <button key={route.id_route} type="button"
                        onClick={() => { setResolvedRoute(route); setShowRouteSelector(false); setRouteManuallyChanged(true); }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${resolvedRoute?.id_route === route.id_route ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                      >
                        <p className="font-medium">{route.name}</p>
                        {route.route_delivery_days?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {route.route_delivery_days.map((d, i) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${resolvedRoute?.id_route === route.id_route ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                                {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                    <button type="button" onClick={() => setShowRouteSelector(false)} className="text-xs text-slate-400 hover:text-slate-600 underline">Cancelar</button>
                  </div>
                )}
              </div>

              {!familyClient && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Macros globales del pedido</p>
                  <p className="text-sm text-slate-700">
                    {lunchMacros && <>☀️ {lunchMacros.protein_value}{lunchMacros.protein_unit} prot · {lunchMacros.carb_value}{lunchMacros.carb_unit} carbos</>}
                    {dinnerMacros && <span className="ml-2">🌙 {dinnerMacros.protein_value}{dinnerMacros.protein_unit} prot · {dinnerMacros.carb_value}{dinnerMacros.carb_unit} carbos</span>}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Días con recetas</p>
                {DAYS_ORDER.filter((d) => (dayRecipes[d] || []).some((r) => r.recipe_id)).map((day) => {
                  // dayMacros[day] = { Lunch?: {...}, Dinner?: {...} } — iterate entries
                  const overriddenClasses = Object.entries(dayMacros?.[day] ?? {})
                    .filter(([, v]) => v !== null && v !== undefined);
                  return (
                    <div key={day} className="flex items-start gap-2 mb-1.5">
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium min-w-[50px] text-center shrink-0">{DAY_LABELS[day]}</span>
                      <div>
                        <p className="text-xs text-slate-600">
                          {dayRecipes[day].filter((r) => r.recipe_id).map((r) => r.recipe_name || 'Receta').join(', ')}
                        </p>
                        {overriddenClasses.map(([cls, m]) => (
                          <p key={cls} className="text-xs text-blue-600">
                            {cls === 'Lunch' ? '☀️' : '🌙'} {m.protein_value ?? '—'}{m.protein_unit ?? ''} prot · {m.carb_value ?? '—'}{m.carb_unit ?? ''} carbos
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Navegación ── */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button type="button" onClick={goBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-400 transition text-sm font-medium"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
          ) : <div />}

          {step < 4 ? (
            <button type="button" onClick={goNext} disabled={!canGoNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
            >
              <Check size={16} />
              {loading ? 'Guardando...' : 'Confirmar Pedido'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AddOrder;