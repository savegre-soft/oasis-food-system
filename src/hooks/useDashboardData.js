import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

// ── Date helpers ──────────────────────────────────────────────────────────────

export const getThisWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun
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

export const getLast = (days) => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

export const getThisMonth = () => {
  const today = new Date();
  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useDashboardData = () => {
  const { supabase } = useApp();

  // ── State ──────────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState(getThisWeek);

  // Static (load once)
  const [clientCount, setClientCount] = useState(0);
  const [clientsPerDistrict, setClientsPerDistrict] = useState([]);
  const [clientLocations, setClientLocations] = useState([]);

  // Date-filtered (reload on range change)
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [activeClientCount, setActiveClientCount] = useState(0);
  const [expressCount, setExpressCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
  const [orderDaysByDate, setOrderDaysByDate] = useState([]);
  const [classificationDist, setClassificationDist] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);

  const [loadingStatic, setLoadingStatic] = useState(true);
  const [loadingFiltered, setLoadingFiltered] = useState(true);
  const [error, setError] = useState(null);

  // ── Static fetch (clients, districts, map) ─────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingStatic(true);

        const [{ count }, { data: districts }, { data: clients }] = await Promise.all([
          supabase
            .schema('operations')
            .from('clients')
            .select('id_client', { count: 'exact', head: true }),

          supabase.schema('operations').from('districts').select('*'),

          supabase
            .schema('operations')
            .from('clients')
            .select('id_client, name, district_id, latitude, longitude'),
        ]);

        setClientCount(count || 0);

        const distCounts = {};
        const locations = [];
        (clients || []).forEach((c) => {
          if (c.district_id) distCounts[c.district_id] = (distCounts[c.district_id] || 0) + 1;
          if (c.latitude && c.longitude) locations.push(c);
        });
        setClientsPerDistrict(
          (districts || []).map((d) => ({ name: d.name, clientes: distCounts[d.district_id] || 0 }))
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

  // ── Filtered fetch (single query, re-runs on date range change) ────────────
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

        // Pre-fill all dates in range with 0
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
          // Deliveries per date
          if (od.delivery_date in dateMap) dateMap[od.delivery_date]++;

          const order = od.orders;
          const cls = order?.classification;
          if (cls && cls in classCounts) classCounts[cls]++;
          if (order?.route_id == null) express++;
          else normal++;
          const cid = order?.clients?.id_client;
          if (cid) activeIds.add(cid);

          // Recipes
          (od.order_day_details || []).forEach((d) => {
            const name = d.recipes?.name;
            if (name) recipeCounts[name] = (recipeCounts[name] || 0) + (d.quantity || 1);
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

  // ── Return ─────────────────────────────────────────────────────────────────
  return {
    // Date range control
    dateRange,
    setDateRange,

    // Static
    clientCount,
    clientsPerDistrict,
    clientLocations,

    // Filtered
    totalDeliveries,
    activeClientCount,
    normalCount,
    expressCount,
    orderDaysByDate,
    classificationDist,
    topRecipes,

    // Loading
    loading: loadingStatic,
    loadingFiltered,
    error,
  };
};
