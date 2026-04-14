import { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Hash } from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import ChartCard from '../ChartCard';
import StatCard from './StatCard';
import {
  isoWeekMonday, fmtCRC, renderDonutLabel,
  ING_COLOR, TYPE_PIE_COLORS, STATUS_PIE_COLORS, CLIENT_BAR_COLORS,
} from '../../utils/chartUtils';

const IngresosPanel = ({ payments, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const {
    incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData,
    totalChart, pendingChart, cancelledChart,
  } = useMemo(() => {
    const dayMap = {};
    for (
      let d = new Date(dateRange.from + 'T00:00:00');
      d <= new Date(dateRange.to + 'T00:00:00');
      d.setDate(d.getDate() + 1)
    ) {
      dayMap[d.toISOString().split('T')[0]] = 0;
    }

    const typeMap = { monthly: 0, weekly: 0, express: 0 };
    const statusMap = { pending: 0, cancelled: 0 };
    const clientMap = {};
    const weekMap = {};

    payments.forEach((p) => {
      const amt = p.amount || 0;
      if (p.payment_date in dayMap) dayMap[p.payment_date] += amt;
      if (p.payment_type in typeMap) typeMap[p.payment_type] += amt;
      if (p.status in statusMap) statusMap[p.status] += amt;
      const name = p.clients?.name || `Cliente ${p.client_id}`;
      clientMap[name] = (clientMap[name] || 0) + amt;
      const wk = isoWeekMonday(p.payment_date);
      weekMap[wk] = (weekMap[wk] || 0) + amt;
    });

    let running = 0;
    const incomeByDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => {
        running += total;
        return { date: date.slice(5).replace('-', '/'), total, acumulado: running };
      });

    const incomeByType = [
      { name: 'Mensual', value: typeMap.monthly },
      { name: 'Semanal', value: typeMap.weekly },
      { name: 'Express', value: typeMap.express },
    ].filter((x) => x.value > 0);

    const incomeByStatus = [
      { name: 'Pendiente', value: statusMap.pending },
      { name: 'Cancelado', value: statusMap.cancelled },
    ].filter((x) => x.value > 0);

    const topClients = Object.entries(clientMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const weeklyData = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ semana: date.slice(5).replace('-', '/'), total }));

    const totalChart = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingChart = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
    const cancelledChart = payments.filter((p) => p.status === 'cancelled').reduce((s, p) => s + (p.amount || 0), 0);

    return { incomeByDay, incomeByType, incomeByStatus, topClients, weeklyData, totalChart, pendingChart, cancelledChart };
  }, [payments, dateRange]);

  const confirmedChart = totalChart - pendingChart - cancelledChart;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={14} />}   label="Total en el período" value={loading ? '—' : fmtCRC(totalChart)}     sub={loading ? '' : `${payments.length} pago${payments.length !== 1 ? 's' : ''}`} accent="text-slate-800"  bg="bg-slate-100" iconColor="text-slate-600" />
        <StatCard icon={<TrendingUp size={14} />}   label="Confirmados"         value={loading ? '—' : fmtCRC(confirmedChart)} sub={totalChart > 0 ? `${((confirmedChart / totalChart) * 100).toFixed(0)}% del total` : '—'} accent="text-emerald-600" bg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={<Hash size={14} />}         label="Pendientes"          value={loading ? '—' : fmtCRC(pendingChart)}   sub={totalChart > 0 ? `${((pendingChart / totalChart) * 100).toFixed(0)}% del total` : '—'}   accent="text-amber-500"  bg="bg-amber-50"  iconColor="text-amber-500" />
        <StatCard icon={<TrendingDown size={14} />} label="Cancelados"          value={loading ? '—' : fmtCRC(cancelledChart)} sub={totalChart > 0 ? `${((cancelledChart / totalChart) * 100).toFixed(0)}% del total` : '—'}  accent="text-red-500"    bg="bg-red-50"    iconColor="text-red-500" />
      </div>

      <ChartCard title="Ingresos por día" sub={periodLabel} loading={loading}>
        {incomeByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Ingresos']} />
              <Bar dataKey="total" fill={ING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Flujo acumulado de ingresos" sub={periodLabel} loading={loading}>
        {incomeByDay.every((d) => d.acumulado === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incomeByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sGradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ING_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={ING_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(incomeByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Acumulado']} />
              <Area type="monotone" dataKey="acumulado" stroke={ING_COLOR} strokeWidth={2.5} fill="url(#sGradIncome)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Ingresos por tipo de pago" sub={periodLabel} loading={loading}>
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

        <ChartCard title="Estado de pagos" sub={periodLabel} loading={loading}>
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

      <ChartCard title="Top clientes por ingreso" sub={periodLabel} loading={loading}>
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
        <ChartCard title="Comparativa semanal" sub="Ingresos totales por semana" loading={loading}>
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

export default IngresosPanel;
