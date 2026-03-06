import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import RecipeProductionCard from '../components/RecipeProductionCard';

const DAY_LABELS = {
  Monday:    'Lunes',
  Tuesday:   'Martes',
  Wednesday: 'Miércoles',
  Thursday:  'Jueves',
  Friday:    'Viernes',
  Saturday:  'Sábado',
  Sunday:    'Domingo',
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
};

const Production = () => {
  const { supabase } = useApp();
  const { weekStart, weekEnd } = getWeekRange();

  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);
  const [orderDays, setOrderDays] = useState([]);
  const [expandedRecipes, setExpandedRecipes] = useState({});

  // ===============================
  // DÍAS CON ENTREGAS PENDIENTES
  // ===============================
  const getAvailableDays = async () => {
    setLoadingDays(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('order_days')
      .select('day_of_week')
      .eq('status', 'PENDING')
      .gte('delivery_date', weekStart)
      .lte('delivery_date', weekEnd);

    if (error) {
      console.error(error);
      setLoadingDays(false);
      return;
    }

    const unique = [...new Set((data ?? []).map((d) => d.day_of_week))]
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

    setAvailableDays(unique);

    if (unique.length > 0 && !selectedDay) {
      setSelectedDay(unique[0]);
    }

    setLoadingDays(false);
  };

  useEffect(() => {
    getAvailableDays();
  }, []);

  // ===============================
  // DATOS DEL DÍA SELECCIONADO
  // ===============================
  const getData = async () => {
    if (!selectedDay) return;
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('order_days')
      .select(`
        id_order_day,
        day_of_week,
        delivery_date,
        status,
        orders (
          id_order,
          classification,
          clients ( id_client, name )
        ),
        order_day_details (
          id_order_day_detail,
          quantity,
          protein_value_applied,
          protein_unit_applied,
          carb_value_applied,
          carb_unit_applied,
          recipes ( id_recipe, name )
        )
      `)
      .eq('day_of_week', selectedDay)
      .eq('status', 'PENDING')
      .gte('delivery_date', weekStart)
      .lte('delivery_date', weekEnd)
      .order('id_order_day');

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOrderDays(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    getData();
    setExpandedRecipes({});
  }, [selectedDay]);

  // ===============================
  // MARCAR ENTREGA
  // ===============================
  const markDelivered = async (orderDayId) => {
    const { error } = await supabase
      .schema('operations')
      .from('order_days')
      .update({ status: 'DELIVERED' })
      .eq('id_order_day', orderDayId);

    if (error) {
      sileo.error('Error al marcar la entrega');
      console.error(error);
      return;
    }

    sileo.success('Entrega marcada como completada');
    await getAvailableDays();
    await getData();
  };

  // ===============================
  // ===============================
  // AGRUPAR POR RECETA → CLIENTE → MEALS
  // Estructura: recipe → clients (agrupados por nombre) → meals (Almuerzo/Cena)
  // ===============================
  const groupByRecipe = () => {
    const grouped = {};

    for (const orderDay of orderDays) {
      const clientName = orderDay.orders?.clients?.name ?? 'Cliente';
      const classification = orderDay.orders?.classification;
      const orderDayId = orderDay.id_order_day;

      // Consolidar detalles del mismo orderDay por receta
      const detailsByRecipe = {};
      for (const detail of orderDay.order_day_details ?? []) {
        const recipeId = detail.recipes?.id_recipe;
        if (!recipeId) continue;
        if (!detailsByRecipe[recipeId]) {
          detailsByRecipe[recipeId] = {
            recipeId,
            recipeName: detail.recipes?.name ?? 'Receta',
            quantity: 0,
            protein: detail.protein_value_applied,
            proteinUnit: detail.protein_unit_applied,
            carb: detail.carb_value_applied,
            carbUnit: detail.carb_unit_applied,
          };
        }
        detailsByRecipe[recipeId].quantity += detail.quantity;
      }

      // Agregar al agrupado: receta → cliente → meals
      for (const item of Object.values(detailsByRecipe)) {
        if (!grouped[item.recipeId]) {
          grouped[item.recipeId] = { recipe_name: item.recipeName, totalUnits: 0, clients: {} };
        }
        grouped[item.recipeId].totalUnits += item.quantity;

        if (!grouped[item.recipeId].clients[clientName]) {
          grouped[item.recipeId].clients[clientName] = { clientName, totalQuantity: 0, meals: [] };
        }
        grouped[item.recipeId].clients[clientName].totalQuantity += item.quantity;
        grouped[item.recipeId].clients[clientName].meals.push({
          classification,
          quantity: item.quantity,
          orderDayId,
          protein: item.protein,
          proteinUnit: item.proteinUnit,
          carb: item.carb,
          carbUnit: item.carbUnit,
        });
      }
    }

    // Convertir clients de objeto a array
    for (const recipe of Object.values(grouped)) {
      recipe.clients = Object.values(recipe.clients);
    }

    return grouped;
  };


  const grouped = groupByRecipe();
  const totalPending = orderDays.length;
  const totalUnitsAll = Object.values(grouped).reduce((acc, r) => acc + r.totalUnits, 0);

  const toggleRecipe = (recipeId) => {
    setExpandedRecipes((prev) => ({ ...prev, [recipeId]: !prev[recipeId] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">Producción</h1>
        <p className="text-slate-500 mt-2">
          Semana del {new Date(weekStart + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long' })} al {new Date(weekEnd + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {loadingDays ? (
        <p className="text-slate-400 text-sm">Cargando días...</p>
      ) : availableDays.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay entregas pendientes esta semana</p>
        </div>
      ) : (
        <>
          {/* Selector de día — dinámico */}
          <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-8">
            {availableDays.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  selectedDay === day
                    ? 'bg-white shadow text-slate-800'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {DAY_LABELS[day] ?? day}
              </button>
            ))}
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 flex items-center gap-4">
              <Clock className="text-amber-500 shrink-0" size={22} />
              <div>
                <p className="text-xs text-slate-500">Pedidos pendientes</p>
                <p className="text-2xl font-semibold text-slate-800">{totalPending}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 flex items-center gap-4">
              <Truck className="text-blue-500 shrink-0" size={22} />
              <div>
                <p className="text-xs text-slate-500">Total unidades</p>
                <p className="text-2xl font-semibold text-slate-800">{totalUnitsAll}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 flex items-center gap-4">
              <CheckCircle className="text-green-500 shrink-0" size={22} />
              <div>
                <p className="text-xs text-slate-500">Recetas distintas</p>
                <p className="text-2xl font-semibold text-slate-800">{Object.keys(grouped).length}</p>
              </div>
            </div>
          </div>

          {/* Lista agrupada */}
          {loading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
              <p>Todas las entregas del {DAY_LABELS[selectedDay]} están completadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([recipeId, recipe]) => (
                <RecipeProductionCard
                  key={recipeId}
                  recipeId={recipeId}
                  recipe={recipe}
                  isExpanded={expandedRecipes[recipeId] ?? false}
                  onToggle={toggleRecipe}
                  onDeliver={markDelivered}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Production;