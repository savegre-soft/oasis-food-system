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
} from 'recharts';
import { Link } from 'react-router-dom';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useDashboardData } from '../hooks/useDashboardData';
import { useMemo } from 'react';

// Fix iconos leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function Main() {
  const {
    clientCount,
    clientsPerDistrict,
    clientLocations,
    loading,
    totalOrders,
    ordersByDate,
    error,
  } = useDashboardData();

  // 🔥 Transformar ordersByDate para la gráfica
  const ordersChartData = useMemo(() => {
    if (!ordersByDate) return [];

    const grouped = {};

    ordersByDate.forEach((order) => {
      const key = `${order.week_start_date} - ${order.week_end_date}`;

      if (!grouped[key]) {
        grouped[key] = 0;
      }

      grouped[key]++;
    });

    return Object.keys(grouped).map((week) => ({
      week,
      pedidos: grouped[week],
    }));
  }, [ordersByDate]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

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
          <h2 className="text-gray-500">Pedidos</h2>
          <p className="text-3xl font-bold mt-2">{totalOrders}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Clientes por distrito */}
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

      {/* 🔥 Nueva gráfica de pedidos */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Pedidos por Semana</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ordersChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="pedidos" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mapa */}
      <div className="relative z-0 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Mapa de Clientes</h2>

        <MapContainer center={[9.9333, -84.0833]} zoom={10} className="h-[400px] w-full rounded-xl">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {clientLocations.map((c) => (
            <Marker key={c.id_client} position={[c.latitude, c.longitude]}>
              <Popup>
                <div className="p-1">
                  <h3 className="text-sm font-semibold text-gray-800">{c.name}</h3>

                  <p className="text-xs text-gray-500 mb-2">Cliente registrado</p>

                  <Link
                    to={`/cliente/${c.id_client}`}
                    className="inline-block text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
