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

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useDashboardData } from '../hooks/useDashboardData';

// Fix iconos leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Datos mock (puedes moverlos después a backend)
const salesData = [
  { name: 'Ene', ventas: 400, usuarios: 240 },
  { name: 'Feb', ventas: 300, usuarios: 139 },
  { name: 'Mar', ventas: 500, usuarios: 380 },
  { name: 'Abr', ventas: 478, usuarios: 390 },
  { name: 'May', ventas: 589, usuarios: 480 },
  { name: 'Jun', ventas: 439, usuarios: 380 },
];

export default function Main() {
  const {
    clientCount,
    clientsPerDistrict,
    clientLocations,
    loading,
    error,
  } = useDashboardData();

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
          <p className="text-3xl font-bold mt-2">
            {clientCount.toLocaleString()}
          </p>
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
        {/* Ventas */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            Ventas Mensuales
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ventas"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Clientes por distrito */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            Clientes por Distrito
          </h2>

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

      {/* Mapa */}
      <div className="relative z-0 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Mapa de Clientes
        </h2>

        <MapContainer
          center={[9.9333, -84.0833]}
          zoom={10}
          className="h-[400px] w-full rounded-xl"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {clientLocations.map((c) => (
            <Marker
              key={c.id_client}
              position={[c.latitude, c.longitude]}
            >
              <Popup>
                <strong>{c.name}</strong>
                <br />
                Distrito ID: {c.district_id}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}