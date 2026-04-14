import { useMemo } from 'react';
import { DollarSign, Users, TrendingDown, Hash } from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import ChartCard from '../ChartCard';
import StatCard from './StatCard';
import {
  isoWeekMonday, fmtCRC, renderDonutLabel,
  EXP_COLOR, EMP_COLOR, CATEGORY_COLORS,
} from '../../utils/chartUtils';

const GastosPanel = ({ expenses, empCosts, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const { combinedByDay, categoryData, weeklyData, totalExpenses, totalEmp } = useMemo(() => {
    const dayMap = {};
    const empDayMap = {};
    for (
      let d = new Date(dateRange.from + 'T00:00:00');
      d <= new Date(dateRange.to + 'T00:00:00');
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
      empDayMap[key] = 0;
    }

    const categoryMap = {};
    const weekMap = {};

    expenses.forEach((e) => {
      const amt = e.amount || 0;
      if (e.expense_date in dayMap) dayMap[e.expense_date] += amt;
      const catName = e.expense_categories?.name || 'Otros';
      categoryMap[catName] = (categoryMap[catName] || 0) + amt;
      const wk = isoWeekMonday(e.expense_date);
      if (!weekMap[wk]) weekMap[wk] = { gastos: 0, personal: 0 };
      weekMap[wk].gastos += amt;
    });

    empCosts.forEach((e) => {
      const amt = e.Amount || 0;
      if (e.WorkDate in empDayMap) empDayMap[e.WorkDate] += amt;
      const wk = isoWeekMonday(e.WorkDate);
      if (!weekMap[wk]) weekMap[wk] = { gastos: 0, personal: 0 };
      weekMap[wk].personal += amt;
    });

    let runExp = 0, runEmp = 0;
    const combinedByDay = Object.keys(dayMap).sort().map((date) => {
      runExp += dayMap[date];
      runEmp += empDayMap[date];
      return {
        date: date.slice(5).replace('-', '/'),
        gastos: dayMap[date],
        personal: empDayMap[date],
        total: dayMap[date] + empDayMap[date],
        acumGastos: runExp,
        acumPersonal: runEmp,
        acumTotal: runExp + runEmp,
      };
    });

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const weeklyData = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { gastos, personal }]) => ({
        semana: date.slice(5).replace('-', '/'), gastos, personal, total: gastos + personal,
      }));

    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalEmp = empCosts.reduce((s, e) => s + (e.Amount || 0), 0);

    return { combinedByDay, categoryData, weeklyData, totalExpenses, totalEmp };
  }, [expenses, empCosts, dateRange]);

  const totalCombined = totalExpenses + totalEmp;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={14} />} label="Gastos operativos"  value={loading ? '—' : fmtCRC(totalExpenses)} sub={loading ? '' : `${expenses.length} registros`}  accent="text-orange-500" bg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard icon={<Users size={14} />}      label="Costo de personal"  value={loading ? '—' : fmtCRC(totalEmp)}      sub={loading ? '' : `${empCosts.length} registros`} accent="text-indigo-500" bg="bg-indigo-50" iconColor="text-indigo-500" />
        <StatCard icon={<TrendingDown size={14} />} label="Total combinado"  value={loading ? '—' : fmtCRC(totalCombined)} sub={periodLabel}                                    accent="text-slate-800"  bg="bg-slate-100" iconColor="text-slate-600" />
        <StatCard icon={<Hash size={14} />}        label="Registros totales" value={loading ? '—' : (expenses.length + empCosts.length).toLocaleString()} sub={loading ? '' : `${expenses.length} gastos · ${empCosts.length} personal`} accent="text-slate-700" bg="bg-slate-100" iconColor="text-slate-500" />
      </div>

      <ChartCard title="Gastos por día" sub={periodLabel} loading={loading}>
        {combinedByDay.every((d) => d.total === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin gastos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={combinedByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(combinedByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'gastos' ? 'Operativos' : 'Personal']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'gastos' ? 'Operativos' : 'Personal')} />
              <Bar dataKey="gastos" stackId="a" fill={EXP_COLOR} maxBarSize={32} />
              <Bar dataKey="personal" stackId="a" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Flujo acumulado de gastos" sub={periodLabel} loading={loading}>
        {combinedByDay.every((d) => d.acumTotal === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin gastos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={combinedByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sGradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXP_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EXP_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sGradEmp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMP_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EMP_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(combinedByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'acumGastos' ? 'Acum. Operativos' : 'Acum. Personal']} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'acumGastos' ? 'Operativos (acum.)' : 'Personal (acum.)')} />
              <Area type="monotone" dataKey="acumGastos" stroke={EXP_COLOR} strokeWidth={2} fill="url(#sGradExp)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="acumPersonal" stroke={EMP_COLOR} strokeWidth={2} fill="url(#sGradEmp)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Distribución por categoría" sub={periodLabel} loading={loading}>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={65} outerRadius={100} dataKey="value" labelLine={false} label={renderDonutLabel}>
                  {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gastos por categoría" sub={periodLabel} loading={loading}>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={categoryData} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Total']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {weeklyData.length > 1 && (
        <ChartCard title="Comparativa semanal" sub="Operativos vs Personal por semana" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'gastos' ? 'Operativos' : 'Personal']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'gastos' ? 'Operativos' : 'Personal')} />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="personal" fill={EMP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default GastosPanel;
