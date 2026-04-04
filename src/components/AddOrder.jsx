import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import MacroPanel from './MacroPanel';
import OrderAdjustments from './OrderAdjustments';
import RecipeIngredientEditor from './RecipeIngredientEditor';
import { useDayRecipes } from './useDayRecipes';
import { useMacros } from './useMacros';
import {
  DAYS_ORDER, DAY_LABELS, DAY_SHORT,
  isFamily, getWeekRange, toDateString,
  getDateForDay,
} from './orderUtils';

// ── Constants ────────────────────────────────────────────────────────────────
const STANDARD_MACRO = { protein_value: 120, protein_unit: 'g', carb_value: 120, carb_unit: 'g' };

// ── Step labels ───────────────────────────────────────────────────────────────
const PERSONAL_STEPS = ['Cliente', 'Menú', 'Ajustes', 'Confirmar'];
const FAMILY_STEPS   = ['Cliente', 'Ajustes', 'Confirmar'];
const EXPRESS_STEPS  = ['Cliente', 'Menú', 'Confirmar'];

// ── AddOrder ──────────────────────────────────────────────────────────────────
const AddOrder = ({ onSuccess }) => {
  const { supabase } = useApp();
  const { weekStart, weekEnd } = getWeekRange();

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1 — Client
  const [clients,        setClients]        = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch,   setClientSearch]   = useState('');

  // Step 2 — Menu (personal only)
  const [menuType,              setMenuType]              = useState(null);
  const [lunchTemplates,        setLunchTemplates]        = useState([]);
  const [dinnerTemplates,       setDinnerTemplates]       = useState([]);
  const [selectedLunchTemplate, setSelectedLunchTemplate] = useState(null);
  const [selectedDinnerTemplate,setSelectedDinnerTemplate]= useState(null);
  const [familyTemplates,       setFamilyTemplates]       = useState([]);
  const [selectedFamilyTemplate,setSelectedFamilyTemplate]= useState(null);

  // Step 3 — Route
  const [resolvedRoute,       setResolvedRoute]       = useState(null);
  const [allRoutes,           setAllRoutes]           = useState([]);
  const [routeManuallyChanged,setRouteManuallyChanged]= useState(false);
  const [allRecipes,          setAllRecipes]          = useState([]);
  const [extraMealTypes,      setExtraMealTypes]      = useState({});

  const [loading,   setLoading]   = useState(false);
  const [isExpress,      setIsExpress]      = useState(false);
  // Express: direct recipe list [{recipe_id, recipe_name, quantity}]
  const [expressRecipes,            setExpressRecipes]            = useState([]);
  const [expressType,               setExpressType]               = useState('Lunch'); // 'Lunch' | 'Dinner'
  const [expressIngredientOverrides,setExpressIngredientOverrides]= useState({}); // { idx: {protein,carb,extra} }
  const [expressMacros,             setExpressMacros]             = useState({ protein_value: '', protein_unit: 'g', carb_value: '', carb_unit: 'g' });

  const familyClient = selectedClient ? isFamily(selectedClient) : false;

  // ── Hooks ────────────────────────────────────────────────────────────────────
  const {
    dayRecipes, recipeIngredients, ingredientOverrides, setIngredientOverrides, expandedDays,
    addRecipeToDay, updateRecipeInDay, removeRecipeFromDay,
    setOverride, toggleDay, setDayRecipes, fetchRecipeIngredients,
  } = useDayRecipes();

  const {
    lunchMacros, setLunchMacros, dinnerMacros, setDinnerMacros,
    updateLunchMacro, updateDinnerMacro,
    updateDayMacro, resetDayMacro, resetAllDayMacros,
    getEffectiveMacros, isDayOverridden,
  } = useMacros();

  // Derived count of extra recipes across all days (drives route type)
  const extraCount = Object.values(dayRecipes).flat().filter(r => r.isExtra && r.recipe_id).length;

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.schema('operations').from('clients')
        .select(`id_client, name, client_type, lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey(id_macro_profile,name,protein_value,protein_unit,carb_value,carb_unit), dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey(id_macro_profile,name,protein_value,protein_unit,carb_value,carb_unit)`)
        .order('name');
      setClients(data ?? []);
    };
    const fetchRoutes = async () => {
      const { data } = await supabase.schema('operations').from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)').eq('is_active', true);
      setAllRoutes(data ?? []);
    };
    const fetchAllRecipes = async () => {
      const { data } = await supabase.schema('operations').from('recipes')
        .select('id_recipe, name').eq('is_active', true).order('name');
      setAllRecipes(data ?? []);
    };
    fetchClients(); fetchRoutes(); fetchAllRecipes();
  }, []);

  // ── Reset when client changes — clears step + all order state ───────────────
  useEffect(() => {
    if (!selectedClient) return;  // don't reset on initial null
    setStep(1);
    setMenuType(null);
    setSelectedLunchTemplate(null);
    setSelectedDinnerTemplate(null);
    setSelectedFamilyTemplate(null);
    setResolvedRoute(null);
    setRouteManuallyChanged(false);
    setIsExpress(false);
    setExpressRecipes([]);
    setExpressIngredientOverrides({});
    const emptyDays = {};
    DAYS_ORDER.forEach(d => { emptyDays[d] = []; });
    setDayRecipes(emptyDays);
    setIngredientOverrides({});
  }, [selectedClient]);

  // ── Set macros when client selected ──────────────────────────────────────
  useEffect(() => {
    if (!selectedClient) return;
    const lm = selectedClient.lunch_macro;
    const dm = selectedClient.dinner_macro;
    if (lm) setLunchMacros({ protein_value: lm.protein_value, protein_unit: lm.protein_unit, carb_value: lm.carb_value, carb_unit: lm.carb_unit });
    if (dm) setDinnerMacros({ protein_value: dm.protein_value, protein_unit: dm.protein_unit, carb_value: dm.carb_value, carb_unit: dm.carb_unit });
  }, [selectedClient]);

  // ── Reset dayRecipes when switching between express/normal ─────────────────
  useEffect(() => {
    const emptyDays = {};
    DAYS_ORDER.forEach(d => { emptyDays[d] = []; });
    setDayRecipes(emptyDays);
    setIngredientOverrides({});
    setStep(prev => prev > 2 ? 2 : prev); // snap back to step 2 max if past it
  }, [isExpress]);

  // ── Auto-load expressMacros from client profile when type changes ─────────
  useEffect(() => {
    if (!selectedClient || !isExpress) return;
    const macro = expressType === 'Dinner'
      ? selectedClient.dinner_macro
      : selectedClient.lunch_macro;
    if (macro) {
      setExpressMacros({ protein_value: macro.protein_value, protein_unit: macro.protein_unit, carb_value: macro.carb_value, carb_unit: macro.carb_unit });
    } else {
      setExpressMacros(STANDARD_MACRO);
    }
  }, [selectedClient, expressType, isExpress]);

  // ── Load family templates ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClient || !familyClient) return;
    const fetch = async () => {
      const { data } = await supabase.schema('operations').from('order_templates')
        .select('id_template, name, meal_type, order_template_details(recipe_id, quantity, recipes(id_recipe, name))')
        .eq('meal_type', 'Family').eq('is_active', true);
      setFamilyTemplates(data ?? []);
    };
    fetch();
  }, [selectedClient]);

  // ── Load personal templates ───────────────────────────────────────────────
  useEffect(() => {
    if (!menuType || familyClient) return;
    const fetch = async () => {
      const types = menuType === 'both' ? ['Lunch', 'Dinner'] : [menuType];
      const { data } = await supabase.schema('operations').from('order_templates')
        .select('id_template, name, meal_type, order_template_days(day_of_week, order_template_details(recipe_id, quantity, recipes(id_recipe, name)))')
        .in('meal_type', types).eq('is_active', true);
      const lunch  = data?.filter(t => t.meal_type === 'Lunch')  ?? [];
      const dinner = data?.filter(t => t.meal_type === 'Dinner') ?? [];
      setLunchTemplates(lunch);
      setDinnerTemplates(dinner);
      if (menuType === 'Lunch'  && lunch.length  === 1) setSelectedLunchTemplate(lunch[0]);
      if (menuType === 'Dinner' && dinner.length === 1) setSelectedDinnerTemplate(dinner[0]);
    };
    fetch();
  }, [menuType, selectedClient]);

  // ── Auto-resolve route ────────────────────────────────────────────────────
  // Runs whenever step, menuType, or extraCount changes.
  // Skips if user manually picked a route.
  useEffect(() => {
    if (step !== 3 || !menuType || familyClient || routeManuallyChanged) return;
    const isComplete    = menuType === 'both' || extraCount >= 3;
    const preferredType = isComplete ? 'complete' : 'individual';

    const doResolve = async () => {
      let { data } = await supabase.schema('operations').from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('route_type', preferredType).eq('is_active', true).limit(1).maybeSingle();
      if (!data) {
        ({ data } = await supabase.schema('operations').from('routes')
          .select('id_route, name, route_type, route_delivery_days(day_of_week)')
          .eq('is_active', true).limit(1).maybeSingle());
      }
      if (data) setResolvedRoute(data);
    };
    doResolve();
  }, [step, menuType, extraCount, familyClient, routeManuallyChanged]);

  // ── Build dayRecipes from personal templates ──────────────────────────────
  // Only rebuilds when the template selection changes, NOT when navigating
  // back from step 4 — so manual edits in step 3 are preserved.
  useEffect(() => {
    if (familyClient) return;
    if (!selectedLunchTemplate && !selectedDinnerTemplate) return;
    const recipes = {};
    DAYS_ORDER.forEach(d => { recipes[d] = []; });
    const templates = [];
    if (menuType === 'Lunch'  || menuType === 'both') if (selectedLunchTemplate)  templates.push({ tmpl: selectedLunchTemplate,  type: 'Lunch'  });
    if (menuType === 'Dinner' || menuType === 'both') if (selectedDinnerTemplate) templates.push({ tmpl: selectedDinnerTemplate, type: 'Dinner' });
    templates.forEach(({ tmpl, type }) => {
      (tmpl.order_template_days ?? []).forEach(tday => {
        const day = tday.day_of_week;
        if (!recipes[day]) recipes[day] = [];
        (tday.order_template_details ?? []).forEach(det => {
          recipes[day].push({ recipe_id: det.recipe_id, recipe_name: det.recipes?.name ?? '', quantity: det.quantity, isExtra: false });
        });
      });
    });
    setDayRecipes(recipes);
    const ids = Object.values(recipes).flat().map(r => r.recipe_id).filter(Boolean);
    if (ids.length) fetchRecipeIngredients(ids);
  }, [selectedLunchTemplate, selectedDinnerTemplate]);

  // ── Build dayRecipes for family: 7 empty days ─────────────────────────────
  useEffect(() => {
    if (!familyClient) return;
    const recipes = {};
    DAYS_ORDER.forEach(d => { recipes[d] = []; });
    // Load from family template if selected
    if (selectedFamilyTemplate) {
      (selectedFamilyTemplate.order_template_details ?? []).forEach(det => {
        // Family templates put recipes on Friday
        if (!recipes['Friday']) recipes['Friday'] = [];
        recipes['Friday'].push({ recipe_id: det.recipe_id, recipe_name: det.recipes?.name ?? '', quantity: det.quantity, isExtra: false });
      });
    }
    setDayRecipes(recipes);
    const ids = Object.values(recipes).flat().map(r => r.recipe_id).filter(Boolean);
    if (ids.length) fetchRecipeIngredients(ids);
  }, [selectedFamilyTemplate, familyClient]);

  // ── Resolve family route ──────────────────────────────────────────────────
  const resolveFamilyRoute = async () => {
    let { data } = await supabase.schema('operations').from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('route_type', 'family').eq('is_active', true).limit(1).maybeSingle();
    if (!data) {
      ({ data } = await supabase.schema('operations').from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('is_active', true).limit(1).maybeSingle());
    }
    if (data) setResolvedRoute(data);
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return !!selectedClient;
    if (step === 2) {
      if (isExpress) return expressRecipes.some(r => r.recipe_id);
      if (!menuType) return false;
      if (menuType === 'Lunch')  return !!selectedLunchTemplate;
      if (menuType === 'Dinner') return !!selectedDinnerTemplate;
      return !!selectedLunchTemplate && !!selectedDinnerTemplate;
    }
    return true;
  };

  const goNext = async () => {
    if (step === 1 && familyClient) {
      await resolveFamilyRoute();
      setStep(3);
      return;
    }
    if (step === 2 && isExpress) {
      setStep(4); // skip adjustments step
      return;
    }
    setStep(s => s + 1);
  };

  const goBack = () => {
    if (step === 3 && familyClient) { setStep(1); return; }
    if (step === 4 && isExpress)    { setStep(2); return; }
    setStep(s => s - 1);
  };

  // ── Reset wizard ─────────────────────────────────────────────────────────────
  const resetWizard = () => {
    setStep(1);
    setSelectedClient(null);
    setClientSearch('');
    setMenuType(null);
    setSelectedLunchTemplate(null);
    setSelectedDinnerTemplate(null);
    setSelectedFamilyTemplate(null);
    setResolvedRoute(null);
    setRouteManuallyChanged(false);
    setExtraMealTypes({});
    setIsExpress(false);
    setExpressRecipes([]);
    setExpressType('Lunch');
    setExpressIngredientOverrides({});
    setExpressMacros({ protein_value: '', protein_unit: 'g', carb_value: '', carb_unit: 'g' });
    const emptyDays = {};
    DAYS_ORDER.forEach(d => { emptyDays[d] = []; });
    setDayRecipes(emptyDays);
    setIngredientOverrides({});
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    const weekStartStr   = toDateString(weekStart);
    const weekEndStr     = toDateString(weekEnd);
    const todayDayName   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const activeDays     = isExpress
      ? [todayDayName]
      : DAYS_ORDER.filter(d => (dayRecipes[d] ?? []).some(r => r.recipe_id));
    const menuTypes      = isExpress ? [expressType]
      : familyClient ? ['Family']
      : menuType === 'both' ? ['Lunch','Dinner'] : [menuType];
    const routeDelDays   = (resolvedRoute?.route_delivery_days ?? []).map(d => d.day_of_week);
    const todayStr = new Date().toISOString().split('T')[0];

    for (const type of menuTypes) {
      const templateId = type === 'Lunch'   ? selectedLunchTemplate?.id_template
                       : type === 'Dinner'  ? selectedDinnerTemplate?.id_template
                       : selectedFamilyTemplate?.id_template;

      const { data: orderData, error: orderError } = await supabase.schema('operations').from('orders')
        .insert([{
          client_id:                selectedClient.id_client,
          template_id:              templateId ?? null,
          week_start_date:          weekStartStr,
          week_end_date:            weekEndStr,
          route_id:                 isExpress ? null : (resolvedRoute?.id_route ?? null),
          classification:           type,
          status:                   'PENDING',
          macro_profile_snapshot_id:(type === 'Dinner' ? selectedClient?.dinner_macro_profile_id : selectedClient?.lunch_macro_profile_id) ?? null,
          protein_snapshot:         isExpress ? expressMacros.protein_value : (type === 'Dinner' ? dinnerMacros?.protein_value : lunchMacros?.protein_value) ?? null,
          protein_unit_snapshot:    isExpress ? expressMacros.protein_unit  : (type === 'Dinner' ? dinnerMacros?.protein_unit  : lunchMacros?.protein_unit)  ?? null,
          carb_snapshot:            isExpress ? expressMacros.carb_value    : (type === 'Dinner' ? dinnerMacros?.carb_value    : lunchMacros?.carb_value)    ?? null,
          carb_unit_snapshot:       isExpress ? expressMacros.carb_unit     : (type === 'Dinner' ? dinnerMacros?.carb_unit     : lunchMacros?.carb_unit)     ?? null,
        }])
        .select('id_order').single();

      if (orderError) { sileo.error('Error al crear el pedido'); console.error(orderError); setLoading(false); return; }

      const orderId = orderData.id_order;

      for (const day of activeDays) {
        const { data: dayData, error: dayErr } = await supabase.schema('operations').from('order_days')
          .insert([{ order_id: orderId, day_of_week: day, delivery_date: isExpress ? todayStr : getDateForDay(day, weekStart, routeDelDays), status: 'PENDING' }])
          .select('id_order_day').single();
        if (dayErr) { sileo.error(`Error al crear el día ${DAY_LABELS[day]}`); console.error(dayErr); setLoading(false); return; }

        // For express, preserve original index for override lookup
        const sourceRecipes = isExpress ? expressRecipes : (dayRecipes[day] ?? []);
        const detailsWithIdx = sourceRecipes
          .map((r, origIdx) => ({ r, origIdx }))
          .filter(({ r }) => r.recipe_id);
        if (!detailsWithIdx.length) continue;

        const { data: detData, error: detErr } = await supabase.schema('operations').from('order_day_details')
          .insert(detailsWithIdx.map(({ r, origIdx }, i) => {
            const effectiveType = r.isExtra ? (extraMealTypes[`${day}-${origIdx}`] ?? type) : type;
            const eff = isExpress ? expressMacros : getEffectiveMacros(day, effectiveType);
            return {
              order_day_id:          dayData.id_order_day,
              recipe_id:             r.recipe_id,
              quantity:              Number(r.quantity) || 1,
              protein_value_applied: eff?.protein_value ?? null,
              protein_unit_applied:  eff?.protein_unit  ?? null,
              carb_value_applied:    eff?.carb_value    ?? null,
              carb_unit_applied:     eff?.carb_unit     ?? null,
            };
          }))
          .select('id_order_day_detail');
        if (detErr) { sileo.error(`Error guardando recetas de ${DAY_LABELS[day]}`); console.error(detErr); setLoading(false); return; }

        const overrideRows = [];
        (detData ?? []).forEach((det, i) => {
          const origIdx = detailsWithIdx[i]?.origIdx;
          const ov = isExpress
            ? expressIngredientOverrides[origIdx]
            : ingredientOverrides[`${day}-${origIdx}`];
          if (!ov) return;
          for (const cat of ['protein','carb','extra']) {
            for (const name of ov[cat] ?? []) overrideRows.push({ order_day_detail_id: det.id_order_day_detail, name, category: cat });
          }
        });
        if (overrideRows.length) {
          const { error: ovErr } = await supabase.schema('operations').from('order_day_recipe_overrides').insert(overrideRows);
          if (ovErr) console.error('Error guardando overrides:', ovErr);
        }
      }
    }

    sileo.success('Pedido registrado correctamente');
    setLoading(false);
    // Full reset so wizard is clean if modal re-opens or user starts again
    resetWizard();
    if (onSuccess) onSuccess();
  };

  // ── Step label helpers ────────────────────────────────────────────────────
  const stepLabels = familyClient ? FAMILY_STEPS : isExpress ? EXPRESS_STEPS : PERSONAL_STEPS;
  const totalSteps = stepLabels.length;
  // Map logical step (1-4) to display position for personal, (1,3,4→1,2,3) for family
  const displayStep = familyClient
    ? (step === 1 ? 1 : step === 3 ? 2 : 3)
    : step;
  const maxStep = familyClient ? (step === 4 ? 3 : displayStep) : step;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto" data-gramm="false">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Nuevo Pedido</h2>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const pos    = i + 1;
          const active = pos === displayStep;
          const done   = pos < displayStep;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${active ? 'bg-slate-800 text-white' : done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {done ? '✓' : pos}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Client ── */}
      {step === 1 && (
        <div className="space-y-4">
          <input
            type="text" placeholder="Buscar cliente…"
            value={clientSearch} onChange={e => setClientSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            spellCheck="false" autoComplete="off"
          />
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
              <button key={c.id_client} type="button"
                onClick={() => setSelectedClient(c)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${selectedClient?.id_client === c.id_client ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
              >
                <span className="font-medium">{c.name}</span>
                <span className={`ml-2 text-xs ${selectedClient?.id_client === c.id_client ? 'text-slate-300' : 'text-slate-400'}`}>
                  {c.client_type === 'family' ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
                </span>
              </button>
            ))}
          </div>

          {/* Express order toggle — solo para clientes personales */}
          {selectedClient && !familyClient && (
            <button
              type="button"
              onClick={() => setIsExpress(p => !p)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition text-sm font-medium ${
                isExpress
                  ? 'bg-amber-50 border-amber-400 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className={isExpress ? 'text-amber-500' : 'text-slate-400'} />
                <span>Pedido Express</span>
              </div>
              <div className={`flex flex-col items-end text-xs ${isExpress ? 'text-amber-600' : 'text-slate-400'}`}>
                <span>{isExpress ? 'Activo — entrega hoy' : 'Entrega según ruta'}</span>
                {isExpress && <span className="text-[10px] opacity-70">Sin plantilla ni ruta fija</span>}
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Menu (personal) or Express recipe picker ── */}
      {step === 2 && !familyClient && !isExpress && (
        <div className="space-y-5">
          {/* Menu type */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de menú</label>
            <div className="flex gap-2">
              {[['Lunch','☀️ Almuerzo'],['Dinner','🌙 Cena'],['both','☀️🌙 Ambos']].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => setMenuType(val)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${menuType === val ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                >{lbl}</button>
              ))}
            </div>
          </div>

          {/* Lunch template */}
          {(menuType === 'Lunch' || menuType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Plantilla de Almuerzo</label>
              <div className="space-y-2">
                {lunchTemplates.length === 0
                  ? <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
                  : lunchTemplates.map(t => (
                    <button key={t.id_template} type="button" onClick={() => setSelectedLunchTemplate(t)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${selectedLunchTemplate?.id_template === t.id_template ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}
                    >{t.name}</button>
                  ))}
              </div>
            </div>
          )}

          {/* Dinner template */}
          {(menuType === 'Dinner' || menuType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Plantilla de Cena</label>
              <div className="space-y-2">
                {dinnerTemplates.length === 0
                  ? <p className="text-xs text-slate-400 italic">No hay plantillas disponibles</p>
                  : dinnerTemplates.map(t => (
                    <button key={t.id_template} type="button" onClick={() => setSelectedDinnerTemplate(t)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${selectedDinnerTemplate?.id_template === t.id_template ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}
                    >{t.name}</button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 Express: direct recipe picker ── */}
      {step === 2 && isExpress && (
        <div className="space-y-5">

          {/* Lunch / Dinner toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de comida</label>
            <div className="flex gap-2">
              {[['Lunch','☀️ Almuerzo'],['Dinner','🌙 Cena']].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => setExpressType(val)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                    expressType === val
                      ? val === 'Lunch' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-indigo-50 border-indigo-400 text-indigo-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >{lbl}</button>
              ))}
            </div>
          </div>

          {/* Macros override */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Macros del pedido</p>
              <div className="flex gap-2">
                {/* Reload from client profile */}
                {(() => {
                  const clientMacro = expressType === 'Lunch' ? selectedClient?.lunch_macro : selectedClient?.dinner_macro;
                  const isClientActive = clientMacro &&
                    String(expressMacros?.protein_value) === String(clientMacro.protein_value) &&
                    String(expressMacros?.carb_value) === String(clientMacro.carb_value);
                  return clientMacro ? (
                    <button type="button"
                      onClick={() => {
                        const m = expressType === 'Dinner' ? selectedClient.dinner_macro : selectedClient.lunch_macro;
                        setExpressMacros({ protein_value: m.protein_value, protein_unit: m.protein_unit, carb_value: m.carb_value, carb_unit: m.carb_unit });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        isClientActive
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >👤 Del cliente</button>
                  ) : null;
                })()}
                {/* Standard macro */}
                {(() => {
                  const isStdActive = expressMacros &&
                    String(expressMacros.protein_value) === '120' && expressMacros.protein_unit === 'g' &&
                    String(expressMacros.carb_value) === '120' && expressMacros.carb_unit === 'g';
                  return (
                    <button type="button"
                      onClick={() => setExpressMacros({ ...STANDARD_MACRO })}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        isStdActive
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >⭐ Estándar (120g)</button>
                  );
                })()}
              </div>
            </div>
            <MacroPanel
              label={expressType === 'Lunch' ? '☀️ Almuerzo' : '🌙 Cena'}
              colorClass={expressType === 'Lunch' ? 'amber' : 'indigo'}
              macros={expressMacros}
              onUpdate={(field, value) => setExpressMacros(prev => ({ ...prev, [field]: value }))}
            />
          </div>

          {/* Recipe list */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Recetas para hoy</label>
            <div className="space-y-3">
              {expressRecipes.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <select
                      value={item.recipe_id || ''}
                      onChange={(e) => {
                        const found = allRecipes.find(r => String(r.id_recipe) === String(e.target.value));
                        setExpressRecipes(prev => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], recipe_id: e.target.value ? Number(e.target.value) : '', recipe_name: found?.name ?? '' };
                          return updated;
                        });
                        if (e.target.value) fetchRecipeIngredients([String(e.target.value)]);
                      }}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                    >
                      <option value="">Seleccionar receta</option>
                      {allRecipes.map(r => (
                        <option key={r.id_recipe} value={r.id_recipe}>{r.name}</option>
                      ))}
                    </select>
                    <input
                      type="number" min="1"
                      value={item.quantity}
                      onChange={(e) => setExpressRecipes(prev => {
                        const updated = [...prev];
                        updated[idx] = { ...updated[idx], quantity: e.target.value };
                        return updated;
                      })}
                      className="w-16 px-2 py-2 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                    <button type="button"
                      onClick={() => {
                        setExpressRecipes(prev => prev.filter((_, i) => i !== idx));
                        setExpressIngredientOverrides(prev => {
                          const next = { ...prev };
                          delete next[idx];
                          return next;
                        });
                      }}
                      className="text-red-400 hover:text-red-600 transition p-1"
                    >✕</button>
                  </div>
                  {/* Ingredient override editor */}
                  {item.recipe_id && (
                    <RecipeIngredientEditor
                      recipeName={item.recipe_name}
                      baseIngredients={recipeIngredients[String(item.recipe_id)] ?? { protein: [], carb: [], extra: [] }}
                      value={expressIngredientOverrides[idx] ?? null}
                      onChange={(val) => setExpressIngredientOverrides(prev => ({ ...prev, [idx]: val }))}
                    />
                  )}
                </div>
              ))}
              <button type="button"
                onClick={() => setExpressRecipes(prev => [...prev, { recipe_id: '', recipe_name: '', quantity: 1 }])}
                className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition"
              >
                + Agregar receta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Adjustments ── */}
      {step === 3 && (
        <OrderAdjustments
          isFamilyClient={familyClient}
          menuType={menuType ?? 'Family'}
          resolvedRoute={resolvedRoute}
          allRoutes={allRoutes}
          onRouteChange={(r) => { setResolvedRoute(r); setRouteManuallyChanged(true); }}
          showRouteChange={!familyClient}
          lunchMacros={lunchMacros}
          dinnerMacros={dinnerMacros}
          onUpdateLunchMacro={updateLunchMacro}
          onUpdateDinnerMacro={updateDinnerMacro}
          onResetAllDayMacros={resetAllDayMacros}
          getEffectiveMacros={getEffectiveMacros}
          isDayOverridden={isDayOverridden}
          onUpdateDayMacro={updateDayMacro}
          onResetDayMacro={resetDayMacro}
          dayRecipes={dayRecipes}
          allRecipes={allRecipes}
          recipeIngredients={recipeIngredients}
          ingredientOverrides={ingredientOverrides}
          expandedDays={expandedDays}
          onAddRecipe={addRecipeToDay}
          onUpdateRecipe={(day, idx, field, val) => updateRecipeInDay(day, idx, field, val, allRecipes)}
          onRemoveRecipe={removeRecipeFromDay}
          onOverrideChange={setOverride}
          onToggleDay={toggleDay}
          extraMealTypes={extraMealTypes}
          onExtraMealTypeChange={(key, cls) => setExtraMealTypes(p => ({ ...p, [key]: cls }))}
          clientLunchMacro={selectedClient?.lunch_macro}
          clientDinnerMacro={selectedClient?.dinner_macro}
          onApplyStandardLunch={() => setLunchMacros({ ...STANDARD_MACRO })}
          onApplyStandardDinner={() => setDinnerMacros({ ...STANDARD_MACRO })}
          onApplyClientLunch={() => {
            const m = selectedClient?.lunch_macro;
            if (m) setLunchMacros({ protein_value: m.protein_value, protein_unit: m.protein_unit, carb_value: m.carb_value, carb_unit: m.carb_unit });
          }}
          onApplyClientDinner={() => {
            const m = selectedClient?.dinner_macro;
            if (m) setDinnerMacros({ protein_value: m.protein_value, protein_unit: m.protein_unit, carb_value: m.carb_value, carb_unit: m.carb_unit });
          }}
        />
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800">{selectedClient?.name}</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${familyClient ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
              {familyClient ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
            </span>
            {isExpress && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                <Zap size={10} /> Express
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Semana</p>
            <p className="text-sm text-slate-700">{weekStart.toLocaleDateString('es-CR')} — {weekEnd.toLocaleDateString('es-CR')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Menú</p>
            <p className="text-sm text-slate-700">
              {isExpress
                ? (expressType === 'Lunch' ? '☀️ Almuerzo Express' : '🌙 Cena Express')
                : familyClient ? (selectedFamilyTemplate?.name ? `Familiar — ${selectedFamilyTemplate.name}` : 'Familiar')
                : menuType === 'both' ? 'Almuerzo + Cena'
                : menuType === 'Lunch' ? 'Solo Almuerzo' : 'Solo Cena'}
            </p>
          </div>
          {isExpress && expressRecipes.filter(r => r.recipe_id).length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Recetas</p>
              <div className="space-y-1">
                {expressRecipes.filter(r => r.recipe_id).map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">×{r.quantity}</span>
                    <span className="text-sm text-slate-700">{r.recipe_name || 'Receta'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Ruta</p>
            <p className="text-sm font-medium text-slate-800">{isExpress ? '⚡ Entrega hoy (sin ruta)' : (resolvedRoute?.name ?? 'Sin ruta')}</p>
            {resolvedRoute?.route_delivery_days?.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {resolvedRoute.route_delivery_days.map((d, i) => (
                  <span key={i} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {DAY_LABELS[d.day_of_week]}
                  </span>
                ))}
              </div>
            )}
          </div>
          {isExpress && expressMacros?.protein_value && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Macros</p>
              <p className="text-sm text-slate-700">
                {expressType === 'Lunch' ? '☀️' : '🌙'} {expressMacros.protein_value}{expressMacros.protein_unit} prot · {expressMacros.carb_value}{expressMacros.carb_unit} carbos
              </p>
            </div>
          )}
          {!familyClient && !isExpress && (lunchMacros || dinnerMacros) && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Macros globales</p>
              <p className="text-sm text-slate-700">
                {(menuType === 'Lunch' || menuType === 'both') && lunchMacros && (
                  <span>☀️ {lunchMacros.protein_value}{lunchMacros.protein_unit} prot · {lunchMacros.carb_value}{lunchMacros.carb_unit} carbos</span>
                )}
                {(menuType === 'Dinner' || menuType === 'both') && dinnerMacros && (
                  <span className={menuType === 'both' ? 'ml-2' : ''}>🌙 {dinnerMacros.protein_value}{dinnerMacros.protein_unit} prot · {dinnerMacros.carb_value}{dinnerMacros.carb_unit} carbos</span>
                )}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Días con recetas</p>
            <div className="space-y-2">
              {DAYS_ORDER.filter(d => (dayRecipes[d] ?? []).some(r => r.recipe_id)).map(day => (
                <div key={day} className="flex items-start gap-2">
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium min-w-[48px] text-center shrink-0 mt-0.5">
                    {DAY_SHORT[day]}
                  </span>
                  <div className="space-y-1.5 flex-1">
                    {dayRecipes[day].filter(r => r.recipe_id).map((r, idx) => {
                      const ov  = ingredientOverrides[`${day}-${idx}`];
                      const base = recipeIngredients[String(r.recipe_id)] ?? { protein: [], carb: [], extra: [] };
                      const ings = ov ?? base;
                      const hasIngs = ['protein','carb','extra'].some(c => (ings[c] ?? []).length > 0);
                      return (
                        <div key={idx}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-slate-700">{r.recipe_name || 'Receta'}</span>
                            {r.quantity > 1 && <span className="text-xs text-slate-400">×{r.quantity}</span>}
                            {ov && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">modificada</span>}
                          </div>
                          {hasIngs && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(ings.protein ?? []).map((n, i) => <span key={'p'+i} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{n}</span>)}
                              {(ings.carb    ?? []).map((n, i) => <span key={'c'+i} className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">{n}</span>)}
                              {(ings.extra   ?? []).map((n, i) => <span key={'e'+i} className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">{n}</span>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1
          ? <button type="button" onClick={goBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-400 transition text-sm font-medium">
              <ChevronLeft size={16} /> Atrás
            </button>
          : <div />}
        {step < 4
          ? <button type="button" onClick={goNext} disabled={!canGoNext()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40">
              Siguiente <ChevronRight size={16} />
            </button>
          : <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40">
              <Check size={16} /> {loading ? 'Guardando…' : 'Confirmar Pedido'}
            </button>}
      </div>
    </div>
  );
};

export default AddOrder;