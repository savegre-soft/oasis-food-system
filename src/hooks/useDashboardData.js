import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export const useDashboardData = () => {
  const { supabase } = useApp();

  const [clientCount, setClientCount] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [clientsPerDistrict, setClientsPerDistrict] = useState([]);
  const [ordersByDate, setOrdersByDate] = useState([]);
  const [clientLocations, setClientLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalOrders, setTotalOrders] = useState(0);

  // Obtener cantidad total de clientes
  const fetchClientCount = async () => {
    const { count, error } = await supabase
      .schema('operations')
      .from('clients')
      .select('id_client', { count: 'exact', head: true });

    if (error) throw error;

    setClientCount(count || 0);
  };

  const fetchOrdersByDate = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('orders')
      .select('id_order, week_start_date,week_end_date');

    setOrdersByDate(data);
  };

  const fetchTotalOrders = async () => {
    try {
      const { count, error } = await supabase
        .schema('operations')
        .from('orders')
        .select('id_order', { count: 'exact', head: true });

      if (error) throw error;

      setTotalOrders(count || 0);
    } catch (err) {
      console.error('Error fetching total orders:', err.message);
    }
  };
  // Clientes por distrito + ubicaciones
  const fetchDistrictsAndClients = async () => {
    // Distritos
    const { data: districtData, error: districtError } = await supabase
      .schema('operations')
      .from('districts')
      .select('*');

    if (districtError) throw districtError;

    setDistricts(districtData || []);

    // Clientes
    const { data: clientsData, error: clientsError } = await supabase
      .schema('operations')
      .from('clients')
      .select('id_client, name, district_id, latitude, longitude');

    if (clientsError) throw clientsError;

    const counts = {};
    const locations = [];

    clientsData.forEach((c) => {
      if (c.district_id) {
        counts[c.district_id] = (counts[c.district_id] || 0) + 1;
      }

      if (c.latitude && c.longitude) {
        locations.push(c);
      }
    });

    console.log(districtData);
    const chartData = districtData.map((d) => ({
      name: d.name,
      clientes: counts[d.district_id] || 0,
    }));

    setClientsPerDistrict(chartData);
    setClientLocations(locations);
  };

  // Inicialización
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchClientCount(), fetchDistrictsAndClients(), fetchTotalOrders(), fetchOrdersByDate()]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [supabase]);

  return {
    clientCount,
    districts,
    totalOrders,
    clientsPerDistrict,
    ordersByDate,
    clientLocations,
    loading,
    error,
  };
};
