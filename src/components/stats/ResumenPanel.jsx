import { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Scale, Receipt, Users,
  AlertTriangle, ShieldCheck, Clock,
} from 'lucide-react';

import StatCard from './StatCard';
import TrendBadge from './TrendBadge';
import { fmtCRC, pctChange, buildIncomeStats, buildIngresosInsights } from '../../utils/chartUtils';

const ESTADO = {
  saludable: {
    label: 'Finanzas saludables',
    icon: ShieldCheck,
    className: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400',
  },
  atencion: {
    label: 'Requiere atención',
    icon: AlertTriangle,
    className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400',
  },
  critico: {
    label: 'Situación crítica',
    icon: AlertTriangle,
    className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400',
  },
};

const ResumenPanel = ({ payments, expenses, empCosts, dateRange, loading, comparison }) => {
  const { previous, yoy, loading: comparisonLoading } = comparison;

  const {
    totalIngresos, totalGastos, balance,
    avgTicket, top5Concentration, overduePct, overdueAmount, avgCollectionDays, pendingCount,
  } = useMemo(() => {
    const totalIngresos = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
    const totalGastos =
      expenses.reduce((s, e) => s + (e.amount || 0), 0) +
      empCosts.reduce((s, e) => s + (e.Amount || 0), 0);

    const { topClients } = buildIncomeStats(payments, dateRange);
    const insights = buildIngresosInsights(payments, totalIngresos, topClients);

    return { totalIngresos, totalGastos, balance: totalIngresos - totalGastos, ...insights };
  }, [payments, expenses, empCosts, dateRange]);

  const estadoKey = balance < 0 ? 'critico' : overduePct >= 30 ? 'atencion' : 'saludable';
  const estado = ESTADO[estadoKey];
  const EstadoIcon = estado.icon;

  const trendPair = (currentValue, positiveIsGood) => (
    <div className="flex flex-col items-end gap-0.5">
      {comparisonLoading ? (
        <span className="text-[11px] text-slate-300 dark:text-slate-600">…</span>
      ) : (
        <>
          <TrendBadge pct={pctChange(currentValue.now, currentValue.prev)} label="vs período anterior" positiveIsGood={positiveIsGood} />
          <TrendBadge pct={pctChange(currentValue.now, currentValue.yoyVal)} label="vs año anterior" positiveIsGood={positiveIsGood} />
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${estado.className}`}>
        <EstadoIcon size={20} className="shrink-0" />
        <div>
          <p className="text-sm font-semibold">{estado.label}</p>
          <p className="text-xs opacity-80 mt-0.5">
            {estadoKey === 'critico' && 'Los gastos superaron a los ingresos en este período.'}
            {estadoKey === 'atencion' && `${overduePct.toFixed(0)}% de los cobros pendientes están atrasados — vale la pena darle seguimiento.`}
            {estadoKey === 'saludable' && 'Los ingresos cubren los gastos y la cobranza va al día.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={14} />} label="Ingresos totales"
          value={loading ? '—' : fmtCRC(totalIngresos)}
          sub="Cobrado en el período"
          accent="text-emerald-600" bg="bg-emerald-50" iconColor="text-emerald-600"
          trend={!loading && trendPair({ now: totalIngresos, prev: previous?.ingresos, yoyVal: yoy?.ingresos }, true)}
        />
        <StatCard
          icon={<TrendingDown size={14} />} label="Gastos totales"
          value={loading ? '—' : fmtCRC(totalGastos)}
          sub="Operativos + Personal"
          accent="text-orange-500" bg="bg-orange-50" iconColor="text-orange-500"
          trend={!loading && trendPair({ now: totalGastos, prev: previous?.gastos, yoyVal: yoy?.gastos }, false)}
        />
        <StatCard
          icon={<Scale size={14} />} label="Balance neto"
          value={loading ? '—' : fmtCRC(balance)}
          sub={balance >= 0 ? 'Superávit' : 'Déficit'}
          accent={balance >= 0 ? 'text-blue-600' : 'text-red-500'}
          bg={balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}
          iconColor={balance >= 0 ? 'text-blue-600' : 'text-red-500'}
          trend={!loading && trendPair({ now: balance, prev: previous?.balance, yoyVal: yoy?.balance }, true)}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Receipt size={14} />} label="Ticket promedio"
          value={loading ? '—' : fmtCRC(avgTicket)}
          sub="Por pago cobrado"
          accent="text-slate-800 dark:text-slate-100" bg="bg-slate-100 dark:bg-slate-700" iconColor="text-slate-500 dark:text-slate-400"
        />
        <StatCard
          icon={<Users size={14} />} label="Concentración top 5"
          value={loading ? '—' : `${top5Concentration.toFixed(0)}%`}
          sub="Del ingreso viene de tus 5 clientes principales"
          accent={top5Concentration >= 60 ? 'text-red-500' : top5Concentration >= 40 ? 'text-amber-500' : 'text-emerald-600'}
          bg={top5Concentration >= 60 ? 'bg-red-50' : top5Concentration >= 40 ? 'bg-amber-50' : 'bg-emerald-50'}
          iconColor={top5Concentration >= 60 ? 'text-red-500' : top5Concentration >= 40 ? 'text-amber-500' : 'text-emerald-600'}
        />
        <StatCard
          icon={<AlertTriangle size={14} />} label="Cobros atrasados"
          value={loading ? '—' : `${overduePct.toFixed(0)}%`}
          sub={loading ? '' : `${fmtCRC(overdueAmount)} de ${pendingCount} pago${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`}
          accent={overduePct >= 30 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}
          bg={overduePct >= 30 ? 'bg-red-50' : 'bg-slate-100 dark:bg-slate-700'}
          iconColor={overduePct >= 30 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}
        />
        <StatCard
          icon={<Clock size={14} />} label="Días promedio de cobro"
          value={loading ? '—' : (avgCollectionDays !== null ? avgCollectionDays.toFixed(0) : '—')}
          sub="Desde la fecha límite hasta el pago"
          accent="text-slate-700 dark:text-slate-300" bg="bg-slate-100 dark:bg-slate-700" iconColor="text-slate-500 dark:text-slate-400"
        />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
        Explora las pestañas de arriba para ver el detalle de Gastos, Ingresos, la comparativa día a día y Planilla.
      </p>
    </div>
  );
};

export default ResumenPanel;
