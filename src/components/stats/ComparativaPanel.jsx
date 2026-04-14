import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Scale, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';

import ChartCard from '../ChartCard';
import StatCard from './StatCard';
import { isoWeekMonday, fmtCRC, ING_COLOR, EXP_COLOR, BAL_COLOR } from '../../utils/chartUtils';

const ComparativaPanel = ({ expenses, empCosts, payments, dateRange, loading }) => {
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const { vsByDay, weeklyVs, totalIngresos, totalGastos, balance } = useMemo(() => {
    const dayMap = {};
    for (
      let d = new Date(dateRange.from + 'T00:00:00');
      d <= new Date(dateRange.to + 'T00:00:00');
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { ingresos: 0, gastos: 0 };
    }

    const weekMap = {};

    payments.forEach((p) => {
      const amt = p.amount || 0;
      if (p.payment_date in dayMap) dayMap[p.payment_date].ingresos += amt;
      const wk = isoWeekMonday(p.payment_date);
      if (!weekMap[wk]) weekMap[wk] = { ingresos: 0, gastos: 0 };
      weekMap[wk].ingresos += amt;
    });

    expenses.forEach((e) => {
      const amt = e.amount || 0;
      if (e.expense_date in dayMap) dayMap[e.expense_date].gastos += amt;
      const wk = isoWeekMonday(e.expense_date);
      if (!weekMap[wk]) weekMap[wk] = { ingresos: 0, gastos: 0 };
      weekMap[wk].gastos += amt;
    });

    empCosts.forEach((e) => {
      const amt = e.Amount || 0;
      if (e.WorkDate in dayMap) dayMap[e.WorkDate].gastos += amt;
      const wk = isoWeekMonday(e.WorkDate);
      if (!weekMap[wk]) weekMap[wk] = { ingresos: 0, gastos: 0 };
      weekMap[wk].gastos += amt;
    });

    let runIngresos = 0, runGastos = 0;
    const vsByDay = Object.keys(dayMap).sort().map((date) => {
      const { ingresos, gastos } = dayMap[date];
      runIngresos += ingresos;
      runGastos += gastos;
      return {
        date: date.slice(5).replace('-', '/'),
        ingresos, gastos,
        balance: ingresos - gastos,
        acumIngresos: runIngresos,
        acumGastos: runGastos,
        acumBalance: runIngresos - runGastos,
      };
    });

    const weeklyVs = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { ingresos, gastos }]) => ({
        semana: date.slice(5).replace('-', '/'), ingresos, gastos, balance: ingresos - gastos,
      }));

    const totalIngresos = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalGastos =
      expenses.reduce((s, e) => s + (e.amount || 0), 0) +
      empCosts.reduce((s, e) => s + (e.Amount || 0), 0);

    return { vsByDay, weeklyVs, totalIngresos, totalGastos, balance: totalIngresos - totalGastos };
  }, [expenses, empCosts, payments, dateRange]);

  const ratio = totalGastos > 0 && totalIngresos > 0
    ? ((totalGastos / totalIngresos) * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={14} />}  label="Total Ingresos"         value={loading ? '—' : fmtCRC(totalIngresos)} sub={periodLabel}                    accent="text-emerald-600"                          bg="bg-emerald-50"                         iconColor="text-emerald-600" />
        <StatCard icon={<TrendingDown size={14} />} label="Total Gastos"           value={loading ? '—' : fmtCRC(totalGastos)}   sub="Operativos + Personal"           accent="text-orange-500"                           bg="bg-orange-50"                          iconColor="text-orange-500" />
        <StatCard
          icon={<Scale size={14} />}
          label="Balance neto"
          value={loading ? '—' : fmtCRC(balance)}
          sub={balance >= 0 ? 'Superávit' : 'Déficit'}
          accent={balance >= 0 ? 'text-blue-600' : 'text-red-500'}
          bg={balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}
          iconColor={balance >= 0 ? 'text-blue-600' : 'text-red-500'}
        />
        <StatCard icon={<BarChart2 size={14} />}   label="Ratio gastos/ingresos"  value={loading ? '—' : (ratio !== null ? `${ratio}%` : '—')} sub="Gastos como % de ingresos" accent="text-slate-700" bg="bg-slate-100" iconColor="text-slate-500" />
      </div>

      <ChartCard title="Ingresos vs Gastos por día" sub={periodLabel} loading={loading}>
        {vsByDay.every((d) => d.ingresos === 0 && d.gastos === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(vsByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'ingresos' ? 'Ingresos' : 'Gastos']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'ingresos' ? 'Ingresos' : 'Gastos')} />
              <Bar dataKey="ingresos" fill={ING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Flujo acumulado: Ingresos vs Gastos" sub={periodLabel} loading={loading}>
        {vsByDay.every((d) => d.acumIngresos === 0 && d.acumGastos === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={vsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cGradInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ING_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={ING_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cGradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXP_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={EXP_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(vsByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'acumIngresos' ? 'Ingresos (acum.)' : 'Gastos (acum.)']} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'acumIngresos' ? 'Ingresos (acum.)' : 'Gastos (acum.)')} />
              <Area type="monotone" dataKey="acumIngresos" stroke={ING_COLOR} strokeWidth={2.5} fill="url(#cGradInc)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="acumGastos" stroke={EXP_COLOR} strokeWidth={2.5} fill="url(#cGradExp)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Balance neto por día" sub="Ingresos – Gastos" loading={loading}>
        {vsByDay.every((d) => d.balance === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(vsByDay.length / 10) - 1)} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Balance']} />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {vsByDay.map((d, i) => <Cell key={i} fill={d.balance >= 0 ? BAL_COLOR : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {weeklyVs.length > 1 && (
        <ChartCard title="Comparativa semanal: Ingresos vs Gastos" sub="Por semana en el período" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyVs} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmtCRC(v), n === 'ingresos' ? 'Ingresos' : n === 'gastos' ? 'Gastos' : 'Balance']} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'ingresos' ? 'Ingresos' : v === 'gastos' ? 'Gastos' : 'Balance')} />
              <Bar dataKey="ingresos" fill={ING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="gastos" fill={EXP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default ComparativaPanel;
