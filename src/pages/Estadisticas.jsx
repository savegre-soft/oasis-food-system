import { useState } from 'react';
import { LayoutDashboard, TrendingDown, TrendingUp, Scale, Users, PackageSearch } from 'lucide-react';
import { useExpenseStatistics } from '../hooks/useExpenseStatistics';
import { usePaymentStatistics } from '../hooks/usePaymentStatistics';
import { useHistoricalComparison } from '../hooks/useHistoricalComparison';
import { getThisMonth } from '../hooks/useDashboardData';

import DateRangeFilter from '../components/DateRangeFilter';
import ResumenPanel from '../components/stats/ResumenPanel';
import GastosPanel from '../components/stats/GastosPanel';
import IngresosPanel from '../components/stats/IngresosPanel';
import ComparativaPanel from '../components/stats/ComparativaPanel';
import PlanillaPanel from '../components/stats/PlanillaPanel';
import ComboBulkPanel from '../components/stats/ComboBulkPanel';
import AuthRoles from '../components/auth/AuthRoles';

const TABS = [
  { key: 'resumen',      label: 'Resumen',                  accent: 'emerald', icon: LayoutDashboard },
  { key: 'gastos',       label: 'Gastos',                    accent: 'orange',  icon: TrendingDown },
  { key: 'ingresos',     label: 'Ingresos',                  accent: 'emerald', icon: TrendingUp },
  { key: 'comparativa',  label: 'Gastos vs Ingresos',        accent: 'blue',    icon: Scale },
  { key: 'planilla',     label: 'Planilla',                  accent: 'blue',    icon: Users },
  { key: 'combos',       label: 'Combos y Ventas Masivas',   accent: 'violet',  icon: PackageSearch },
];

const Estadisticas = () => {
  const [tab, setTab] = useState('resumen');
  const [dateRange, setDateRange] = useState(getThisMonth);

  const { expenses, empCosts, loading: loadingExp, error: errExp } = useExpenseStatistics(dateRange);
  const { payments, loading: loadingPay, error: errPay } = usePaymentStatistics(dateRange);
  const comparison = useHistoricalComparison(dateRange);

  const loading = loadingExp || loadingPay;
  const error   = errExp || errPay;
  const currentAccent = TABS.find((t) => t.key === tab)?.accent ?? 'emerald';

  if (error) return <p className="p-8 text-red-500 text-sm">Error: {error}</p>;

  return (

    <AuthRoles rolesNames={['Finanzas', 'Administrador']}>
    <div className="p-8 bg-slate-50 dark:bg-slate-900 min-h-screen space-y-5 transition-colors duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Estadísticas Financieras</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Un vistazo claro a la salud financiera del negocio, con comparación contra períodos anteriores.</p>
      </div>

      <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} accent={currentAccent} />

      <div className="flex flex-wrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen'     && <ResumenPanel     payments={payments} expenses={expenses} empCosts={empCosts} dateRange={dateRange} loading={loading} comparison={comparison} />}
      {tab === 'gastos'      && <GastosPanel      expenses={expenses} empCosts={empCosts} dateRange={dateRange} loading={loading} />}
      {tab === 'ingresos'    && <IngresosPanel    payments={payments} dateRange={dateRange} loading={loading} />}
      {tab === 'comparativa' && <ComparativaPanel expenses={expenses} empCosts={empCosts} payments={payments} dateRange={dateRange} loading={loading} comparison={comparison} />}
      {tab === 'planilla'    && <PlanillaPanel    empCosts={empCosts} dateRange={dateRange} loading={loading} />}
      {tab === 'combos'      && <ComboBulkPanel   payments={payments} dateRange={dateRange} loading={loading} />}
    </div>
    </AuthRoles>
  );
};

export default Estadisticas;
