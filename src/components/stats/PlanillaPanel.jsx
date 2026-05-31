import { useMemo } from 'react';
import { DollarSign, Users, TrendingDown, Hash } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import ChartCard from '../ChartCard';
import StatCard from './StatCard';
import { isoWeekMonday, fmtCRC, EMP_COLOR, CATEGORY_COLORS } from '../../utils/chartUtils';

const NET_COLOR = '#22c55e';
const DED_COLOR = '#ef4444';

const PlanillaPanel = ({ empCosts, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const { totalBruto, totalDeductions, totalNeto, byEmployee, byWeek, byType, dedByDesc } =
    useMemo(() => {
      const empMap = {};
      const weekMap = {};
      const typeCount = { hours: 0, days: 0 };
      const dedDescMap = {};

      let totalBruto = 0;
      let totalDeductions = 0;

      empCosts.forEach((e) => {
        const gross = Number(e.Amount) || 0;
        const ded = (e.emp_cost_deductions ?? []).reduce(
          (s, d) => s + (Number(d.amount) || 0),
          0
        );
        const net = gross - ded;

        totalBruto += gross;
        totalDeductions += ded;

        if (!empMap[e.Name]) empMap[e.Name] = { bruto: 0, neto: 0 };
        empMap[e.Name].bruto += gross;
        empMap[e.Name].neto += net;

        const wk = isoWeekMonday(e.WorkDate);
        if (!weekMap[wk]) weekMap[wk] = { bruto: 0, neto: 0 };
        weekMap[wk].bruto += gross;
        weekMap[wk].neto += net;

        const type = e.payment_type ?? 'hours';
        typeCount[type] = (typeCount[type] || 0) + 1;

        (e.emp_cost_deductions ?? []).forEach((d) => {
          dedDescMap[d.description] = (dedDescMap[d.description] || 0) + (Number(d.amount) || 0);
        });
      });

      const byEmployee = Object.entries(empMap)
        .map(([name, { bruto, neto }]) => ({ name, bruto, neto }))
        .sort((a, b) => b.bruto - a.bruto);

      const byWeek = Object.entries(weekMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { bruto, neto }]) => ({
          semana: date.slice(5).replace('-', '/'),
          bruto,
          neto,
        }));

      const byType = [
        { name: 'Por horas', value: typeCount.hours },
        { name: 'Por días', value: typeCount.days },
      ].filter((t) => t.value > 0);

      const dedByDesc = Object.entries(dedDescMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        totalBruto,
        totalDeductions,
        totalNeto: totalBruto - totalDeductions,
        byEmployee,
        byWeek,
        byType,
        dedByDesc,
      };
    }, [empCosts]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={14} />}
          label="Total Bruto"
          value={loading ? '—' : fmtCRC(totalBruto)}
          sub={`${empCosts.length} registros`}
          accent="text-indigo-600"
          bg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={<TrendingDown size={14} />}
          label="Total Deducciones"
          value={loading ? '—' : fmtCRC(totalDeductions)}
          sub={periodLabel}
          accent="text-red-500"
          bg="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard
          icon={<Users size={14} />}
          label="Neto a Pagar"
          value={loading ? '—' : fmtCRC(totalNeto)}
          sub={periodLabel}
          accent="text-green-600"
          bg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<Hash size={14} />}
          label="Pagos registrados"
          value={loading ? '—' : empCosts.length.toString()}
          sub="En el período"
          accent="text-slate-700"
          bg="bg-slate-100"
          iconColor="text-slate-500"
        />
      </div>

      {byEmployee.length > 0 && (
        <ChartCard title="Pagos por empleado" sub={periodLabel} loading={loading}>
          <ResponsiveContainer width="100%" height={Math.max(180, byEmployee.length * 44)}>
            <BarChart
              layout="vertical"
              data={byEmployee}
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v, n) => [fmtCRC(v), n === 'bruto' ? 'Bruto' : 'Neto']}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => (v === 'bruto' ? 'Bruto' : 'Neto')}
              />
              <Bar dataKey="bruto" fill={EMP_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} />
              <Bar dataKey="neto" fill={NET_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {byWeek.length > 0 && (
        <ChartCard title="Pagos por semana" sub={periodLabel} loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v, n) => [fmtCRC(v), n === 'bruto' ? 'Bruto' : 'Neto']}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => (v === 'bruto' ? 'Bruto' : 'Neto')}
              />
              <Bar dataKey="bruto" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="neto" fill={NET_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {byType.length > 0 && (
          <ChartCard title="Tipos de pago" sub="Cantidad de registros" loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  labelLine={false}
                >
                  {byType.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [`${v} pagos`, n]}
                />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {dedByDesc.length > 0 && (
          <ChartCard title="Deducciones por tipo" sub={periodLabel} loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={dedByDesc}
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                  tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [fmtCRC(v), 'Total']}
                />
                <Bar dataKey="value" fill={DED_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

export default PlanillaPanel;
