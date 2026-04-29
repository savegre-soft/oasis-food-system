import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

/**
 * @typedef {Object} DateRange
 * @property {string} from - Fecha inicio (YYYY-MM-DD)
 * @property {string} to - Fecha fin (YYYY-MM-DD)
 */

/**
 * @typedef {Object} ClientsPerDistrict
 * @property {string} name
 * @property {number} clientes
 */

/**
 * @typedef {Object} ClientLocation
 * @property {number|string} id_client
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @typedef {Object} OrderDayByDate
 * @property {string} date - Formato MM/DD
 * @property {number} count
 */

/**
 * @typedef {Object} ClassificationItem
 * @property {string} name
 * @property {number} value
 */

/**
 * @typedef {Object} RecipeStat
 * @property {string} name
 * @property {number} total
 */

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Obtiene el rango de la semana actual (lunes a domingo)
 * @returns {DateRange}
 */
export const getThisWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
  };
};

/**
 * Obtiene un rango de los últimos N días
 * @param {number} days
 * @returns {DateRange}
 */
export const getLast = (days) => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));

  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

/**
 * Obtiene el rango del mes actual
 * @returns {DateRange}
 */
export const getThisMonth = () => {
  const today = new Date();

  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook para obtener métricas del dashboard:
 * - Datos estáticos (clientes, ubicaciones)
 * - Datos filtrados por rango de fechas
 *
 * Optimizado con:
 * - Carga inicial paralela
 * - Query única para métricas filtradas
 *
 * @returns {{
 *  dateRange: DateRange,
 *  setDateRange: (range: DateRange) => void,
 *  clientCount: number,
 *  clientsPerDistrict: ClientsPerDistrict[],
 *  clientLocations: ClientLocation[],
 *  totalDeliveries: number,
 *  activeClientCount: number,
 *  normalCount: number,
 *  expressCount: number,
 *  orderDaysByDate: OrderDayByDate[],
 *  classificationDist: ClassificationItem[],
 *  topRecipes: RecipeStat[],
 *  loading: boolean,
 *  loadingFiltered: boolean,
 *  error: string|null
 * }}
 */
export const useDashboardData = () => {
  const { supabase } = useApp();

  /** @type {[DateRange, Function]} */
  const [dateRange, setDateRange] = useState(getThisWeek);

  // ── Static ────────────────────────────────────────────────────────────────
  /** @type {[number, Function]} */
  const [clientCount, setClientCount] = useState(0);

  /** @type {[ClientsPerDistrict[], Function]} */
  const [clientsPerDistrict, setClientsPerDistrict] = useState([]);

  /** @type {[ClientLocation[], Function]} */
  const [clientLocations, setClientLocations] = useState([]);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [activeClientCount, setActiveClientCount] = useState(0);
  const [expressCount, setExpressCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);

  /** @type {[OrderDayByDate[], Function]} */
  const [orderDaysByDate, setOrderDaysByDate] = useState([]);

  /** @type {[ClassificationItem[], Function]} */
  const [classificationDist, setClassificationDist] = useState([]);

  /** @type {[RecipeStat[], Function]} */
  const [topRecipes, setTopRecipes] = useState([]);

  const [loadingStatic, setLoadingStatic] = useState(true);
  const [loadingFiltered, setLoadingFiltered] = useState(true);
  const [error, setError] = useState(null);

  // ── Static fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingStatic(true);

        const [{ count }, { data: districts }, { data: clients }] =
          await Promise.all([
            supabase
              .schema('operations')
              .from('clients')
              .select('id_client', { count: 'exact', head: true }),

            supabase.schema('operations').from('districts').select('*'),

            supabase
              .schema('operations')
              .from('clients')
              .select(
                'id_client, name, district_id, latitude, longitude'
              ),
          ]);

        setClientCount(count || 0);

        const distCounts = {};
        const locations = [];

        (clients || []).forEach((c) => {
          if (c.district_id) {
            distCounts[c.district_id] =
              (distCounts[c.district_id] || 0) + 1;
          }

          if (c.latitude && c.longitude) {
            locations.push(c);
          }
        });

        setClientsPerDistrict(
          (districts || []).map((d) => ({
            name: d.name,
            clientes: distCounts[d.district_id] || 0,
          }))
        );

        setClientLocations(locations);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingStatic(false);
      }
    };

    run();
  }, [supabase]);

  // ── Filtered fetch ────────────────────────────────────────────────────────
  const fetchFiltered = useCallback(
    async (from, to) => {
      try {
        setLoadingFiltered(true);

        const { data, error } = await supabase
          .schema('operations')
          .from('order_days')
          .select(
            `delivery_date,
             orders ( id_order, classification, route_id, clients ( id_client ) ),
             order_day_details ( quantity, recipes ( name ) )`
          )
          .gte('delivery_date', from)
          .lte('delivery_date', to)
          .order('delivery_date');

        if (error) throw error;

        const rows = data || [];

        // Inicializar fechas
        const dateMap = {};
        for (
          let d = new Date(from + 'T00:00:00');
          d <= new Date(to + 'T00:00:00');
          d.setDate(d.getDate() + 1)
        ) {
          dateMap[d.toISOString().split('T')[0]] = 0;
        }

        const classCounts = { Lunch: 0, Dinner: 0, Family: 0 };
        const recipeCounts = {};
        const activeIds = new Set();

        let normal = 0;
        let express = 0;

        rows.forEach((od) => {
          if (od.delivery_date in dateMap) {
            dateMap[od.delivery_date]++;
          }

          const order = od.orders;
          const cls = order?.classification;

          if (cls && cls in classCounts) {
            classCounts[cls]++;
          }

          if (order?.route_id == null) express++;
          else normal++;

          const cid = order?.clients?.id_client;
          if (cid) activeIds.add(cid);

          (od.order_day_details || []).forEach((d) => {
            const name = d.recipes?.name;
            if (name) {
              recipeCounts[name] =
                (recipeCounts[name] || 0) + (d.quantity || 1);
            }
          });
        });

        setTotalDeliveries(rows.length);
        setNormalCount(normal);
        setExpressCount(express);
        setActiveClientCount(activeIds.size);

        setOrderDaysByDate(
          Object.entries(dateMap).map(([date, count]) => ({
            date: date.slice(5).replace('-', '/'),
            count,
          }))
        );

        setClassificationDist([
          { name: 'Almuerzo', value: classCounts.Lunch },
          { name: 'Cena', value: classCounts.Dinner },
          { name: 'Familiar', value: classCounts.Family },
        ]);

        setTopRecipes(
          Object.entries(recipeCounts)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8)
        );
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingFiltered(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchFiltered(dateRange.from, dateRange.to);
  }, [dateRange, fetchFiltered]);

  return {
    dateRange,
    setDateRange,

    clientCount,
    clientsPerDistrict,
    clientLocations,

    totalDeliveries,
    activeClientCount,
    normalCount,
    expressCount,
    orderDaysByDate,
    classificationDist,
    topRecipes,

    loading: loadingStatic,
    loadingFiltered,
    error,
  };
};