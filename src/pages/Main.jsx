import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const data = [
  { name: "Ene", ventas: 400, usuarios: 240 },
  { name: "Feb", ventas: 300, usuarios: 139 },
  { name: "Mar", ventas: 500, usuarios: 380 },
  { name: "Abr", ventas: 478, usuarios: 390 },
  { name: "May", ventas: 589, usuarios: 480 },
  { name: "Jun", ventas: 439, usuarios: 380 },
];

export default function Main() {
  return (
    <div className="p-6 bg-gray-100 rounded min-h-screen">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-gray-500">Usuarios</h2>
          <p className="text-3xl font-bold mt-2">1,245</p>
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

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Ventas Mensuales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Usuarios Activos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="usuarios" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}