import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import ChartCard from '../ChartCard';
import DateRangeFilter from '../DateRangeFilter';
import { fmtCRC, renderDonutLabel, TYPE_PIE_COLORS, STATUS_PIE_COLORS, CLIENT_BAR_COLORS } from '../../utils/chartUtils';

const PaymentStats = ({ chartRange, setChartRange, chartData, chartPayments }) => {
  const {
    incomeByDay, incomeByType, incomeByStatus,
    topClients, weeklyData,
    totalChart, pendingChart, cancelledChart,
  } = chartData;

  const periodLabel = `${chartRange.from} → ${chartRange.to}`;
  const confirmedChart = totalChart - pendingChart - cancelledChart;

  return (
    <div className="space-y-5">
      <DateRangeFilter dateRange={chartRange} setDateRange={setChartRange} accent="emerald" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Total en el período</p>
          <p className="text-2xl font-bold text-slate-800">{fmtCRC(totalChart)}</p>
          <p className="text-xs text-gray-400 mt-1">{chartPayments.length} pago{chartPayments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Confirmados</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtCRC(confirmedChart)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalChart > 0 ? `${((confirmedChart / totalChart) * 100).toFixed(0)}% del total` : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-500">{fmtCRC(pendingChart)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalChart > 0 ? `${((pendingChart / totalChart) * 100).toFixed(0)}% del total` : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Cancelados</p>
          <p className="text-2xl font-bold text-red-500">{fmtCRC(cancelledChart)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalChart > 0 ? `${((cancelledChart / totalChart) * 100).toFixed(0)}% del total` : '—'}</p>
        </div>
      </div>

      <ChartCard title="Ingresos por día" sub={periodLabel}>
        {incomeByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Flujo acumulado de ingresos" sub={periodLabel}>
        {incomeByDay.every((d) => d.acumulado === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Acumulado']} />
              <Area type="monotone" dataKey="acumulado" stroke="#10b981" strokeWidth={2.5} fill="url(#gradIncome)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Ingresos por tipo de pago" sub={periodLabel}>
          {incomeByType.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={incomeByType} cx="50%" cy="45%" innerRadius={65} outerRadius={95} dataKey="value" labelLine={false} label={renderDonutLabel}>
                  {incomeByType.map((_, i) => <Cell key={i} fill={TYPE_PIE_COLORS[i % TYPE_PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estado de pagos" sub={periodLabel}>
          {incomeByStatus.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={incomeByStatus} cx="50%" cy="45%" innerRadius={65} outerRadius={95} dataKey="value" labelLine={false} label={renderDonutLabel}>
                  {incomeByStatus.map((_, i) => <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Top clientes por ingreso" sub={periodLabel}>
        {topClients.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, topClients.length * 42)}>
            <BarChart layout="vertical" data={topClients} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {topClients.map((_, i) => <Cell key={i} fill={CLIENT_BAR_COLORS[i % CLIENT_BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {weeklyData.length > 1 && (
        <ChartCard title="Comparativa semanal" sub="Ingresos totales por semana en el período">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default PaymentStats;
