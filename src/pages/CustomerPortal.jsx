import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { Loader2, AlertTriangle, Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import OrderAdjustments from '../components/OrderAdjustments';
import PortalOrderSummary from '../components/portal/PortalOrderSummary';
import GuidedTour from '../components/portal/GuidedTour';
import { useMacros } from '../components/useMacros';
import { useDayRecipes } from '../components/useDayRecipes';
import {
  DAYS_ORDER,
  DAY_LABELS,
  MACRO_UNIT,
  MEAL_TYPES,
  clientMacroKey,
  classificationOf,
  mealLabel,
  mealTypesOf,
  getWeekRange,
  getDateForDay,
  toDateString,
} from '../components/orderUtils';

// Portal de clientes (RF-PC, docs/v2/03_REQUERIMIENTOS_PORTAL_CLIENTE.md) —
// sin login, acceso solo por token vía funciones SECURITY DEFINER
// (docs/v2/08_DISEÑO_RLS.md). Reusa OrderAdjustments/DayRecipeBlock tal cual
// el asistente interno. Las macros siguen siendo de solo lectura (RF-PC-02,
// el cliente no ajusta su plan nutricional), pero el cliente SÍ puede
// personalizar la composición de ingredientes de cada receta — se guarda en
// order_day_recipe_overrides igual que cuando lo hace el staff.
//
// Para un pedido nuevo (personal, sin pedido todavía), se precarga la
// plantilla que corresponde a la semana del mes en curso (resuelta por
// portal_get_menu_options, con override de staff si existe) — el cliente no
// ve el selector de plantilla que usa el staff, pero puede seguir editando
// las recetas después de que se aplica.
// Devuelve { recipes, mealTypes } — mealTypes (clave `${day}-${index}`) solo
// importa para clasificaciones con más de un tiempo de comida: antes esta
// función no guardaba de qué plantilla venía cada receta, así que Producción
// no podía saber cuál plato era de cuál tiempo para un pedido combinado
// armado desde el portal.
const buildDayRecipesFromTemplates = (resolvedTemplates, classification) => {
  const recipes = {};
  DAYS_ORDER.forEach((d) => {
    recipes[d] = [];
  });
  const addTemplate = (tmpl, mealType) => {
    if (!tmpl) return;
    (tmpl.days ?? []).forEach((day) => {
      if (!recipes[day.day_of_week]) recipes[day.day_of_week] = [];
      (day.details ?? []).forEach((det) => {
        recipes[day.day_of_week].push({
          recipe_id: String(det.recipe_id),
          recipe_name: det.recipe_name,
          quantity: det.quantity,
          isExtra: true,
          mealType,
        });
      });
    });
  };
  mealTypesOf(classification).forEach((type) => addTemplate(resolvedTemplates?.[type], type));

  const mealTypes = {};
  Object.entries(recipes).forEach(([day, items]) => {
    items.forEach((r, idx) => {
      if (r.mealType) mealTypes[`${day}-${idx}`] = r.mealType;
    });
  });
  return { recipes, mealTypes };
};

// Clases completas (no interpoladas) para que Tailwind las detecte.
const CARD_STYLES = {
  Breakfast: { card: 'bg-sky-50 dark:bg-sky-900/20', label: 'text-sky-600 dark:text-sky-400' },
  Lunch: { card: 'bg-amber-50 dark:bg-amber-900/20', label: 'text-amber-600 dark:text-amber-400' },
  Dinner: { card: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'text-indigo-600 dark:text-indigo-400' },
};
const PICKER_BUTTON =
  'px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition';

const CustomerPortal = () => {
  const { token } = useParams();
  const { supabase } = useApp();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [client, setClient] = useState(null);
  const [menuOptions, setMenuOptions] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [classification, setClassification] = useState(null);
  const [pickedMeals, setPickedMeals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const macros = useMacros();
  const dayRecipesState = useDayRecipes();

  // Tour guiado del armador de pedido (RF-PC): se muestra solo, una vez,
  // la primera vez que el cliente ve esta pantalla (por link/token, no hay
  // login) y queda disponible para volver a verlo con el botón "Ver tour".
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const tourWasExpandedRef = useRef(false);
  const tourSeenKey = `oasis_portal_tour_seen_v1_${token}`;

  const fetchAll = async () => {
    setLoading(true);
    setSubmitResult(null);

    const [{ data: clientData, error: clientErr }, { data: orderData }, { data: optionsData }] =
      await Promise.all([
        supabase.schema('operations').rpc('portal_get_client', { p_token: token }),
        supabase.schema('operations').rpc('portal_get_current_order', { p_token: token }),
        supabase.schema('operations').rpc('portal_get_menu_options', { p_token: token }),
      ]);

    if (clientErr || !clientData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setClient(clientData);
    setCurrentOrder(orderData ?? null);
    setMenuOptions(optionsData ?? null);

    // Ingredientes base por receta (para el editor de composición) — ya
    // vienen resueltos en portal_get_menu_options, evita un fetch aparte a
    // recipe_ingredients (que RLS no deja leer directo al rol anon).
    const ingredientsMap = {};
    (optionsData?.recipes ?? []).forEach((r) => {
      const grouped = { protein: [], carb: [], extra: [] };
      (r.ingredients ?? []).forEach((ing) => {
        grouped[ing.category]?.push(ing.name);
      });
      ingredientsMap[String(r.id_recipe)] = grouped;
    });
    dayRecipesState.setRecipeIngredients(ingredientsMap);

    macros.setLunchMacros(clientData.lunch_macro ?? null);
    macros.setDinnerMacros(clientData.dinner_macro ?? null);
    macros.setBreakfastMacros(clientData.breakfast_macro ?? null);

    const isFamilyClient = clientData.client_type === 'family';
    let resolvedClassification = null;
    if (isFamilyClient) {
      resolvedClassification = 'Family';
    } else if (orderData?.exists) {
      resolvedClassification = orderData.classification;
    } else {
      // Un solo tiempo de comida con perfil de macros → se asume; con varios el cliente elige.
      const available = MEAL_TYPES.filter((t) => clientData[clientMacroKey(t)]);
      if (available.length === 1) resolvedClassification = available[0];
    }
    setClassification(resolvedClassification); // null → el cliente elige (picker)

    if (orderData?.exists) {
      const adapted = orderData.days.map((d) => ({
        day_of_week: d.day_of_week,
        order_day_details: d.details.map((det) => ({
          recipe_id: det.recipe_id,
          quantity: det.quantity,
          mealType: det.meal_type,
          recipes: { id_recipe: det.recipe_id, name: det.recipe_name },
        })),
      }));
      dayRecipesState.loadFromOrderDays(adapted);
    } else if (resolvedClassification) {
      const { recipes, mealTypes } = buildDayRecipesFromTemplates(
        optionsData?.resolved_templates,
        resolvedClassification
      );
      dayRecipesState.setDayRecipes(recipes);
      dayRecipesState.setRecipeMealTypes(mealTypes);
    }

    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const chooseClassification = (cls) => {
    setClassification(cls);
    const { recipes, mealTypes } = buildDayRecipesFromTemplates(menuOptions?.resolved_templates, cls);
    dayRecipesState.setDayRecipes(recipes);
    dayRecipesState.setRecipeMealTypes(mealTypes);
  };

  const isFamilyClient = client?.client_type === 'family';
  const macrosByType = {
    Breakfast: macros.breakfastMacros,
    Lunch: macros.lunchMacros,
    Dinner: macros.dinnerMacros,
  };

  const resolvedRoute = client?.route
    ? {
        name: client.route.name,
        route_delivery_days: (client.route.delivery_days ?? []).map((d) => ({ day_of_week: d })),
      }
    : null;

  // Corte global semanal (día y hora configurables por el staff en
  // Settings → Portal de clientes), distinto del cierre por día más abajo.
  // No aplica al caso especial de entrega del martes, que
  // portal_get_current_order ya resuelve como locked=false.
  const isLocked = currentOrder?.locked === true;

  const closedDays = useMemo(() => {
    const s = new Set();
    if (isLocked) {
      DAYS_ORDER.forEach((d) => s.add(d));
      return s;
    }
    (currentOrder?.days ?? []).forEach((d) => {
      if (d.is_editable === false) s.add(d.day_of_week);
    });
    return s;
  }, [currentOrder, isLocked]);

  const hasEditableDays = DAYS_ORDER.some((d) => !closedDays.has(d));

  // El picker de tiempos de comida ("¿Qué querés armar esta semana?") solo
  // aparece para clientes personales con más de un tiempo configurado y sin
  // pedido todavía (ver fetchAll: con un solo tiempo se auto-resuelve, con
  // pedido existente la clasificación viene de ahí) — se basa en datos del
  // cliente/pedido que no cambian por elegir, así el paso del tour no
  // desaparece del array a mitad de camino cuando el cliente completa el
  // picker.
  const hasMealPicker =
    !isFamilyClient &&
    !currentOrder?.exists &&
    MEAL_TYPES.filter((t) => client?.[clientMacroKey(t)]).length > 1;

  // Día que usa el tour para mostrar "expandir día" / "agregar receta" /
  // "editar ingredientes": el primero que ya trae una receta cargada (así
  // el botón de editar ingredientes, que solo aparece si hay recipe_id,
  // existe de entrada), o el primer día del orden semanal si ninguno tiene.
  const tourTargetDay =
    DAYS_ORDER.find((d) => (dayRecipesState.dayRecipes[d] ?? []).some((r) => r.recipe_id)) ??
    DAYS_ORDER[0];
  const tourTargetDayIsEditable = !closedDays.has(tourTargetDay);

  const tourSteps = useMemo(() => {
    // setup/teardown se repiten en ambos pasos del grupo "día expandido"
    // (no solo en el primero) para que, sin importar en cuál de los dos
    // termine el tour (p. ej. si "add-recipe" se salta por no existir el
    // botón), siempre haya un teardown disponible para volver a colapsar
    // el día al salir del grupo.
    const expandDay = () => {
      tourWasExpandedRef.current = !!dayRecipesState.expandedDays[tourTargetDay];
      if (!tourWasExpandedRef.current) {
        dayRecipesState.setExpandedDays((prev) => ({ ...prev, [tourTargetDay]: true }));
      }
    };
    const collapseDay = () => {
      if (!tourWasExpandedRef.current) {
        dayRecipesState.setExpandedDays((prev) => ({ ...prev, [tourTargetDay]: false }));
      }
    };

    const steps = [];

    if (hasMealPicker) {
      steps.push({
        id: 'picker',
        selector: '[data-tour="portal-meal-picker"]',
        title: 'Elegí qué vas a armar',
        body: 'Primero elegí uno o varios tiempos de comida (almuerzo y/o cena) y tocá "Continuar".',
      });
    }

    steps.push({
      id: 'intro',
      selector: '[data-tour="portal-order-card"]',
      title: 'Así armás tu pedido',
      body: 'Acá elegís qué recetas querés cada día de la semana. Te mostramos rápido cómo funciona.',
    });
    steps.push({
      id: 'day',
      selector: `[data-tour-day="${tourTargetDay}"] [data-tour="day-header"]`,
      title: 'Expandí un día',
      body: 'Tocá el nombre de un día para ver sus recetas y poder editarlas.',
    });

    // Si el día que usa el tour ya está cerrado (fuera del corte de
    // edición), no tiene sentido explicar "agregar receta"/"editar
    // ingredientes" — esos botones no existen para un día cerrado, y antes
    // esto hacía que el tour pareciera "cerrarse solo" (saltaba ambos pasos
    // en silencio hasta terminar).
    if (tourTargetDayIsEditable) {
      steps.push({
        id: 'add-recipe',
        groupKey: `expand-${tourTargetDay}`,
        setup: expandDay,
        teardown: collapseDay,
        selector: `[data-tour-day="${tourTargetDay}"] [data-tour="add-recipe"]`,
        title: isFamilyClient ? 'Agregá recetas' : 'Agregá recetas extra',
        body: 'Con este botón sumás otra receta a ese día, además de las que ya tiene tu menú.',
      });
      steps.push({
        id: 'edit-ingredients',
        groupKey: `expand-${tourTargetDay}`,
        setup: expandDay,
        teardown: collapseDay,
        selector: `[data-tour-day="${tourTargetDay}"] [data-tour="edit-ingredients"]`,
        title: 'Personalizá los ingredientes',
        body: 'Tocá el lápiz para cambiar algún ingrediente de esa receta, por ejemplo si no te gusta algo.',
      });
    }

    // El botón de confirmar tampoco existe si ya pasó el corte semanal o no
    // quedan días editables (mismas condiciones que el render más abajo).
    if (!isLocked && hasEditableDays) {
      steps.push({
        id: 'submit',
        selector: '[data-tour="portal-submit-button"]',
        title: 'Confirmá tu pedido',
        body: 'Cuando termines de armar la semana, confirmá tu pedido con este botón. Podés seguir editándolo mientras no haya pasado el plazo.',
      });
    }

    return steps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourTargetDay, tourTargetDayIsEditable, isFamilyClient, hasMealPicker, isLocked, hasEditableDays]);

  // Si el picker todavía se muestra, el tour arranca ahí; si la
  // clasificación ya está resuelta (pedido existente, un solo tiempo de
  // comida, o ya se pasó el picker esta sesión), arranca directo en el
  // armador — si no, con el picker ya fuera del DOM el primer paso
  // quedaría buscando algo que no existe hasta saltarlo solo.
  const tourInitialStep = hasMealPicker && !classification ? 0 : hasMealPicker ? 1 : 0;

  useEffect(() => {
    if (loading || justSubmitted) return;
    if (!hasMealPicker && !classification) return;
    let seen = false;
    try {
      seen = localStorage.getItem(tourSeenKey) === '1';
    } catch {
      // localStorage puede no estar disponible (ej. modo privado) — el tour
      // simplemente se mostrará de nuevo en la próxima visita.
    }
    if (!seen) {
      setTourStep(tourInitialStep);
      setTourOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, justSubmitted, hasMealPicker, classification]);

  const closeTour = () => {
    setTourOpen(false);
    try {
      localStorage.setItem(tourSeenKey, '1');
    } catch {
      /* ignora si no hay localStorage disponible */
    }
  };

  const startTour = () => {
    // Si se pide el tour desde la pantalla de confirmación (post-envío),
    // hay que volver al armador primero: ahí es donde viven los elementos
    // que el tour señala (la confirmación los reemplaza por completo).
    setJustSubmitted(false);
    setTourStep(tourInitialStep);
    setTourOpen(true);
  };

  const handleSubmit = async () => {
    if (!classification || submitting || isLocked) return;
    setSubmitting(true);

    const { weekStart, tuesdayDelivery } = getWeekRange();
    const days = DAYS_ORDER.filter((d) => !closedDays.has(d))
      .map((day) => {
        // Se preserva el índice original (antes del filtro) porque los
        // overrides de ingredientes se guardan por clave `${day}-${index}`.
        const recipes = (dayRecipesState.dayRecipes[day] ?? [])
          .map((r, idx) => ({ ...r, idx }))
          .filter((r) => r.recipe_id);
        if (recipes.length === 0) return null;
        const deliveryDate = tuesdayDelivery
          ? toDateString(tuesdayDelivery)
          : getDateForDay(day, weekStart, client?.route?.delivery_days ?? []);
        return {
          day_of_week: day,
          delivery_date: deliveryDate,
          details: recipes.map((r) => ({
            recipe_id: Number(r.recipe_id),
            quantity: Number(r.quantity) || 1,
            ingredients_override: dayRecipesState.ingredientOverrides[`${day}-${r.idx}`] ?? null,
            meal_type: dayRecipesState.recipeMealTypes[`${day}-${r.idx}`] ?? null,
          })),
        };
      })
      .filter(Boolean);

    if (days.length === 0) {
      sileo.error('Agregá al menos una receta a algún día antes de confirmar.');
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.schema('operations').rpc('portal_submit_order', {
      p_token: token,
      p_payload: { classification, days },
    });

    setSubmitting(false);

    if (error || data?.error) {
      if (data?.error === 'cutoff_passed') {
        sileo.error('Ya pasó el plazo para pedir o modificar esta semana.');
        await fetchAll();
        return;
      }
      sileo.error('No se pudo confirmar tu pedido. Intentá de nuevo.');
      return;
    }

    sileo.success('¡Pedido confirmado!');
    await fetchAll();
    setSubmitResult(data);
    setJustSubmitted(true);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Cargando tu plan...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 flex flex-col items-center gap-3 text-center">
        <AlertTriangle size={28} className="text-amber-500" />
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Enlace no válido</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Este enlace no es correcto o ya no está activo. Contactá al equipo de Oasis Food para
          conseguir uno nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tourOpen && (
        <GuidedTour steps={tourSteps} stepIndex={tourStep} onStepChange={setTourStep} onClose={closeTour} />
      )}

      {/* Plan */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6">
        <h1 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Hola, {client.name} 👋</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Este es tu plan y tu pedido de la semana.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium mb-1">Tipo de plan</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {isFamilyClient ? 'Familiar' : 'Personal'}
              {client.plan_type ? ` · ${client.plan_type}` : ''}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium mb-1">Ruta</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {client.route?.name ?? 'Sin ruta asignada'}
            </p>
            <div className="flex gap-1 flex-wrap mt-1">
              {(client.route?.delivery_days ?? []).map((d) => (
                <span
                  key={d}
                  className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
                >
                  {DAY_LABELS[d] ?? d}
                </span>
              ))}
            </div>
          </div>
          {!isFamilyClient &&
            MEAL_TYPES.filter((t) => client[clientMacroKey(t)]).map((type) => (
              <div key={type} className={`${CARD_STYLES[type].card} rounded-xl p-3`}>
                <p className={`text-xs ${CARD_STYLES[type].label} uppercase font-medium mb-1`}>
                  {mealLabel(type)}
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {client[clientMacroKey(type)].protein_value} {MACRO_UNIT} prot ·{' '}
                  {client[clientMacroKey(type)].carb_value} {MACRO_UNIT} carbos
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Elegir qué armar (solo personal, sin pedido todavía) */}
      {!isFamilyClient && !classification && (
        <div data-tour="portal-meal-picker" className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            ¿Qué querés armar esta semana?
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            Elegí uno o varios tiempos de comida.
          </p>
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.filter((t) => client[clientMacroKey(t)]).map((type) => {
              const selected = pickedMeals.includes(type);
              return (
                <button
                  key={type}
                  aria-pressed={selected}
                  onClick={() =>
                    setPickedMeals((prev) =>
                      selected ? prev.filter((t) => t !== type) : [...prev, type]
                    )
                  }
                  className={`${PICKER_BUTTON} ${
                    selected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600'
                      : ''
                  }`}
                >
                  {selected ? '✓ ' : ''}
                  {mealLabel(type)}
                </button>
              );
            })}
          </div>
          <button
            disabled={pickedMeals.length === 0}
            onClick={() => chooseClassification(classificationOf(pickedMeals))}
            className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Armar / editar pedido */}
      {classification && !justSubmitted && (
        <div data-tour="portal-order-card" className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {currentOrder?.exists ? 'Tu pedido de esta semana' : 'Armá tu pedido de esta semana'}
            </h2>
            <button
              type="button"
              onClick={startTour}
              className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
            >
              <Compass size={13} /> Ver tour
            </button>
          </div>
          {currentOrder?.week_start_date && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Semana del {currentOrder.week_start_date} al {currentOrder.week_end_date}
            </p>
          )}

          {isLocked && (
            <div className="mb-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>
                Ya pasó el plazo para pedir o modificar esta semana. Podés revisar tu
                pedido, pero para cambiarlo contactá al equipo de Oasis Food.
              </p>
            </div>
          )}

          <OrderAdjustments
            isFamilyClient={isFamilyClient}
            menuType={classification}
            resolvedRoute={resolvedRoute}
            allRoutes={[]}
            showRouteChange={false}
            macrosByType={macrosByType}
            getEffectiveMacros={macros.getEffectiveMacros}
            isDayOverridden={macros.isDayOverridden}
            onUpdateDayMacro={macros.updateDayMacro}
            onResetDayMacro={macros.resetDayMacro}
            onResetAllDayMacros={macros.resetAllDayMacros}
            hideMacroEditor
            dayRecipes={dayRecipesState.dayRecipes}
            allRecipes={menuOptions?.recipes ?? []}
            recipeIngredients={dayRecipesState.recipeIngredients}
            ingredientOverrides={dayRecipesState.ingredientOverrides}
            expandedDays={dayRecipesState.expandedDays}
            onAddRecipe={(day) => dayRecipesState.addRecipeToDay(day)}
            onUpdateRecipe={(day, index, field, value) =>
              dayRecipesState.updateRecipeInDay(day, index, field, value, menuOptions?.recipes ?? [])
            }
            onRemoveRecipe={dayRecipesState.removeRecipeFromDay}
            onOverrideChange={dayRecipesState.setOverride}
            onToggleDay={dayRecipesState.toggleDay}
            extraMealTypes={dayRecipesState.recipeMealTypes}
            onExtraMealTypeChange={(key, cls) =>
              dayRecipesState.setRecipeMealTypes((p) => ({ ...p, [key]: cls }))
            }
            closedDays={closedDays}
          />

          {isLocked ? null : hasEditableDays ? (
            <button
              data-tour="portal-submit-button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.01] transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? 'Enviando...' : currentOrder?.exists ? 'Guardar cambios' : 'Confirmar pedido'}
            </button>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center mt-5">
              Ya no quedan días editables para esta semana.
            </p>
          )}
        </div>
      )}

      {/* Confirmación (RF-PC-11) — reemplaza el armador, no convive con él */}
      {justSubmitted && submitResult && (
        <PortalOrderSummary
          client={client}
          classification={classification}
          isFamilyClient={isFamilyClient}
          resolvedRoute={resolvedRoute}
          macrosByType={macrosByType}
          dayRecipes={dayRecipesState.dayRecipes}
          weekStart={currentOrder?.week_start_date}
          weekEnd={currentOrder?.week_end_date}
          appliedDays={submitResult.applied_days}
          skippedDays={submitResult.skipped_days}
          onEditAgain={() => setJustSubmitted(false)}
          onViewTour={startTour}
        />
      )}
    </div>
  );
};

export default CustomerPortal;
