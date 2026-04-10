import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import OrderAdjustments from './OrderAdjustments';
import { useDayRecipes } from './useDayRecipes';
import { useMacros } from './useMacros';
import {
  DAYS_ORDER,
  DAY_LABELS,
  isFamily,
  getWeekRange,
  toDateString,
  getDateForDay,
} from './orderUtils';

import StepClient from './orders/steps/StepClient';
import StepMenu from './orders/steps/StepMenu';
import StepExpressRecipes from './orders/steps/StepExpressRecipes';
import StepPayment from './orders/steps/StepPayment';
import StepConfirm from './orders/steps/StepConfirm';

// ── Constants ────────────────────────────────────────────────────────────────
const STANDARD_MACRO = { protein_value: 120, protein_unit: 'g', carb_value: 120, carb_unit: 'g' };

const PERSONAL_STEPS = ['Cliente', 'Menú', 'Ajustes', 'Pago', 'Confirmar'];
const FAMILY_STEPS   = ['Cliente', 'Ajustes', 'Pago', 'Confirmar'];
const EXPRESS_STEPS  = ['Cliente', 'Menú', 'Pago', 'Confirmar'];

// ── AddOrder ──────────────────────────────────────────────────────────────────
const AddOrder = ({ onSuccess }) => {
  const { supabase } = useApp();
  const { weekStart, weekEnd } = getWeekRange();

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1 — Client
  const [clients, setClients]           = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');

  // Step 2 — Menu
  const [menuType, setMenuType]                         = useState(null);
  const [lunchTemplates, setLunchTemplates]             = useState([]);
  const [dinnerTemplates, setDinnerTemplates]           = useState([]);
  const [selectedLunchTemplate, setSelectedLunchTemplate]   = useState(null);
  const [selectedDinnerTemplate, setSelectedDinnerTemplate] = useState(null);
  const [selectedFamilyTemplate, setSelectedFamilyTemplate] = useState(null);

  // Step 3 — Route / adjustments
  const [resolvedRoute, setResolvedRoute]           = useState(null);
  const [allRoutes, setAllRoutes]                   = useState([]);
  const [routeManuallyChanged, setRouteManuallyChanged] = useState(false);
  const [allRecipes, setAllRecipes]                 = useState([]);
  const [extraMealTypes, setExtraMealTypes]         = useState({});

  const [loading, setLoading] = useState(false);

  // Step 4 — Payment
  const [paymentType, setPaymentType]       = useState('weekly');
  const [paymentAmount, setPaymentAmount]   = useState('');
  const [paymentDate, setPaymentDate]       = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus]   = useState('pending');
  const [paymentNotes, setPaymentNotes]     = useState('');
  const [availableMonthly, setAvailableMonthly] = useState([]);
  const [associatePaymentId, setAssociatePaymentId] = useState(null);

  // Express
  const [isExpress, setIsExpress]                         = useState(false);
  const [expressRecipes, setExpressRecipes]               = useState([]);
  const [expressType, setExpressType]                     = useState('Lunch');
  const [expressIngredientOverrides, setExpressIngredientOverrides] = useState({});
  const [expressMacros, setExpressMacros] = useState({
    protein_value: '', protein_unit: 'g', carb_value: '', carb_unit: 'g',
  });

  const familyClient = selectedClient ? isFamily(selectedClient) : false;

  // ── Hooks ─────────────────────────────────────────────────────────────────────
  const {
    dayRecipes, recipeIngredients, ingredientOverrides, setIngredientOverrides,
    expandedDays, addRecipeToDay, updateRecipeInDay, removeRecipeFromDay,
    setOverride, toggleDay, setDayRecipes, fetchRecipeIngredients,
  } = useDayRecipes();

  const {
    lunchMacros, setLunchMacros, dinnerMacros, setDinnerMacros,
    updateLunchMacro, updateDinnerMacro, updateDayMacro, resetDayMacro,
    resetAllDayMacros, getEffectiveMacros, isDayOverridden,
  } = useMacros();

  const extraCount = Object.values(dayRecipes)
    .flat()
    .filter((r) => r.isExtra && r.recipe_id).length;

  // ── Data fetching ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('clients')
        .select(
          `id_client, name, client_type,
           lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey(id_macro_profile,name,protein_value,protein_unit,carb_value,carb_unit),
           dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey(id_macro_profile,name,protein_value,protein_unit,carb_value,carb_unit)`
        )
        .order('name');
      setClients(data ?? []);
    };
    const fetchRoutes = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('is_active', true);
      setAllRoutes(data ?? []);
    };
    const fetchAllRecipes = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('recipes')
        .select('id_recipe, name')
        .eq('is_active', true)
        .order('name');
      setAllRecipes(data ?? []);
    };
    fetchClients();
    fetchRoutes();
    fetchAllRecipes();
  }, []);

  // Reset when client changes
  useEffect(() => {
    if (!selectedClient) return;
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
    DAYS_ORDER.forEach((d) => { emptyDays[d] = []; });
    setDayRecipes(emptyDays);
    setIngredientOverrides({});
  }, [selectedClient]);

  // Set macros when client selected
  useEffect(() => {
    if (!selectedClient) return;
    const lm = selectedClient.lunch_macro;
    const dm = selectedClient.dinner_macro;
    if (lm) setLunchMacros({ protein_value: lm.protein_value, protein_unit: lm.protein_unit, carb_value: lm.carb_value, carb_unit: lm.carb_unit });
    if (dm) setDinnerMacros({ protein_value: dm.protein_value, protein_unit: dm.protein_unit, carb_value: dm.carb_value, carb_unit: dm.carb_unit });
  }, [selectedClient]);

  // Reset dayRecipes when switching express/normal
  useEffect(() => {
    const emptyDays = {};
    DAYS_ORDER.forEach((d) => { emptyDays[d] = []; });
    setDayRecipes(emptyDays);
    setIngredientOverrides({});
    setStep((prev) => (prev > 2 ? 2 : prev));
  }, [isExpress]);

  // Auto-load expressMacros from client profile
  useEffect(() => {
    if (!selectedClient || !isExpress) return;
    const macro = expressType === 'Dinner' ? selectedClient.dinner_macro : selectedClient.lunch_macro;
    setExpressMacros(
      macro
        ? { protein_value: macro.protein_value, protein_unit: macro.protein_unit, carb_value: macro.carb_value, carb_unit: macro.carb_unit }
        : { ...STANDARD_MACRO }
    );
  }, [selectedClient, expressType, isExpress]);

  // Load personal templates
  useEffect(() => {
    if (!menuType || familyClient) return;
    (async () => {
      const types = menuType === 'both' ? ['Lunch', 'Dinner'] : [menuType];
      const { data } = await supabase
        .schema('operations')
        .from('order_templates')
        .select('id_template, name, meal_type, order_template_days(day_of_week, order_template_details(recipe_id, quantity, recipes(id_recipe, name)))')
        .in('meal_type', types)
        .eq('is_active', true);
      const lunch  = data?.filter((t) => t.meal_type === 'Lunch')  ?? [];
      const dinner = data?.filter((t) => t.meal_type === 'Dinner') ?? [];
      setLunchTemplates(lunch);
      setDinnerTemplates(dinner);
      if (menuType === 'Lunch'  && lunch.length  === 1) setSelectedLunchTemplate(lunch[0]);
      if (menuType === 'Dinner' && dinner.length === 1) setSelectedDinnerTemplate(dinner[0]);
    })();
  }, [menuType, selectedClient]);

  // Auto-resolve route
  useEffect(() => {
    if (step !== 3 || !menuType || familyClient || routeManuallyChanged) return;
    const preferredType = (menuType === 'both' || extraCount >= 3) ? 'complete' : 'individual';
    (async () => {
      let { data } = await supabase
        .schema('operations')
        .from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('route_type', preferredType)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (!data) {
        ({ data } = await supabase
          .schema('operations')
          .from('routes')
          .select('id_route, name, route_type, route_delivery_days(day_of_week)')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle());
      }
      if (data) setResolvedRoute(data);
    })();
  }, [step, menuType, extraCount, familyClient, routeManuallyChanged]);

  // Build dayRecipes from personal templates
  useEffect(() => {
    if (familyClient) return;
    if (!selectedLunchTemplate && !selectedDinnerTemplate) return;
    const recipes = {};
    DAYS_ORDER.forEach((d) => { recipes[d] = []; });
    const templates = [];
    if ((menuType === 'Lunch' || menuType === 'both') && selectedLunchTemplate)
      templates.push({ tmpl: selectedLunchTemplate, type: 'Lunch' });
    if ((menuType === 'Dinner' || menuType === 'both') && selectedDinnerTemplate)
      templates.push({ tmpl: selectedDinnerTemplate, type: 'Dinner' });
    templates.forEach(({ tmpl }) => {
      (tmpl.order_template_days ?? []).forEach((tday) => {
        const day = tday.day_of_week;
        if (!recipes[day]) recipes[day] = [];
        (tday.order_template_details ?? []).forEach((det) => {
          recipes[day].push({ recipe_id: det.recipe_id, recipe_name: det.recipes?.name ?? '', quantity: det.quantity, isExtra: false });
        });
      });
    });
    setDayRecipes(recipes);
    const ids = Object.values(recipes).flat().map((r) => r.recipe_id).filter(Boolean);
    if (ids.length) fetchRecipeIngredients(ids);
  }, [selectedLunchTemplate, selectedDinnerTemplate]);

  // Build dayRecipes for family
  useEffect(() => {
    if (!familyClient) return;
    const recipes = {};
    DAYS_ORDER.forEach((d) => { recipes[d] = []; });
    if (selectedFamilyTemplate) {
      (selectedFamilyTemplate.order_template_details ?? []).forEach((det) => {
        if (!recipes['Friday']) recipes['Friday'] = [];
        recipes['Friday'].push({ recipe_id: det.recipe_id, recipe_name: det.recipes?.name ?? '', quantity: det.quantity, isExtra: false });
      });
    }
    setDayRecipes(recipes);
    const ids = Object.values(recipes).flat().map((r) => r.recipe_id).filter(Boolean);
    if (ids.length) fetchRecipeIngredients(ids);
  }, [selectedFamilyTemplate, familyClient]);

  // Auto-suggest payment type + fetch available monthly payments
  useEffect(() => {
    if (step !== 4) return;
    const suggested = isExpress ? 'express' : familyClient || menuType === 'both' ? 'monthly' : 'weekly';
    setPaymentType(suggested);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAssociatePaymentId(null);
    if (!selectedClient) return;
    (async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('payments')
        .select('id_payment, amount, payment_date, payment_orders(id_payment_order)')
        .eq('client_id', selectedClient.id_client)
        .eq('payment_type', 'monthly')
        .eq('status', 'pending');
      if (error || !data) return;
      const available = data.filter((p) => (p.payment_orders?.length ?? 0) < 4);
      setAvailableMonthly(available);
      if (available.length > 0 && suggested === 'monthly') setAssociatePaymentId(available[0].id_payment);
    })();
  }, [step]);

  // ── Resolve family route ──────────────────────────────────────────────────────
  const resolveFamilyRoute = async () => {
    let { data } = await supabase
      .schema('operations')
      .from('routes')
      .select('id_route, name, route_type, route_delivery_days(day_of_week)')
      .eq('route_type', 'family')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (!data) {
      ({ data } = await supabase
        .schema('operations')
        .from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle());
    }
    if (data) setResolvedRoute(data);
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return !!selectedClient;
    if (step === 2) {
      if (isExpress) return expressRecipes.some((r) => r.recipe_id);
      if (!menuType) return false;
      if (menuType === 'Lunch')  return !!selectedLunchTemplate;
      if (menuType === 'Dinner') return !!selectedDinnerTemplate;
      return !!selectedLunchTemplate && !!selectedDinnerTemplate;
    }
    if (step === 4) return associatePaymentId !== null || (!!paymentAmount && Number(paymentAmount) >= 0);
    return true;
  };

  const goNext = async () => {
    if (step === 1 && familyClient) { await resolveFamilyRoute(); setStep(3); return; }
    if (step === 2 && isExpress)    { setStep(4); return; }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 3 && familyClient) { setStep(1); return; }
    if (step === 4 && isExpress)    { setStep(2); return; }
    setStep((s) => s - 1);
  };

  // ── Reset wizard ──────────────────────────────────────────────────────────────
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
    setPaymentType('weekly');
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentStatus('pending');
    setPaymentNotes('');
    setAvailableMonthly([]);
    setAssociatePaymentId(null);
    const emptyDays = {};
    DAYS_ORDER.forEach((d) => { emptyDays[d] = []; });
    setDayRecipes(emptyDays);
    setIngredientOverrides({});
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    const createdOrderIds = [];
    const weekStartStr = toDateString(weekStart);
    const weekEndStr   = toDateString(weekEnd);
    const todayDayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const activeDays   = isExpress ? [todayDayName] : DAYS_ORDER.filter((d) => (dayRecipes[d] ?? []).some((r) => r.recipe_id));
    const menuTypes    = isExpress ? [expressType] : familyClient ? ['Family'] : menuType === 'both' ? ['Lunch', 'Dinner'] : [menuType];
    const routeDelDays = (resolvedRoute?.route_delivery_days ?? []).map((d) => d.day_of_week);
    const todayStr     = new Date().toISOString().split('T')[0];

    for (const type of menuTypes) {
      const templateId =
        type === 'Lunch'   ? selectedLunchTemplate?.id_template :
        type === 'Dinner'  ? selectedDinnerTemplate?.id_template :
        selectedFamilyTemplate?.id_template;

      const { data: orderData, error: orderError } = await supabase
        .schema('operations')
        .from('orders')
        .insert([{
          client_id: selectedClient.id_client,
          template_id: templateId ?? null,
          week_start_date: weekStartStr,
          week_end_date: weekEndStr,
          route_id: isExpress ? null : (resolvedRoute?.id_route ?? null),
          classification: type,
          status: 'PENDING',
          macro_profile_snapshot_id:
            (type === 'Dinner' ? selectedClient?.dinner_macro_profile_id : selectedClient?.lunch_macro_profile_id) ?? null,
          protein_snapshot: isExpress ? expressMacros.protein_value : ((type === 'Dinner' ? dinnerMacros?.protein_value : lunchMacros?.protein_value) ?? null),
          protein_unit_snapshot: isExpress ? expressMacros.protein_unit : ((type === 'Dinner' ? dinnerMacros?.protein_unit : lunchMacros?.protein_unit) ?? null),
          carb_snapshot: isExpress ? expressMacros.carb_value : ((type === 'Dinner' ? dinnerMacros?.carb_value : lunchMacros?.carb_value) ?? null),
          carb_unit_snapshot: isExpress ? expressMacros.carb_unit : ((type === 'Dinner' ? dinnerMacros?.carb_unit : lunchMacros?.carb_unit) ?? null),
        }])
        .select('id_order')
        .single();

      if (orderError) { sileo.error('Error al crear el pedido'); setLoading(false); return; }

      const orderId = orderData.id_order;
      createdOrderIds.push(orderId);

      for (const day of activeDays) {
        const { data: dayData, error: dayErr } = await supabase
          .schema('operations')
          .from('order_days')
          .insert([{
            order_id: orderId,
            day_of_week: day,
            delivery_date: isExpress ? todayStr : getDateForDay(day, weekStart, routeDelDays),
            status: 'PENDING',
          }])
          .select('id_order_day')
          .single();
        if (dayErr) { sileo.error(`Error al crear el día ${DAY_LABELS[day]}`); setLoading(false); return; }

        const sourceRecipes  = isExpress ? expressRecipes : (dayRecipes[day] ?? []);
        const detailsWithIdx = sourceRecipes.map((r, origIdx) => ({ r, origIdx })).filter(({ r }) => r.recipe_id);
        if (!detailsWithIdx.length) continue;

        const { data: detData, error: detErr } = await supabase
          .schema('operations')
          .from('order_day_details')
          .insert(
            detailsWithIdx.map(({ r, origIdx }) => {
              const effectiveType = r.isExtra ? (extraMealTypes[`${day}-${origIdx}`] ?? type) : type;
              const eff = isExpress ? expressMacros : getEffectiveMacros(day, effectiveType);
              return {
                order_day_id: dayData.id_order_day,
                recipe_id: r.recipe_id,
                quantity: Number(r.quantity) || 1,
                protein_value_applied: eff?.protein_value ?? null,
                protein_unit_applied:  eff?.protein_unit  ?? null,
                carb_value_applied:    eff?.carb_value    ?? null,
                carb_unit_applied:     eff?.carb_unit     ?? null,
              };
            })
          )
          .select('id_order_day_detail');
        if (detErr) { sileo.error(`Error guardando recetas de ${DAY_LABELS[day]}`); setLoading(false); return; }

        const overrideRows = [];
        (detData ?? []).forEach((det, i) => {
          const origIdx = detailsWithIdx[i]?.origIdx;
          const ov = isExpress ? expressIngredientOverrides[origIdx] : ingredientOverrides[`${day}-${origIdx}`];
          if (!ov) return;
          for (const cat of ['protein', 'carb', 'extra'])
            for (const name of ov[cat] ?? [])
              overrideRows.push({ order_day_detail_id: det.id_order_day_detail, name, category: cat });
        });
        if (overrideRows.length) {
          const { error: ovErr } = await supabase.schema('operations').from('order_day_recipe_overrides').insert(overrideRows);
          if (ovErr) console.error('Error guardando overrides:', ovErr);
        }
      }
    }

    // Create or associate payment
    if (createdOrderIds.length > 0) {
      if (associatePaymentId) {
        const { error: lke } = await supabase
          .schema('operations')
          .from('payment_orders')
          .insert(createdOrderIds.map((oid) => ({ payment_id: associatePaymentId, order_id: oid })));
        if (lke) console.error('Error vinculando pago con órdenes:', lke);
      } else if (paymentAmount !== '') {
        const { data: pd, error: pe } = await supabase
          .schema('operations')
          .from('payments')
          .insert([{
            client_id: selectedClient.id_client,
            payment_type: paymentType,
            amount: Number(paymentAmount),
            currency: 'CRC',
            payment_date: paymentDate,
            status: paymentStatus,
            notes: paymentNotes || null,
          }])
          .select('id_payment')
          .single();
        if (pe) {
          console.error('Error al registrar el pago:', pe);
        } else {
          const { error: lke } = await supabase
            .schema('operations')
            .from('payment_orders')
            .insert(createdOrderIds.map((oid) => ({ payment_id: pd.id_payment, order_id: oid })));
          if (lke) console.error('Error vinculando pago con órdenes:', lke);
        }
      }
    }

    sileo.success('Pedido registrado correctamente');
    setLoading(false);
    resetWizard();
    if (onSuccess) onSuccess();
  };

  // ── Step label helpers ────────────────────────────────────────────────────────
  const stepLabels = familyClient ? FAMILY_STEPS : isExpress ? EXPRESS_STEPS : PERSONAL_STEPS;
  const displayStep = familyClient
    ? step === 1 ? 1 : step === 3 ? 2 : step === 4 ? 3 : 4
    : isExpress
      ? step === 1 ? 1 : step === 2 ? 2 : step === 4 ? 3 : 4
      : step;

  // ── Render ────────────────────────────────────────────────────────────────────
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
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-slate-800' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Client */}
      {step === 1 && (
        <StepClient
          clients={clients}
          clientSearch={clientSearch}
          setClientSearch={setClientSearch}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          familyClient={familyClient}
          isExpress={isExpress}
          setIsExpress={setIsExpress}
        />
      )}

      {/* Step 2: Menu (personal) */}
      {step === 2 && !familyClient && !isExpress && (
        <StepMenu
          menuType={menuType}
          setMenuType={setMenuType}
          lunchTemplates={lunchTemplates}
          dinnerTemplates={dinnerTemplates}
          selectedLunchTemplate={selectedLunchTemplate}
          setSelectedLunchTemplate={setSelectedLunchTemplate}
          selectedDinnerTemplate={selectedDinnerTemplate}
          setSelectedDinnerTemplate={setSelectedDinnerTemplate}
        />
      )}

      {/* Step 2: Express recipe picker */}
      {step === 2 && isExpress && (
        <StepExpressRecipes
          expressType={expressType}
          setExpressType={setExpressType}
          expressMacros={expressMacros}
          setExpressMacros={setExpressMacros}
          expressRecipes={expressRecipes}
          setExpressRecipes={setExpressRecipes}
          expressIngredientOverrides={expressIngredientOverrides}
          setExpressIngredientOverrides={setExpressIngredientOverrides}
          allRecipes={allRecipes}
          recipeIngredients={recipeIngredients}
          fetchRecipeIngredients={fetchRecipeIngredients}
          selectedClient={selectedClient}
        />
      )}

      {/* Step 3: Adjustments */}
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
          onExtraMealTypeChange={(key, cls) => setExtraMealTypes((p) => ({ ...p, [key]: cls }))}
          clientLunchMacro={selectedClient?.lunch_macro}
          clientDinnerMacro={selectedClient?.dinner_macro}
          onApplyStandardLunch={() => setLunchMacros({ ...STANDARD_MACRO })}
          onApplyStandardDinner={() => setDinnerMacros({ ...STANDARD_MACRO })}
          onApplyClientLunch={() => { const m = selectedClient?.lunch_macro; if (m) setLunchMacros({ protein_value: m.protein_value, protein_unit: m.protein_unit, carb_value: m.carb_value, carb_unit: m.carb_unit }); }}
          onApplyClientDinner={() => { const m = selectedClient?.dinner_macro; if (m) setDinnerMacros({ protein_value: m.protein_value, protein_unit: m.protein_unit, carb_value: m.carb_value, carb_unit: m.carb_unit }); }}
        />
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <StepPayment
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentDate={paymentDate}
          setPaymentDate={setPaymentDate}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          paymentNotes={paymentNotes}
          setPaymentNotes={setPaymentNotes}
          availableMonthly={availableMonthly}
          associatePaymentId={associatePaymentId}
          setAssociatePaymentId={setAssociatePaymentId}
        />
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <StepConfirm
          selectedClient={selectedClient}
          familyClient={familyClient}
          isExpress={isExpress}
          weekStart={weekStart}
          weekEnd={weekEnd}
          menuType={menuType}
          expressType={expressType}
          selectedFamilyTemplate={selectedFamilyTemplate}
          resolvedRoute={resolvedRoute}
          expressMacros={expressMacros}
          lunchMacros={lunchMacros}
          dinnerMacros={dinnerMacros}
          expressRecipes={expressRecipes}
          dayRecipes={dayRecipes}
          ingredientOverrides={ingredientOverrides}
          recipeIngredients={recipeIngredients}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-400 transition text-sm font-medium"
          >
            <ChevronLeft size={16} /> Atrás
          </button>
        ) : (
          <div />
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
          >
            <Check size={16} /> {loading ? 'Guardando…' : 'Confirmar Pedido'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AddOrder;
