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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import AuthRoles from '../components/auth/AuthRoles';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useDashboardData, getThisWeek, getLast, getThisMonth } from '../hooks/useDashboardData';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Colors ────────────────────────────────────────────────────────────────────

const CLASS_COLORS  = ['#f59e0b', '#6366f1', '#a855f7']; // Almuerzo / Cena / Familiar
const TYPE_COLORS   = ['#3b82f6', '#f97316'];             // Normal / Express
const CLIENT_COLORS = ['#10b981', '#94a3b8'];             // Activos / Inactivos

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = 'text-slate-800' }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const ChartCard = ({ title, sub, loading, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 relative">
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    ) : (
      children
    )}
  </div>
);

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Date range filter bar ─────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Esta semana', fn: getThisWeek },
  { label: 'Últimos 7 días', fn: () => getLast(7) },
  { label: 'Este mes', fn: getThisMonth },
  { label: 'Últimos 30 días', fn: () => getLast(30) },
];

const DateFilter = ({ dateRange, setDateRange }) => {
  const thisWeek = getThisWeek();
  const isPreset = (fn) => {
    const p = fn();
    return p.from === dateRange.from && p.to === dateRange.to;
  };

  return (
    <div className="bg-white rounded-2xl shadow px-5 py-4 flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-slate-500 shrink-0">Período</span>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ label, fn }) => (
          <button
            key={label}
            type="button"
            onClick={() => setDateRange(fn())}
            className={`text-xs px-3 py-1.5 rounded-xl border transition ${
              isPreset(fn)
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <span className="text-slate-200 hidden sm:block">|</span>

      {/* Manual inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.from}
          max={dateRange.to}
          onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date"
          value={dateRange.to}
          min={dateRange.from}
          onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Main() {
  const {
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
    loading,
    loadingFiltered,
    error,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="p-8 text-red-500 text-sm">Error: {error}</p>;
  }

  const inactiveClientCount = Math.max(0, clientCount - activeClientCount);
  const clientActivityData = [
    { name: 'Activos', value: activeClientCount },
    { name: 'Inactivos', value: inactiveClientCount },
  ];
  const orderTypeData = [
    { name: 'Normal', value: normalCount },
    { name: 'Express', value: expressCount },
  ];

  // Label for the stat cards sub-text
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-5">
    <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

      {/* ── Date filter ── */}
      <DateFilter dateRange={dateRange} setDateRange={setDateRange} />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Clientes totales"
          value={clientCount.toLocaleString()}
          sub="todos los registrados"
        />
        <StatCard
          label="Entregas en el período"
          value={loadingFiltered ? '—' : totalDeliveries.toLocaleString()}
          sub={periodLabel}
          accent="text-slate-800"
        />
        <StatCard
          label="Clientes atendidos"
          value={loadingFiltered ? '—' : activeClientCount.toLocaleString()}
          sub={
            !loadingFiltered && clientCount > 0
              ? `${((activeClientCount / clientCount) * 100).toFixed(0)}% del total`
              : '—'
          }
          accent="text-emerald-600"
        />
        <StatCard
          label="Express en el período"
          value={loadingFiltered ? '—' : expressCount.toLocaleString()}
          sub={
            !loadingFiltered && totalDeliveries > 0
              ? `${((expressCount / totalDeliveries) * 100).toFixed(0)}% de las entregas`
              : '—'
          }
          accent="text-orange-500"
        />
      </div>

      {/* ── Entregas por día ── */}
      <ChartCard
        title="Entregas por día"
        sub={periodLabel}
        loading={loadingFiltered}
      >
        {orderDaysByDate.every((d) => d.count === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin entregas en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={orderDaysByDate} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(orderDaysByDate.length / 10) - 1)}
                stroke="#cbd5e1"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [v, 'Entregas']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={orderDaysByDate.length <= 14}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Platos + Distribución ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Platos más pedidos" sub={periodLabel} loading={loadingFiltered}>
          {topRecipes.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={topRecipes} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [v, 'Unidades']}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribución de comidas" sub={periodLabel} loading={loadingFiltered}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={classificationDist}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={105}
                dataKey="value"
                labelLine={false}
                label={renderDonutLabel}
              >
                {classificationDist.map((_, i) => (
                  <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Tipo de orden + Clientes activos/inactivos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Órdenes por tipo" sub={periodLabel} loading={loadingFiltered}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={orderTypeData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={95}
                dataKey="value"
                labelLine={false}
                label={renderDonutLabel}
              >
                {orderTypeData.map((_, i) => (
                  <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Clientes activos vs inactivos"
          sub={`${activeClientCount} de ${clientCount} atendidos en el período`}
          loading={loadingFiltered}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={clientActivityData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={95}
                dataKey="value"
                labelLine={false}
                label={renderDonutLabel}
              >
                {clientActivityData.map((_, i) => (
                  <Cell key={i} fill={CLIENT_COLORS[i % CLIENT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Clientes por distrito (estático) ── */}
      <ChartCard title="Clientes por distrito" sub="todos los registrados">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={clientsPerDistrict} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
            <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v, 'Clientes']} />
            <Bar dataKey="clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Mapa ── */}
      <div className="relative z-0 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Mapa de clientes</h2>
        <p className="text-xs text-slate-400 mb-4">todos los registrados</p>
        <MapContainer center={[9.9333, -84.0833]} zoom={10} className="h-100 w-full rounded-xl">
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
