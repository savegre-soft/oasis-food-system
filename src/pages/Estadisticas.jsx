import { useState } from 'react';
import { useExpenseStatistics } from '../hooks/useExpenseStatistics';
import { usePaymentStatistics } from '../hooks/usePaymentStatistics';
import { getThisMonth } from '../hooks/useDashboardData';

import DateRangeFilter from '../components/DateRangeFilter';
import GastosPanel from '../components/stats/GastosPanel';
import IngresosPanel from '../components/stats/IngresosPanel';
import ComparativaPanel from '../components/stats/ComparativaPanel';

const TABS = [
  { key: 'gastos',      label: 'Gastos',            accent: 'orange'  },
  { key: 'ingresos',    label: 'Ingresos',           accent: 'emerald' },
  { key: 'comparativa', label: 'Gastos vs Ingresos', accent: 'blue'    },
];

const Estadisticas = () => {
  const [tab, setTab] = useState('gastos');
  const [dateRange, setDateRange] = useState(getThisMonth);

  const { expenses, empCosts, loading: loadingExp, error: errExp } = useExpenseStatistics(dateRange);
  const { payments, loading: loadingPay, error: errPay } = usePaymentStatistics(dateRange);

  const loading = loadingExp || loadingPay;
  const error   = errExp || errPay;
  const currentAccent = TABS.find((t) => t.key === tab)?.accent ?? 'emerald';

  if (error) return <p className="p-8 text-red-500 text-sm">Error: {error}</p>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-5">
      <h1 className="text-3xl font-bold text-slate-800">Estadísticas Financieras</h1>

      <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} accent={currentAccent} />

      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium transition ${
              tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'gastos'      && <GastosPanel     expenses={expenses} empCosts={empCosts} dateRange={dateRange} loading={loading} />}
      {tab === 'ingresos'    && <IngresosPanel    payments={payments} dateRange={dateRange} loading={loading} />}
      {tab === 'comparativa' && <ComparativaPanel expenses={expenses} empCosts={empCosts} payments={payments} dateRange={dateRange} loading={loading} />}
    </div>
  );
};

export default Estadisticas;
