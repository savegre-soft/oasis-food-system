import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import OrderAdjustments from '../components/OrderAdjustments';
import PortalOrderSummary from '../components/portal/PortalOrderSummary';
import { useMacros } from '../components/useMacros';
import { useDayRecipes } from '../components/useDayRecipes';
import {
  DAYS_ORDER,
  DAY_LABELS,
  MACRO_UNIT,
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
const buildDayRecipesFromTemplates = (resolvedTemplates, classification) => {
  const recipes = {};
  DAYS_ORDER.forEach((d) => {
    recipes[d] = [];
  });
  const addTemplate = (tmpl) => {
    if (!tmpl) return;
    (tmpl.days ?? []).forEach((day) => {
      if (!recipes[day.day_of_week]) recipes[day.day_of_week] = [];
      (day.details ?? []).forEach((det) => {
        recipes[day.day_of_week].push({
          recipe_id: String(det.recipe_id),
          recipe_name: det.recipe_name,
          quantity: det.quantity,
          isExtra: true,
        });
      });
    });
  };
  if (classification === 'Lunch' || classification === 'both') addTemplate(resolvedTemplates?.Lunch);
  if (classification === 'Dinner' || classification === 'both') addTemplate(resolvedTemplates?.Dinner);
  return recipes;
};

const CustomerPortal = () => {
  const { token } = useParams();
  const { supabase } = useApp();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [client, setClient] = useState(null);
  const [menuOptions, setMenuOptions] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [classification, setClassification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const macros = useMacros();
  const dayRecipesState = useDayRecipes();

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

    const isFamilyClient = clientData.client_type === 'family';
    let resolvedClassification = null;
    if (isFamilyClient) {
      resolvedClassification = 'Family';
    } else if (orderData?.exists) {
      resolvedClassification = orderData.classification;
    } else if (clientData.lunch_macro && !clientData.dinner_macro) {
      resolvedClassification = 'Lunch';
    } else if (clientData.dinner_macro && !clientData.lunch_macro) {
      resolvedClassification = 'Dinner';
    }
    setClassification(resolvedClassification); // null → el cliente elige (picker)

    if (orderData?.exists) {
      const adapted = orderData.days.map((d) => ({
        day_of_week: d.day_of_week,
        order_day_details: d.details.map((det) => ({
          recipe_id: det.recipe_id,
          quantity: det.quantity,
          recipes: { id_recipe: det.recipe_id, name: det.recipe_name },
        })),
      }));
      dayRecipesState.loadFromOrderDays(adapted);
    } else if (resolvedClassification) {
      dayRecipesState.setDayRecipes(
        buildDayRecipesFromTemplates(optionsData?.resolved_templates, resolvedClassification)
      );
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
    dayRecipesState.setDayRecipes(buildDayRecipesFromTemplates(menuOptions?.resolved_templates, cls));
  };

  const isFamilyClient = client?.client_type === 'family';

  const resolvedRoute = client?.route
    ? {
        name: client.route.name,
        route_delivery_days: (client.route.delivery_days ?? []).map((d) => ({ day_of_week: d })),
      }
    : null;

  const closedDays = useMemo(() => {
    const s = new Set();
    (currentOrder?.days ?? []).forEach((d) => {
      if (d.is_editable === false) s.add(d.day_of_week);
    });
    return s;
  }, [currentOrder]);

  const hasEditableDays = DAYS_ORDER.some((d) => !closedDays.has(d));

  const handleSubmit = async () => {
    if (!classification || submitting) return;
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
          {!isFamilyClient && client.lunch_macro && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-medium mb-1">☀️ Almuerzo</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {client.lunch_macro.protein_value} {MACRO_UNIT} prot · {client.lunch_macro.carb_value}{' '}
                {MACRO_UNIT} carbos
              </p>
            </div>
          )}
          {!isFamilyClient && client.dinner_macro && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-medium mb-1">🌙 Cena</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {client.dinner_macro.protein_value} {MACRO_UNIT} prot · {client.dinner_macro.carb_value}{' '}
                {MACRO_UNIT} carbos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Elegir qué armar (solo personal, sin pedido todavía) */}
      {!isFamilyClient && !classification && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            ¿Qué querés armar esta semana?
          </h2>
          <div className="flex gap-2 flex-wrap">
            {client.lunch_macro && (
              <button
                onClick={() => chooseClassification('Lunch')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
              >
                ☀️ Solo almuerzo
              </button>
            )}
            {client.dinner_macro && (
              <button
                onClick={() => chooseClassification('Dinner')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
              >
                🌙 Solo cena
              </button>
            )}
            {client.lunch_macro && client.dinner_macro && (
              <button
                onClick={() => chooseClassification('both')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
              >
                ☀️🌙 Ambos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Armar / editar pedido */}
      {classification && !justSubmitted && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {currentOrder?.exists ? 'Tu pedido de esta semana' : 'Armá tu pedido de esta semana'}
          </h2>
          {currentOrder?.week_start_date && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Semana del {currentOrder.week_start_date} al {currentOrder.week_end_date}
            </p>
          )}

          <OrderAdjustments
            isFamilyClient={isFamilyClient}
            menuType={classification}
            resolvedRoute={resolvedRoute}
            allRoutes={[]}
            showRouteChange={false}
            lunchMacros={macros.lunchMacros}
            dinnerMacros={macros.dinnerMacros}
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
            closedDays={closedDays}
          />

          {hasEditableDays ? (
            <button
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
          lunchMacros={macros.lunchMacros}
          dinnerMacros={macros.dinnerMacros}
          dayRecipes={dayRecipesState.dayRecipes}
          weekStart={currentOrder?.week_start_date}
          weekEnd={currentOrder?.week_end_date}
          appliedDays={submitResult.applied_days}
          skippedDays={submitResult.skipped_days}
          onEditAgain={() => setJustSubmitted(false)}
        />
      )}
    </div>
  );
};

export default CustomerPortal;
