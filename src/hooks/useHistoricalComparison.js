import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getPreviousPeriod, getSameRangeLastYear } from '../utils/chartUtils';

/**
 * @typedef {Object} PeriodTotals
 * @property {string} from
 * @property {string} to
 * @property {number} ingresos
 * @property {number} gastos
 * @property {number} balance
 */

const fetchPeriodTotals = async (supabase, { from, to }) => {
  const [{ data: payData }, { data: expData }, { data: empData }] = await Promise.all([
    supabase
      .schema('operations')
      .from('payments')
      .select('amount, status')
      .gte('payment_date', from)
      .lte('payment_date', to),
    supabase
      .schema('operations')
      .from('expenses')
      .select('amount')
      .gte('expense_date', from)
      .lte('expense_date', to),
    supabase
      .schema('operations')
      .from('empCost')
      .select('Amount')
      .gte('WorkDate', from)
      .lte('WorkDate', to),
  ]);

  const ingresos = (payData || [])
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const gastos =
    (expData || []).reduce((s, e) => s + (e.amount || 0), 0) +
    (empData || []).reduce((s, e) => s + (e.Amount || 0), 0);

  return { from, to, ingresos, gastos, balance: ingresos - gastos };
};

/**
 * Totales de ingresos/gastos/balance del período anterior (misma duración) y
 * del mismo período del año pasado, para mostrar crecimiento MoM/YoY junto a
 * los totales del período seleccionado.
 *
 * @param {{ from: string, to: string }} dateRange
 * @returns {{ previous: PeriodTotals|null, yoy: PeriodTotals|null, loading: boolean }}
 */
export const useHistoricalComparison = (dateRange) => {
  const { supabase } = useApp();
  const [previous, setPrevious] = useState(null);
  const [yoy, setYoy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [prevTotals, yoyTotals] = await Promise.all([
          fetchPeriodTotals(supabase, getPreviousPeriod(dateRange)),
          fetchPeriodTotals(supabase, getSameRangeLastYear(dateRange)),
        ]);
        if (cancelled) return;
        setPrevious(prevTotals);
        setYoy(yoyTotals);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dateRange, supabase]);

  return { previous, yoy, loading };
};
