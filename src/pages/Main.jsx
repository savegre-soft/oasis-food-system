// src/pages/Main.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useApp } from "../context/AppContext";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import HeatmapLayer from "../components/HeatmapLayer"; // tu componente personalizado

const salesData = [
  { name: "Ene", ventas: 400, usuarios: 240 },
  { name: "Feb", ventas: 300, usuarios: 139 },
  { name: "Mar", ventas: 500, usuarios: 380 },
  { name: "Abr", ventas: 478, usuarios: 390 },
  { name: "May", ventas: 589, usuarios: 480 },
  { name: "Jun", ventas: 439, usuarios: 380 },
];

export default function Main() {
  const { supabase } = useApp();

  const [clientCount, setClientCount] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [clientsPerDistrict, setClientsPerDistrict] = useState([]);
  const [clientLocations, setClientLocations] = useState([]);

  // Obtener cantidad total de clientes
  useEffect(() => {
    const fetchClientCount = async () => {
      try {
        const { count, error } = await supabase
          .schema("operations")
          .from("clients")
          .select("id", { count: "exact", head: true });
        if (error) throw error;
        setClientCount(count || 0);
      } catch (err) {
        console.error("Error fetching clients count:", err.message);
      }
    };
    fetchClientCount();
  }, [supabase]);

  // Clientes por distrito y ubicaciones GPS
  useEffect(() => {
    const fetchDistrictsAndClients = async () => {
      try {
        // Obtener distritos
        const { data: districtData, error: districtError } = await supabase
          .schema("operations")
          .from("districts")
          .select("*");
        if (districtError) throw districtError;
        setDistricts(districtData || []);

        // Obtener clientes
        const { data: clientsData, error: clientsError } = await supabase
          .schema("operations")
          .from("clients")
          .select("district_id, latitude, longitude");
        if (clientsError) throw clientsError;

        // Contar clientes por distrito
        const counts = {};
        const locations = [];
        clientsData.forEach((c) => {
          if (c.district_id) counts[c.district_id] = (counts[c.district_id] || 0) + 1;
          if (c.latitude && c.longitude) locations.push([c.latitude, c.longitude, 0.5]);
        });

        // Preparar datos para BarChart
        const chartData = districtData.map((d) => ({
          name: d.name,
          clientes: counts[d.id] || 0,
        }));

        setClientsPerDistrict(chartData);
        setClientLocations(locations);
      } catch (err) {
        console.error("Error fetching clients per district:", err);
      }
    };
    fetchDistrictsAndClients();
  }, [supabase]);

  return (
    <div className="p-6 bg-gray-100 rounded min-h-screen">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-gray-500">Clientes</h2>
          <p className="text-3xl font-bold mt-2">{clientCount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-gray-500">Ventas</h2>
          <p className="text-3xl font-bold mt-2">$12,340</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-gray-500">Pedidos</h2>
          <p className="text-3xl font-bold mt-2">320</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas Mensuales */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Ventas Mensuales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Clientes por Distrito */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Clientes por Distrito</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientsPerDistrict}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clientes" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mapa de Calor */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Mapa de Clientes</h2>
        <MapContainer
          center={[9.9333, -84.0833]}
          zoom={10}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {clientLocations.length > 0 && <HeatmapLayer points={clientLocations} />}
        </MapContainer>
      </div>
    </div>
  );
}