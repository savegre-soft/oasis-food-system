import { useState, useEffect } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import OrderAdjustments from './OrderAdjustments';
import { useDayRecipes } from './useDayRecipes';
import { useMacros } from './useMacros';
import {
  DAYS_ORDER,
  DAY_LABELS,
  STANDARD_MACRO,
  clientMacroKey,
  isFamily,
  getDateForDay,
  mealTypesOf,
  primaryMealType,
} from './orderUtils';


const EditOrder = ({ order, onSuccess }) => {
  const { supabase } = useApp();
  const isFamilyClient = isFamily(order.clients);
  const menuType = order.classification; // 'Breakfast' | 'Lunch' | 'Dinner' | 'both' | 'Breakfast+Lunch' | … | 'Family'
  const [loading, setLoading] = useState(false);
  const [allRecipes, setAllRecipes] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [resolvedRoute, setResolvedRoute] = useState(order.routes ?? null);
  const [extraMealTypes, setExtraMealTypes] = useState({});

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const {
    dayRecipes,
    recipeIngredients,
    ingredientOverrides,
    expandedDays,
    addRecipeToDay,
    updateRecipeInDay,
    removeRecipeFromDay,
    setOverride,
    toggleDay,
    loadFromOrderDays,
  } = useDayRecipes();

  const {
    lunchMacros,
    setLunchMacros,
    dinnerMacros,
    setDinnerMacros,
    breakfastMacros,
    setBreakfastMacros,
    updateLunchMacro,
    updateDinnerMacro,
    updateBreakfastMacro,
    getBaseMacros,
    updateDayMacro,
    resetDayMacro,
    resetAllDayMacros,
    getEffectiveMacros,
    isDayOverridden,
  } = useMacros();

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('recipes')
        .select('id_recipe, name')
        .eq('is_active', true)
        .order('name');
      setAllRecipes(data ?? []);
    };
    const fetchRoutes = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('routes')
        .select('id_route, name, route_type, route_delivery_days(day_of_week)')
        .eq('is_active', true)
        .order('name');
      
      // Validar que todas las rutas tengan route_delivery_days
      const routesWithDays = (data ?? []).map(route => ({
        ...route,
        route_delivery_days: Array.isArray(route.route_delivery_days) 
          ? route.route_delivery_days 
          : []
      }));
      
      setAllRoutes(routesWithDays);
    };
    
    const loadCurrentRoute = async () => {
      // Si el pedido tiene una ruta asignada, cargar la información completa de esa ruta
      // incluyendo sus route_delivery_days para calcular correctamente las fechas de entrega
      if (order.route_id) {
        const { data } = await supabase
          .schema('operations')
          .from('routes')
          .select('id_route, name, route_type, route_delivery_days(day_of_week)')
          .eq('id_route', order.route_id)
          .maybeSingle();
        if (data) {
          setResolvedRoute(data);
        }
      }
    };
    
    fetchRecipes();
    fetchRoutes();
    loadCurrentRoute();
  }, [order.route_id]);

  // ── Pre-fill from order ───────────────────────────────────────────────────
  // Cada tiempo de comida del pedido tiene sus propios macros base: el tiempo
  // principal usa el snapshot del pedido y los demás el perfil actual del cliente
  // (o el estándar si el cliente no lo tiene). Cada receta existente se asigna al
  // tiempo cuyos macros coinciden con los que se le aplicaron al crearla.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const types = isFamilyClient ? [] : mealTypesOf(menuType);
      const primary = primaryMealType(menuType);
      const setters = {
        Breakfast: setBreakfastMacros,
        Lunch: setLunchMacros,
        Dinner: setDinnerMacros,
      };

      const base = {};
      if (types.length > 0) {
        const { data: clientRow } = await supabase
          .schema('operations')
          .from('clients')
          .select(
            `id_client,
             lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey(protein_value,carb_value),
             dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey(protein_value,carb_value),
             breakfast_macro:macro_profiles!clients_breakfast_macro_profile_id_fkey(protein_value,carb_value)`
          )
          .eq('id_client', order.clients?.id_client ?? order.client_id)
          .maybeSingle();
        types.forEach((t) => {
          const m = clientRow?.[clientMacroKey(t)];
          base[t] =
            t === primary
              ? {
                  protein_value: order.protein_snapshot ?? m?.protein_value ?? STANDARD_MACRO.protein_value,
                  carb_value: order.carb_snapshot ?? m?.carb_value ?? STANDARD_MACRO.carb_value,
                }
              : m
                ? { protein_value: m.protein_value, carb_value: m.carb_value }
                : { ...STANDARD_MACRO };
        });
      } else {
        // Pedido familiar: solo el snapshot, sin desglose por tiempo de comida.
        base.Lunch = {
          protein_value: order.protein_snapshot ?? '',
          carb_value: order.carb_snapshot ?? '',
        };
      }

      // Macros aplicados a cada detalle existente, para asignarle su tiempo de comida.
      const orderDays = order.order_days ?? [];
      let appliedById = {};
      if (types.length > 1) {
        const dayIds = orderDays.map((d) => d.id_order_day);
        const { data: applied } = await supabase
          .schema('operations')
          .from('order_day_details')
          .select('id_order_day_detail, protein_value_applied, carb_value_applied')
          .in('order_day_id', dayIds);
        appliedById = Object.fromEntries((applied ?? []).map((a) => [a.id_order_day_detail, a]));
      }
      const inferMealType = (det) => {
        const a = appliedById[det.id_order_day_detail];
        if (!a) return primary;
        return (
          types.find(
            (t) =>
              String(base[t]?.protein_value) === String(a.protein_value_applied) &&
              String(base[t]?.carb_value) === String(a.carb_value_applied)
          ) ?? primary
        );
      };

      if (cancelled) return;
      Object.entries(base).forEach(([t, m]) => setters[t](m));
      loadFromOrderDays(
        orderDays.map((od) => ({
          ...od,
          order_day_details: (od.order_day_details ?? []).map((det) =>
            types.length > 0 ? { ...det, mealType: inferMealType(det) } : det
          ),
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [order]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    const weekStart = new Date(order.week_start_date + 'T00:00:00');
    const activeDays = DAYS_ORDER.filter((d) => (dayRecipes[d] ?? []).some((r) => r.recipe_id));
    const routeDays = (resolvedRoute?.route_delivery_days ?? []).map((d) => d.day_of_week);
    const type = menuType;

    // Update order-level fields
    const { error: orderErr } = await supabase
      .schema('operations')
      .from('orders')
      .update({
        route_id: resolvedRoute?.id_route ?? null,
        protein_snapshot: getBaseMacros(type)?.protein_value ?? null,
        carb_snapshot: getBaseMacros(type)?.carb_value ?? null,
      })
      .eq('id_order', order.id_order);
    if (orderErr) {
      sileo.error('Error al actualizar el pedido');
      console.error(orderErr);
      setLoading(false);
      return;
    }

    // Explicit deletion in dependency order to avoid FK constraint failures
    const existingOrderDayIds = (order.order_days ?? []).map((d) => d.id_order_day);
    const existingDetailIds = (order.order_days ?? [])
      .flatMap((d) => (d.order_day_details ?? []).map((det) => det.id_order_day_detail));

    if (existingDetailIds.length > 0) {
      const { error: ovDelErr } = await supabase
        .schema('operations')
        .from('order_day_recipe_overrides')
        .delete()
        .in('order_day_detail_id', existingDetailIds);
      if (ovDelErr) console.error('Error eliminando overrides:', ovDelErr);
    }

    if (existingOrderDayIds.length > 0) {
      const { error: detDelErr } = await supabase
        .schema('operations')
        .from('order_day_details')
        .delete()
        .in('order_day_id', existingOrderDayIds);
      if (detDelErr) {
        sileo.error('Error al limpiar detalles del pedido');
        console.error(detDelErr);
        setLoading(false);
        return;
      }
    }

    const { error: delErr } = await supabase
      .schema('operations')
      .from('order_days')
      .delete()
      .eq('order_id', order.id_order);
    if (delErr) {
      sileo.error('Error al limpiar días');
      console.error(delErr);
      setLoading(false);
      return;
    }

    // Re-insert order_days + details
    for (const day of activeDays) {
      const calculatedDeliveryDate = getDateForDay(day, weekStart, routeDays);

      const { data: dayData, error: dayErr } = await supabase
        .schema('operations')
        .from('order_days')
        .insert([
          {
            order_id: order.id_order,
            day_of_week: day,
            delivery_date: calculatedDeliveryDate,
            status: 'PENDING',
          },
        ])
        .select('id_order_day')
        .single();
      if (dayErr) {
        sileo.error(`Error en día ${DAY_LABELS[day]}`);
        console.error(dayErr);
        setLoading(false);
        return;
      }

      const details = (dayRecipes[day] ?? [])
        .map((r, origIdx) => ({ r, origIdx }))
        .filter(({ r }) => r.recipe_id);
      if (!details.length) continue;

      const { data: detData, error: detErr } = await supabase
        .schema('operations')
        .from('order_day_details')
        .insert(
          details.map(({ r, origIdx }) => {
            // Cada receta usa los macros de su propio tiempo de comida.
            const mealType =
              extraMealTypes[`${day}-${origIdx}`] ?? r.mealType ?? primaryMealType(type);
            const eff = getEffectiveMacros(day, mealType);
            return {
              order_day_id: dayData.id_order_day,
              recipe_id: r.recipe_id,
              quantity: Number(r.quantity) || 1,
              protein_value_applied: eff?.protein_value ?? null,
              carb_value_applied: eff?.carb_value ?? null,
            };
          })
        )
        .select('id_order_day_detail');
      if (detErr) {
        sileo.error(`Error guardando recetas de ${DAY_LABELS[day]}`);
        console.error(detErr);
        setLoading(false);
        return;
      }

      const overrideRows = [];
      (detData ?? []).forEach((det, i) => {
        const ov = ingredientOverrides[`${day}-${i}`];
        if (!ov) return;
        for (const cat of ['protein', 'carb', 'extra']) {
          for (const name of ov[cat] ?? [])
            overrideRows.push({
              order_day_detail_id: det.id_order_day_detail,
              name,
              category: cat,
            });
        }
      });
      if (overrideRows.length) {
        const { error: ovErr } = await supabase
          .schema('operations')
          .from('order_day_recipe_overrides')
          .insert(overrideRows);
        if (ovErr) console.error('Error guardando overrides:', ovErr);
      }
    }

    sileo.success('Pedido actualizado correctamente');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto" data-gramm="false">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-100 rounded-xl">
          <Pencil size={18} className="text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Editar Pedido</h2>
          <p className="text-sm text-slate-500">
            {order.clients?.name} ·{' '}
            {new Date(order.week_start_date + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
            })}{' '}
            —{' '}
            {new Date(order.week_end_date + 'T00:00:00').toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <OrderAdjustments
        isFamilyClient={isFamilyClient}
        menuType={menuType}
        resolvedRoute={resolvedRoute}
        allRoutes={allRoutes}
        onRouteChange={(r) => {
          setResolvedRoute(r);
        }}
        showRouteChange={true}
        macrosByType={{ Breakfast: breakfastMacros, Lunch: lunchMacros, Dinner: dinnerMacros }}
        onUpdateMacro={(type, field, value) =>
          (type === 'Breakfast'
            ? updateBreakfastMacro
            : type === 'Dinner'
              ? updateDinnerMacro
              : updateLunchMacro)(field, value)
        }
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
        onUpdateRecipe={(day, idx, field, val) =>
          updateRecipeInDay(day, idx, field, val, allRecipes)
        }
        onRemoveRecipe={removeRecipeFromDay}
        onOverrideChange={setOverride}
        onToggleDay={toggleDay}
        extraMealTypes={extraMealTypes}
        onExtraMealTypeChange={(key, cls) => setExtraMealTypes((p) => ({ ...p, [key]: cls }))}
      />

      <div className="flex justify-end pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
        >
          <Check size={16} />
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

export default EditOrder;
